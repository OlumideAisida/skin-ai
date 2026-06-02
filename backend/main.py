from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
import anthropic
import os
import json
import base64
import httpx
from datetime import datetime
from pathlib import Path

try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:3001",
        "https://skin-ai-production-d736.up.railway.app",
        "https://skin-ai-two.vercel.app",
        "https://skin-ai-git-main-olumide-aisida.vercel.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Config ────────────────────────────────────────────────────
api_key = os.getenv("ANTHROPIC_API_KEY")
if not api_key:
    raise ValueError("ANTHROPIC_API_KEY not found")
claude = anthropic.Anthropic(api_key=api_key)

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY")

DATA_DIR = Path(os.getenv("RAILWAY_VOLUME_MOUNT_PATH", "."))
FRAMES_DIR = DATA_DIR / "saved_frames"
FRAMES_DIR.mkdir(exist_ok=True)

security = HTTPBearer()


# ── Auth ──────────────────────────────────────────────────────
async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    async with httpx.AsyncClient() as client:
        res = await client.get(
            f"{SUPABASE_URL}/auth/v1/user",
            headers={
                "apikey": SUPABASE_SERVICE_KEY,
                "Authorization": f"Bearer {token}",
            }
        )
    if res.status_code != 200:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    return res.json()


# ── Supabase DB helpers ───────────────────────────────────────
async def db_insert(table: str, data: dict):
    async with httpx.AsyncClient() as client:
        res = await client.post(
            f"{SUPABASE_URL}/rest/v1/{table}",
            headers={
                "apikey": SUPABASE_SERVICE_KEY,
                "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
                "Content-Type": "application/json",
                "Prefer": "return=representation",
            },
            json=data,
        )
    return res.json()


async def db_select(table: str, filters: dict, limit: int = 10):
    params = {"limit": limit, "order": "created_at.desc"}
    for key, value in filters.items():
        params[key] = f"eq.{value}"
    async with httpx.AsyncClient() as client:
        res = await client.get(
            f"{SUPABASE_URL}/rest/v1/{table}",
            headers={
                "apikey": SUPABASE_SERVICE_KEY,
                "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
            },
            params=params,
        )
    return res.json()


async def db_delete(table: str, filters: dict):
    params = {}
    for key, value in filters.items():
        params[key] = f"eq.{value}"
    async with httpx.AsyncClient() as client:
        res = await client.delete(
            f"{SUPABASE_URL}/rest/v1/{table}",
            headers={
                "apikey": SUPABASE_SERVICE_KEY,
                "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
            },
            params=params,
        )
    return res.status_code


# ── Routes ────────────────────────────────────────────────────
class ImagePayload(BaseModel):
    image: str


@app.post("/analyze")
async def analyze_skin(payload: ImagePayload, user=Depends(get_current_user)):
    user_id = user["id"]

    # Save frame
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    frame_filename = f"frame_{user_id}_{timestamp}.jpg"
    frame_path = FRAMES_DIR / frame_filename
    image_bytes = base64.b64decode(payload.image)
    with open(frame_path, "wb") as f:
        f.write(image_bytes)

    # Get analysis
    report_msg = claude.messages.create(
        model="claude-haiku-4-5",
        max_tokens=1024,
        messages=[
            {
                "role": "user",
                "content": [
                    {
                        "type": "image",
                        "source": {
                            "type": "base64",
                            "media_type": "image/jpeg",
                            "data": payload.image,
                        },
                    },
                    {
                        "type": "text",
                   "text": (
                            "You are a clinical skin analysis assistant. Analyze the facial skin "
                            "in this image across all Fitzpatrick skin tones (I-VI). "
                            "Be culturally competent — do not assume lighter skin.\n\n"
                            "LIGHTING: If poorly lit, note it and adjust confidence.\n\n"
                            "Return a structured report with these sections:\n"
                            "1. Skin Tone (Fitzpatrick estimate + what it means for analysis)\n"
                            "2. Overall Condition (2-3 sentences on general skin health)\n"
                            "3. Key Issues (max 4 bullet points — type, location, severity)\n"
                            "4. Affected Zones (table: Forehead / Nose / Cheeks / Chin)\n"
                            "5. Severity Rating (Mild / Moderate / Severe with one sentence justification)\n"
                            "6. Skin Breakdown (texture, pore size, oil level, hydration level — "
                            "one line each)\n"
                            "7. Top 3 Recommendations (specific to detected issues and skin tone)\n\n"
                            "Keep the report under 300 words. Be direct, specific, and clinically "
                            "structured. End with a one-line medical disclaimer."
                        ),
                    },
                ],
            }
        ],
    )
    analysis_text = report_msg.content[0].text

    # Get scores
    scores_msg = claude.messages.create(
        model="claude-haiku-4-5",
        max_tokens=256,
        messages=[
            {
                "role": "user",
                "content": (
                    f"Based on this skin analysis report:\n\n{analysis_text}\n\n"
                    "Return ONLY a valid JSON object with these exact keys and integer values 0-100:\n"
                    '{"skin_health": <score>, "moisture": <score>, "clarity": <score>, '
                    '"evenness": <score>, "severity": <score>}\n'
                    "Return only the JSON. No explanation, no markdown."
                ),
            }
        ],
    )

    try:
        scores = json.loads(scores_msg.content[0].text.strip())
    except Exception:
        scores = {"skin_health": 70, "moisture": 65, "clarity": 70, "evenness": 65, "severity": 30}

    # Save to Supabase
    created_at = datetime.now().isoformat()
    try:
        await db_insert("reports", {
            "user_id": user_id,
            "analysis": analysis_text,
            "scores": scores,
            "frame_path": str(frame_path),
            "created_at": created_at,
        })
        print(f"✅ Report saved for user {user_id}")
    except Exception as e:
        print(f"❌ Failed to save: {e}")

    return {
        "analysis": analysis_text,
        "scores": scores,
        "saved_at": created_at,
    }


@app.get("/history")
async def get_history(user=Depends(get_current_user)):
    try:
        reports = await db_select("reports", {"user_id": user["id"]}, limit=10)
        return {"reports": reports}
    except Exception as e:
        print(f"❌ History error: {e}")
        return {"reports": []}


@app.delete("/history/{report_id}")
async def delete_report(report_id: str, user=Depends(get_current_user)):
    try:
        await db_delete("reports", {"id": report_id, "user_id": user["id"]})
        return {"deleted": report_id}
    except Exception as e:
        return {"error": str(e)}


@app.get("/")
@app.post("/analyze/deep")
async def deep_analyze(payload: ImagePayload, user=Depends(get_current_user)):
    user_id = user["id"]

    # Get last scan for comparison
    previous_analysis = None
    try:
        history = await db_select("reports", {"user_id": user_id}, limit=2)
        if history and len(history) > 0:
            previous_analysis = history[0].get("analysis", None)
    except Exception:
        pass

    comparison_context = ""
    if previous_analysis:
        comparison_context = (
            f"\n\nPREVIOUS SCAN FOR COMPARISON:\n{previous_analysis}\n\n"
            "Compare current findings to the previous scan and note any improvements "
            "or changes in the Weekly Progress section."
        )

    deep_msg = claude.messages.create(
        model="claude-haiku-4-5",
        max_tokens=2048,
        messages=[
            {
                "role": "user",
                "content": [
                    {
                        "type": "image",
                        "source": {
                            "type": "base64",
                            "media_type": "image/jpeg",
                            "data": payload.image,
                        },
                    },
                    {
                        "type": "text",
                        "text": (
                            "You are an advanced dermatology and wellness AI assistant. "
                            "Perform a comprehensive skin and wellness analysis based on "
                            "this facial image. Analyze across all Fitzpatrick skin tones "
                            "(I-VI) with full cultural competence.\n\n"

                            "Provide a DEEP ANALYSIS REPORT with these sections:\n\n"

                            "## 1. Detailed Skin Assessment\n"
                            "- Skin tone (Fitzpatrick type)\n"
                            "- Texture analysis (rough, smooth, uneven)\n"
                            "- Pore condition (enlarged, normal, congested)\n"
                            "- Oil/hydration balance\n"
                            "- Active issues with precise locations\n\n"

                            "## 2. Nutritional & Diet Suggestions\n"
                            "Based on visible skin conditions, suggest:\n"
                            "- 3-4 specific nutrients to increase\n"
                            "- Foods to add to diet\n"
                            "- Foods to reduce or avoid\n"
                            "- Hydration recommendations\n\n"

                            "## 3. Skincare Product Recommendations\n"
                            "- Specific ingredients to look for (e.g. niacinamide, salicylic acid)\n"
                            "- Ingredients to avoid for this skin type\n"
                            "- Morning routine steps\n"
                            "- Evening routine steps\n\n"

                            "## 4. Lifestyle Factors\n"
                            "- Sleep recommendations for skin recovery\n"
                            "- Stress management impact on detected issues\n"
                            "- Exercise considerations\n"
                            "- Environmental factors to address\n\n"

                            "## 5. Weekly Progress Tracking\n"
                            "- Current skin health summary\n"
                            "- Key metrics to track this week\n"
                            "- Expected improvements with recommended changes\n"
                            f"{comparison_context}\n\n"

                            "## 6. Priority Action Plan\n"
                            "List the top 5 most impactful changes ranked by priority.\n\n"

                            "Be specific, evidence-based, and culturally competent. "
                            "Tailor all recommendations to the detected skin tone. "
                            "End with a medical disclaimer."
                        ),
                    },
                ],
            }
        ],
    )

    deep_analysis = deep_msg.content[0].text

    return {
        "deep_analysis": deep_analysis,
        "generated_at": datetime.now().isoformat(),
    }
def root():
    return {"status": "SkinAI backend is running"}
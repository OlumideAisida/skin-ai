from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import anthropic
import os
import sqlite3
import json
import base64
from datetime import datetime
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass
from pathlib import Path

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "https://skin-ai-production-d736.up.railway.app", "https://skin-ai-two.vercel.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

api_key = os.getenv("ANTHROPIC_API_KEY")
if not api_key:
    raise ValueError("ANTHROPIC_API_KEY not found in environment")
client = anthropic.Anthropic(api_key=api_key)

# ── Ensure frames directory exists ──────────────────────────
FRAMES_DIR = Path("saved_frames")
FRAMES_DIR.mkdir(exist_ok=True)


def get_db():
    conn = sqlite3.connect("skin_reports.db")
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db()
    conn.execute("""
        CREATE TABLE IF NOT EXISTS reports (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            analysis    TEXT NOT NULL,
            scores      TEXT,
            frame_path  TEXT,
            created_at  TEXT NOT NULL
        )
    """)
    conn.commit()
    conn.close()

init_db()


class ImagePayload(BaseModel):
    image: str


@app.post("/analyze")
async def analyze_skin(payload: ImagePayload):

    # ── Step 1: Save the raw frame to disk ──────────────────
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    frame_filename = f"frame_{timestamp}.jpg"
    frame_path = FRAMES_DIR / frame_filename

    image_bytes = base64.b64decode(payload.image)
    with open(frame_path, "wb") as f:
        f.write(image_bytes)

    # ── Step 2: Get concise clinical report ─────────────────
    report_msg = client.messages.create(
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
                            "You are an advanced clinical skin analysis assistant trained to evaluate "
                            "facial skin across all skin tones, including deep melanin-rich complexions "
                            "on the Fitzpatrick scale (Type I through VI). You do NOT default to "
                            "assumptions based on lighter skin. Adjust your analysis accordingly.\n\n"

                            "LIGHTING AWARENESS:\n"
                            "If the image appears dark, overexposed, or poorly lit, note this clearly "
                            "and adjust your confidence level. Do not fabricate findings you cannot "
                            "confidently observe. State what is visible and what is unclear.\n\n"

                            "SKIN TONE CONTEXT:\n"
                            "- For deeper skin tones (Fitzpatrick IV-VI), hyperpigmentation and "
                            "post-inflammatory marks are common and should be assessed carefully.\n"
                            "- Redness may not be visible on deeper tones — look for texture, "
                            "raised bumps, and uneven surface instead.\n"
                            "- Ashiness or dryness may present differently on darker skin.\n\n"

                            "ACNE CLASSIFICATION:\n"
                            "Identify acne type where visible:\n"
                            "- Comedonal (blackheads/whiteheads)\n"
                            "- Inflammatory (papules/pustules)\n"
                            "- Nodular/Cystic (deep, painful)\n"
                            "- Post-inflammatory hyperpigmentation (PIH) from past breakouts\n\n"

                            "OUTPUT FORMAT — provide a structured report with these exact sections:\n"
                            "1. Skin Tone Assessment (Fitzpatrick estimate + what that means for analysis)\n"
                            "2. Overall Skin Condition\n"
                            "3. Detected Issues (type, location, severity for each)\n"
                            "4. Affected Zones (Forehead / Nose / Cheeks / Chin — use a table)\n"
                            "5. Severity Rating (Mild / Moderate / Severe with justification)\n"
                            "6. Recommended Next Steps (specific to detected issues and skin tone)\n"
                            "7. Confidence Note (flag anything unclear due to lighting or image quality)\n\n"

                            "Be clinically precise, honest, and culturally competent. "
                            "keep the entire report under 200-300 words"
                            "This is not a medical diagnosis — state this clearly at the end."
                        ),
                    },
                ],
            }
        ],
    )

    analysis_text = report_msg.content[0].text

    # ── Step 3: Extract numerical scores ────────────────────
    scores_msg = client.messages.create(
        model="claude-haiku-4-5",
        max_tokens=256,
        messages=[
            {
                "role": "user",
                "content": (
                    f"Based on this skin analysis report:\n\n{analysis_text}\n\n"
                    "Return ONLY a valid JSON object with these exact keys and integer values 0-100:\n"
                    "{\n"
                    '  "skin_health": <overall skin health score>,\n'
                    '  "moisture": <estimated moisture/hydration level>,\n'
                    '  "clarity": <skin clarity, inverse of acne/blemishes>,\n'
                    '  "evenness": <skin tone evenness, inverse of hyperpigmentation>,\n'
                    '  "severity": <acne/issue severity, 0=none 100=severe>\n'
                    "}\n"
                    "Return only the JSON. No explanation, no markdown, no extra text."
                ),
            }
        ],
    )

    try:
        scores = json.loads(scores_msg.content[0].text.strip())
    except Exception:
        scores = {
            "skin_health": 70,
            "moisture": 65,
            "clarity": 70,
            "evenness": 65,
            "severity": 30,
        }

    # ── Step 4: Save everything to database ─────────────────
    created_at = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    conn = get_db()
    conn.execute(
        "INSERT INTO reports (analysis, scores, frame_path, created_at) VALUES (?, ?, ?, ?)",
        (analysis_text, json.dumps(scores), str(frame_path), created_at)
    )
    conn.commit()
    conn.close()

    return {
        "analysis": analysis_text,
        "scores": scores,
        "frame_saved": frame_filename,
        "saved_at": created_at,
    }


@app.get("/history")
async def get_history():
    conn = get_db()
    rows = conn.execute(
        "SELECT id, analysis, scores, frame_path, created_at FROM reports ORDER BY created_at DESC LIMIT 10"
    ).fetchall()
    conn.close()
    return {
        "reports": [
            {
                **dict(row),
                "scores": json.loads(row["scores"]) if row["scores"] else None
            }
            for row in rows
        ]
    }


@app.delete("/history/{report_id}")
async def delete_report(report_id: int):
    conn = get_db()

    # Also delete the saved frame from disk
    row = conn.execute(
        "SELECT frame_path FROM reports WHERE id = ?", (report_id,)
    ).fetchone()

    if row and row["frame_path"]:
        frame = Path(row["frame_path"])
        if frame.exists():
            frame.unlink()

    conn.execute("DELETE FROM reports WHERE id = ?", (report_id,))
    conn.commit()
    conn.close()
    return {"deleted": report_id}


@app.get("/")
def root():
    return {"status": "SkinAI backend is running"}
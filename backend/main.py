from fastapi import FastAPI, HTTPException, Depends, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
import anthropic
import os
import json
import re
import base64
import httpx
import stripe
from datetime import datetime
from pathlib import Path

try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass
def strip_emojis(text: str) -> str:
    emoji_pattern = re.compile(
        "[\U0001F000-\U0001FFFF"
        "\U00002600-\U000027BF"
        "\U0001F300-\U0001F9FF"
        "\U00002700-\U000027BF"
        "\U000024C2-\U0001F251]+",
        flags=re.UNICODE
    )
    return emoji_pattern.sub("", text).strip()

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

stripe.api_key = os.getenv("STRIPE_SECRET_KEY")
STRIPE_PRICE_ID = os.getenv("STRIPE_PRICE_ID")
STRIPE_WEBHOOK_SECRET = os.getenv("STRIPE_WEBHOOK_SECRET")

FRONTEND_URL = os.getenv("FRONTEND_URL", "https://skin-ai-two.vercel.app")

DATA_DIR = Path(os.getenv("RAILWAY_VOLUME_MOUNT_PATH", "."))
FRAMES_DIR = DATA_DIR / "saved_frames"
FRAMES_DIR.mkdir(exist_ok=True)

security = HTTPBearer()
FREE_DEEP_ANALYSIS_LIMIT = 2


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


async def db_update(table: str, filters: dict, data: dict):
    params = {}
    for key, value in filters.items():
        params[key] = f"eq.{value}"
    async with httpx.AsyncClient() as client:
        res = await client.patch(
            f"{SUPABASE_URL}/rest/v1/{table}",
            headers={
                "apikey": SUPABASE_SERVICE_KEY,
                "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
                "Content-Type": "application/json",
                "Prefer": "return=representation",
            },
            params=params,
            json=data,
        )
    return res.json()


async def get_user_profile(user_id: str):
    profiles = await db_select("profiles", {"id": user_id}, limit=1)
    if not profiles or len(profiles) == 0:
        await db_insert("profiles", {
            "id": user_id,
            "deep_analysis_count": 0,
            "is_subscribed": False,
        })
        return {"id": user_id, "deep_analysis_count": 0, "is_subscribed": False}
    return profiles[0]


# ── Models ────────────────────────────────────────────────────
class ImagePayload(BaseModel):
    image: str
    concern: str = None


# ── Basic scan ────────────────────────────────────────────────
@app.post("/analyze")
async def analyze_skin(payload: ImagePayload, user=Depends(get_current_user)):
    user_id = user["id"]

    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    frame_filename = f"frame_{user_id}_{timestamp}.jpg"
    frame_path = FRAMES_DIR / frame_filename
    image_bytes = base64.b64decode(payload.image)
    with open(frame_path, "wb") as f:
        f.write(image_bytes)

    concern_context = ""
    if payload.concern:
        concern_context = (
            f"\n\nFOCUS AREA: The user is specifically concerned about {payload.concern.upper()}. "
            f"Give extra attention to this concern throughout the report, "
            f"especially in Key Issues and Recommendations sections."
        )

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
                            "6. Skin Breakdown (texture, pore size, oil level, hydration level — one line each)\n"
                            "7. Top 3 Recommendations (specific to detected issues and skin tone)\n\n"
                            "Keep the report under 300 words. Be direct, specific, and clinically "
                            "structured. End with a one-line medical disclaimer."
                            + concern_context
                        ),
                    },
                ],
            }
        ],
    )
    analysis_text = report_msg.content[0].text

    scores_msg = claude.messages.create(
    model="claude-haiku-4-5",
    max_tokens=256,
    messages=[
        {
            "role": "user",
            "content": (
                f"Based on this skin analysis report:\n\n{analysis_text}\n\n"
                "Return ONLY a valid JSON object with these exact keys and integer values 0-100.\n\n"
                "SCORING RULES — be precise and differentiated, never default to 65-75:\n"
                "- skin_health: overall skin condition. 85-100=excellent, 70-84=good, 50-69=moderate issues, 30-49=significant issues, 0-29=severe\n"
                "- moisture: hydration level. 85+=well hydrated, 60-84=adequate, 40-59=slightly dry, 20-39=dry, 0-19=very dry\n"
                "- clarity: absence of blemishes/hyperpigmentation/uneven tone. 85+=very clear, 60-84=minor issues, 40-59=moderate, 20-39=significant, 0-19=severe\n"
                "- evenness: skin tone uniformity. 85+=very even, 60-84=minor variation, 40-59=moderate unevenness, 20-39=significant, 0-19=severe\n"
                "- severity: severity of detected issues (higher=worse). 0-19=none, 20-39=mild, 40-59=moderate, 60-79=significant, 80-100=severe\n\n"
                "Base scores STRICTLY on what the report says. If report says mild issues score 55-65. "
                "If report says no issues score 80-90. Never give 70 as a default.\n\n"
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


# ── History ───────────────────────────────────────────────────
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


# ── Deep Analysis ─────────────────────────────────────────────
@app.post("/analyze/deep")
async def deep_analyze(payload: ImagePayload, user=Depends(get_current_user)):
    user_id = user["id"]

    profile = await get_user_profile(user_id)
    is_subscribed = profile.get("is_subscribed", False)
    deep_count = profile.get("deep_analysis_count", 0)

    if not is_subscribed and deep_count >= FREE_DEEP_ANALYSIS_LIMIT:
        raise HTTPException(
            status_code=402,
            detail={
                "code": "PAYWALL",
                "message": "You have used your 2 free deep analyses. Subscribe for unlimited access.",
                "deep_analysis_count": deep_count,
            }
        )

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
            "In the progress section, note 1-2 key changes compared to the previous scan."
        )

    concern_context = ""
    if payload.concern:
        concern_context = (
            f"\n\nFOCUS AREA: The user is specifically concerned about {payload.concern.upper()}. "
            f"Weight all sections toward this concern. In skincare, nutrition, and action plan, "
            f"prioritize recommendations that directly address {payload.concern}."
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
                            "You are an advanced dermatology AI assistant. Analyze this facial image "
                            "across all Fitzpatrick skin tones (I-VI) with full cultural competence.\n\n"
                            "Return ONLY a valid JSON object with this exact structure. "
                            "No markdown, no explanation, just the JSON:\n\n"
                            "{\n"
                            '  "skin_assessment": {\n'
                            '    "fitzpatrick": "Type X — one line description",\n'
                            '    "summary": ["bullet 1", "bullet 2", "bullet 3"],\n'
                            '    "detail": ["pore condition detail", "oil balance detail", "active issue with location"]\n'
                            '  },\n'
                            '  "nutrition": {\n'
                            '    "summary": ["key nutrient to increase", "top food to add"],\n'
                            '    "detail": ["nutrient 2", "nutrient 3", "food to reduce", "hydration tip"]\n'
                            '  },\n'
                            '  "skincare": {\n'
                            '    "summary": ["morning step 1", "morning step 2"],\n'
                            '    "detail": ["evening step 1", "evening step 2", "ingredient to look for", "ingredient to avoid"]\n'
                            '  },\n'
                            '  "lifestyle": {\n'
                            '    "summary": ["most impactful lifestyle tip", "second tip"],\n'
                            '    "detail": ["sleep recommendation", "stress management tip", "exercise consideration"]\n'
                            '  },\n'
                            '  "progress": {\n'
                            '    "summary": ["current skin health summary in one sentence", "top metric to track this week"],\n'
                            '    "detail": ["expected improvement 1", "expected improvement 2"]\n'
                            '  },\n'
                            '  "action_plan": {\n'
                            '    "summary": ["priority action 1", "priority action 2", "priority action 3"],\n'
                            '    "detail": ["priority action 4", "priority action 5"]\n'
                            '  },\n'
                            '  "disclaimer": "One line medical disclaimer."\n'
                            "}\n\n"
                            "Each bullet point should be one concise sentence. "
                            "Be specific to the detected skin tone and visible conditions."
                            + concern_context
                            + comparison_context
                        ),
                    },
                ],
            }
        ],
    )

    raw = deep_msg.content[0].text.strip()
    try:
        if raw.startswith("```"):
            raw = raw.split("```")[1]
            if raw.startswith("json"):
                raw = raw[4:]
        deep_data = json.loads(raw)
    except Exception:
        deep_data = {
            "skin_assessment": {
                "fitzpatrick": "Analysis completed",
                "summary": ["Skin analysis performed", "Results processed", "See recommendations below"],
                "detail": ["Detailed assessment available", "Consult a dermatologist for clinical diagnosis"]
            },
            "nutrition": {
                "summary": ["Increase antioxidant-rich foods", "Stay well hydrated"],
                "detail": ["Add leafy greens", "Reduce processed sugars", "Drink 8 glasses of water daily", "Consider omega-3 supplements"]
            },
            "skincare": {
                "summary": ["Use a gentle cleanser morning and night", "Apply SPF 30+ daily"],
                "detail": ["Use retinol or niacinamide in the evening", "Apply moisturizer while skin is damp", "Look for hyaluronic acid", "Avoid alcohol-based toners"]
            },
            "lifestyle": {
                "summary": ["Aim for 7-9 hours of sleep for skin repair", "Manage stress levels to reduce cortisol"],
                "detail": ["Exercise 3-4 times per week to boost circulation", "Avoid smoking and excessive alcohol", "Use a humidifier in dry environments"]
            },
            "progress": {
                "summary": ["Skin health baseline recorded", "Track changes weekly"],
                "detail": ["Monitor moisture levels", "Note any new breakouts or improvements"]
            },
            "action_plan": {
                "summary": ["Start a consistent morning and evening routine", "Add SPF to your daily regimen", "Increase water intake to 8+ glasses daily"],
                "detail": ["Book a dermatologist appointment if issues persist", "Take weekly photos to track progress"]
            },
            "disclaimer": "This analysis is AI-generated and not a substitute for professional medical advice."
        }

    if not is_subscribed:
        try:
            await db_update("profiles", {"id": user_id}, {
                "deep_analysis_count": deep_count + 1
            })
        except Exception as e:
            print(f"❌ Failed to update deep_analysis_count: {e}")

    trials_remaining = None if is_subscribed else max(0, FREE_DEEP_ANALYSIS_LIMIT - (deep_count + 1))

    # Strip emojis from all string values in deep_data
    def clean_deep_data(obj):
        if isinstance(obj, str):
            return strip_emojis(obj)
        elif isinstance(obj, list):
            return [clean_deep_data(i) for i in obj]
        elif isinstance(obj, dict):
            return {k: clean_deep_data(v) for k, v in obj.items()}
        return obj

    deep_data = clean_deep_data(deep_data)

    return {
        "deep_analysis": deep_data,
        "is_subscribed": is_subscribed,
        "trials_remaining": trials_remaining,
        "generated_at": datetime.now().isoformat(),
    }


# ── Stripe Checkout ───────────────────────────────────────────
@app.post("/create-checkout-session")
async def create_checkout_session(user=Depends(get_current_user)):
    user_id = user["id"]
    user_email = user.get("email", "")

    try:
        profile = await get_user_profile(user_id)
        stripe_customer_id = profile.get("stripe_customer_id")

        if not stripe_customer_id:
            customer = stripe.Customer.create(
                email=user_email,
                metadata={"supabase_user_id": user_id}
            )
            stripe_customer_id = customer.id
            await db_update("profiles", {"id": user_id}, {
                "stripe_customer_id": stripe_customer_id
            })

        session = stripe.checkout.Session.create(
            customer=stripe_customer_id,
            payment_method_types=["card"],
            line_items=[{
                "price": STRIPE_PRICE_ID,
                "quantity": 1,
            }],
            mode="subscription",
            success_url=f"{FRONTEND_URL}?payment=success",
            cancel_url=f"{FRONTEND_URL}?payment=cancelled",
            metadata={"supabase_user_id": user_id}
        )

        return {"checkout_url": session.url}

    except Exception as e:
        print(f"❌ Checkout error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ── Stripe Webhook ────────────────────────────────────────────
@app.post("/webhook")
async def stripe_webhook(request: Request):
    payload = await request.body()
    sig_header = request.headers.get("stripe-signature")

    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, STRIPE_WEBHOOK_SECRET
        )
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid payload")
    except stripe.error.SignatureVerificationError:
        raise HTTPException(status_code=400, detail="Invalid signature")

    if event["type"] in ["customer.subscription.created", "customer.subscription.updated"]:
        subscription = event["data"]["object"]
        if subscription["status"] == "active":
            customer_id = subscription["customer"]
            try:
                period_end = None
                try:
                    items_data = subscription.get("items", {}).get("data", [])
                    if items_data:
                        period_end = items_data[0].get("current_period_end")
                    if not period_end:
                        period_end = subscription.get("current_period_end")
                except Exception:
                    pass

                profiles = await db_select("profiles", {"stripe_customer_id": customer_id}, limit=1)
                if profiles and len(profiles) > 0:
                    user_id = profiles[0]["id"]
                    update_data = {"is_subscribed": True}
                    if period_end:
                        update_data["subscription_end_date"] = datetime.fromtimestamp(period_end).isoformat()
                    await db_update("profiles", {"id": user_id}, update_data)
                    print(f"✅ Subscription activated for user {user_id}")
            except Exception as e:
                print(f"❌ Webhook subscription update failed: {e}")

    elif event["type"] == "customer.subscription.deleted":
        subscription = event["data"]["object"]
        customer_id = subscription["customer"]
        try:
            profiles = await db_select("profiles", {"stripe_customer_id": customer_id}, limit=1)
            if profiles and len(profiles) > 0:
                user_id = profiles[0]["id"]
                await db_update("profiles", {"id": user_id}, {
                    "is_subscribed": False,
                    "subscription_end_date": None
                })
                print(f"✅ Subscription cancelled for user {user_id}")
        except Exception as e:
            print(f"❌ Webhook cancellation failed: {e}")

    return {"received": True}


# ── Profile ───────────────────────────────────────────────────
@app.get("/profile")
async def get_profile(user=Depends(get_current_user)):
    profile = await get_user_profile(user["id"])
    return {
        "is_subscribed": profile.get("is_subscribed", False),
        "deep_analysis_count": profile.get("deep_analysis_count", 0),
        "trials_remaining": max(0, FREE_DEEP_ANALYSIS_LIMIT - profile.get("deep_analysis_count", 0)),
    }


# ── Status ────────────────────────────────────────────────────
@app.get("/")
def root():
    return {"status": "SkinAI backend is running"}
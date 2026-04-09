import logging
import os
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from routers import search, course, scorecard

logging.basicConfig(
    level=os.environ.get("LOG_LEVEL", "INFO"),
    format="%(asctime)s %(levelname)s %(name)s — %(message)s",
)
logger = logging.getLogger(__name__)

ENVIRONMENT = os.environ.get("ENVIRONMENT", "development").lower()
IS_PRODUCTION = ENVIRONMENT == "production"

app = FastAPI(
    title="GolfMaps Course API",
    version="1.0.0",
    docs_url=None if IS_PRODUCTION else "/docs",
    redoc_url=None if IS_PRODUCTION else "/redoc",
)

# CORS: in production we require an explicit allowlist. Dev falls back to *.
_raw_origins = os.environ.get("ALLOWED_ORIGINS", "")
ALLOWED_ORIGINS = [o.strip() for o in _raw_origins.split(",") if o.strip()] if _raw_origins else []

if IS_PRODUCTION and not ALLOWED_ORIGINS:
    raise RuntimeError(
        "ALLOWED_ORIGINS must be set in production (comma-separated list of app origins)."
    )
if IS_PRODUCTION and not os.environ.get("SCORECARD_AUTH_SECRET"):
    logger.warning(
        "SCORECARD_AUTH_SECRET is not set in production — scorecard endpoint is unauthenticated!"
    )

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS if ALLOWED_ORIGINS else ["*"],
    allow_credentials=bool(ALLOWED_ORIGINS),
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Content-Type", "X-Scorecard-Auth", "Authorization"],
)

# Rate limiting via slowapi (if installed)
try:
    from slowapi import Limiter, _rate_limit_exceeded_handler
    from slowapi.util import get_remote_address
    from slowapi.errors import RateLimitExceeded

    limiter = Limiter(key_func=get_remote_address)
    app.state.limiter = limiter
    app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
except ImportError:
    limiter = None

app.include_router(search.router, prefix="/api")
app.include_router(course.router, prefix="/api")
app.include_router(scorecard.router, prefix="/api")


@app.get("/health")
async def health_check():
    return {"status": "ok"}


@app.post("/webhooks/revenuecat")
async def revenuecat_webhook(request: Request):
    """Handle RevenueCat subscription lifecycle events.

    In production, validate the webhook signature and update Supabase subscriptions table.
    """
    body = await request.json()
    event_type = body.get("event", {}).get("type", "unknown")
    app_user_id = body.get("event", {}).get("app_user_id", "")

    # TODO: Validate webhook auth header
    # TODO: Update Supabase subscriptions table based on event_type
    # Event types: INITIAL_PURCHASE, RENEWAL, CANCELLATION, EXPIRATION, etc.

    return JSONResponse({"received": True, "event_type": event_type})


@app.post("/api/orders/create-payment-intent")
async def create_payment_intent(request: Request):
    """Create a Stripe PaymentIntent for canvas print orders.

    Physical goods can use Stripe (Apple/Google allow external payment for physical goods).
    """
    body = await request.json()

    # TODO: Integrate with Stripe
    # stripe.PaymentIntent.create(amount=..., currency='usd', ...)

    return JSONResponse({
        "clientSecret": "pi_placeholder_secret",
        "orderId": f"order-{body.get('courseId', 'unknown')}",
    })

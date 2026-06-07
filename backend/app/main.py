import os
import sys
import time

# Add backend root and credit-card root directories to sys.path to allow absolute imports
backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
credit_card_dir = os.path.abspath(os.path.join(backend_dir, ".."))
sys.path.insert(0, backend_dir)
sys.path.insert(0, credit_card_dir)

from fastapi import FastAPI, Request, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from prometheus_client import Counter, Histogram, make_asgi_app
import uvicorn

# Imports
from app.core.config import settings
from app.db.session import engine
from app.db import models
from app.routers import auth, predict, analytics, chatbot, reports, admin

# Create DB tables
models.Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Production-grade AI-powered Credit Scoring and Financial Risk Assessment Platform",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

# CORS Configuration
# Allow frontend port 3000 and standard development URLs
origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:8000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from prometheus_client import CollectorRegistry
# Custom CollectorRegistry to prevent duplicate timeseries on reloader restart
registry = CollectorRegistry()

# Prometheus Monitoring Metrics
REQUEST_COUNT = Counter(
    "api_requests_total", "Total API Requests", ["method", "endpoint", "http_status"],
    registry=registry
)
REQUEST_LATENCY = Histogram(
    "api_request_duration_seconds", "Request latency in seconds", ["endpoint"],
    registry=registry
)
PREDICTION_COUNT = Counter(
    "model_predictions_total", "Total Model Inference Counts", ["risk_category"],
    registry=registry
)

# Custom Middleware for request tracing and metric collection
@app.middleware("http")
async def monitor_requests(request: Request, call_next):
    start_time = time.time()
    endpoint = request.url.path
    
    # Process request
    response = await call_next(request)
    
    # Track latency
    process_time = time.time() - start_time
    REQUEST_LATENCY.labels(endpoint=endpoint).observe(process_time)
    
    # Track response status
    REQUEST_COUNT.labels(
        method=request.method,
        endpoint=endpoint,
        http_status=response.status_code
    ).inc()
    
    return response

# Simple in-memory rate-limiter middleware
RATE_LIMIT_WINDOW = 60 # 1 minute
RATE_LIMIT_MAX_REQUESTS = 60
ip_requests = {}

@app.middleware("http")
async def rate_limiter(request: Request, call_next):
    client_ip = request.client.host
    endpoint = request.url.path
    
    # Skip rate limiting for static docs or metrics
    if any(endpoint.startswith(p) for p in ["/docs", "/redoc", "/metrics", "/api/v1/auth"]):
        return await call_next(request)
        
    current_time = time.time()
    
    # Clean up old requests
    if client_ip in ip_requests:
        ip_requests[client_ip] = [t for t in ip_requests[client_ip] if current_time - t < RATE_LIMIT_WINDOW]
    else:
        ip_requests[client_ip] = []
        
    # Check rate limit
    if len(ip_requests[client_ip]) >= RATE_LIMIT_MAX_REQUESTS:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Rate limit exceeded. Try again in a minute."
        )
        
    ip_requests[client_ip].append(current_time)
    return await call_next(request)

# Mount Prometheus metrics application
metrics_app = make_asgi_app(registry=registry)
app.mount("/metrics", metrics_app)

# Include Routers
app.include_router(auth.router, prefix=settings.API_V1_STR)
app.include_router(predict.router, prefix=settings.API_V1_STR)
app.include_router(analytics.router, prefix=settings.API_V1_STR)
app.include_router(chatbot.router, prefix=settings.API_V1_STR)
app.include_router(reports.router, prefix=settings.API_V1_STR)
app.include_router(admin.router, prefix=settings.API_V1_STR)

@app.get("/")
def read_root():
    return {
        "status": "online",
        "app_name": settings.PROJECT_NAME,
        "api_version": "1.0.0",
        "documentation": "/docs"
    }

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)

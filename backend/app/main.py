from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.database import Base, engine, SessionLocal
from app.models import SessionModel
from app.api import events, sessions, analytics, predictions, model, simulator, workflows
from app.services.data_generator import generate_synthetic_sessions

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize DB tables
    Base.metadata.create_all(bind=engine)
    
    # Auto-seed all registered workflows if empty
    db = SessionLocal()
    try:
        session_count = db.query(SessionModel).count()
        if session_count == 0:
            print("[FlowTwin AI] Database is empty. Seeding multi-workflow digital twin dataset...")
            generate_synthetic_sessions(db, workflow_id="all", count=500, reset=True)
            print("[FlowTwin AI] Multi-workflow seeding and ML training complete.")
        else:
            print(f"[FlowTwin AI] Found {session_count} existing sessions in database.")
    except Exception as e:
        print(f"[FlowTwin AI] Error during startup seed check: {e}")
    finally:
        db.close()

    yield

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Predictive Digital Workflow Optimization using Graph Analytics (NetworkX) and Machine Learning (Scikit-Learn). Completely workflow-independent SaaS architecture.",
    version="2.0.0",
    lifespan=lifespan
)

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API routes
app.include_router(workflows.router, prefix="/api")
app.include_router(events.router, prefix="/api")
app.include_router(sessions.router, prefix="/api")
app.include_router(analytics.router, prefix="/api")
app.include_router(predictions.router, prefix="/api")
app.include_router(model.router, prefix="/api")
app.include_router(simulator.router, prefix="/api")

@app.get("/")
def root():
    return {
        "project": "FlowTwin AI",
        "version": "2.0.0",
        "status": "online",
        "docs": "/docs",
        "api_prefix": "/api"
    }

@app.get("/health")
def health_check():
    return {"status": "healthy"}

import uuid
from typing import Dict, Any
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas import SimulatorStepRequest, SeedRequest
from app.models import SessionModel, EventModel
from app.schemas import EventCreate
from app.services.session_service import session_service
from app.services.data_generator import generate_synthetic_sessions
from app.services.ml_service import ml_service
from app.services.workflow_definitions import get_workflow_def

router = APIRouter(prefix="/simulator", tags=["Simulator"])

@router.post("/step")
def simulate_step(req: SimulatorStepRequest, db: Session = Depends(get_db)):
    """
    Executes a step transition in a simulated workflow journey.
    Supports any registered workflow dynamically.
    """
    wf_id = req.workflow_id or "job_application"
    wf_def = get_workflow_def(wf_id)
    session_id = req.session_id or f"demo_{uuid.uuid4().hex[:8]}"
    user_id = req.user_id or f"user_{uuid.uuid4().hex[:6]}"

    session = db.query(SessionModel).filter(SessionModel.id == session_id).first()
    from_step = session.current_step if session else wf_def.get("start_step", "start")

    event_in = EventCreate(
        session_id=session_id,
        user_id=user_id,
        workflow_id=wf_id,
        from_step=from_step,
        to_step=req.to_step,
        action=req.action,
        time_spent=req.time_spent
    )

    event = session_service.log_event(event_in, db)
    db.refresh(session)

    pred = ml_service.predict_session(session, db)

    return {
        "event": {
            "id": event.id,
            "session_id": event.session_id,
            "workflow_id": event.workflow_id,
            "from_step": event.from_step,
            "to_step": event.to_step,
            "action": event.action,
            "time_spent": event.time_spent,
            "timestamp": event.timestamp.isoformat()
        },
        "session": {
            "id": session.id,
            "user_id": session.user_id,
            "workflow_id": session.workflow_id,
            "status": session.status,
            "current_step": session.current_step,
            "step_count": session.step_count,
            "total_duration": session.total_duration,
            "journey_path": session.journey_path,
            "backward_count": session.backward_count,
            "error_count": session.error_count,
            "predicted_risk": session.predicted_risk,
            "completion_probability": session.completion_probability,
            "abandonment_probability": session.abandonment_probability
        },
        "prediction": pred
    }

@router.post("/seed")
def seed_data(req: SeedRequest, db: Session = Depends(get_db)):
    """
    Seeds database with realistic synthetic user journeys for a workflow.
    Pass workflow_id='all' to seed multiple diverse workflows!
    """
    wf_id = req.workflow_id or "job_application"
    count = req.count or 500
    reset = req.reset if req.reset is not None else True

    generated = generate_synthetic_sessions(db, workflow_id=wf_id, count=count, reset=reset)
    metrics = ml_service.train_model(db, "job_application" if wf_id == "all" else wf_id)

    return {
        "message": f"Successfully generated {generated} realistic workflow sessions for {wf_id}",
        "workflow_id": wf_id,
        "total_sessions": db.query(SessionModel).count(),
        "total_events": db.query(EventModel).count(),
        "model_accuracy": metrics.get("accuracy")
    }

@router.post("/reset")
def reset_database(
    workflow_id: str = Query("all", description="Workflow to reset or 'all'"),
    db: Session = Depends(get_db)
):
    """
    Clears sessions and events and re-seeds with clean realistic records across all workflows.
    """
    generated = generate_synthetic_sessions(db, workflow_id=workflow_id, count=500, reset=True)
    return {
        "message": f"Database reset and re-seeded with {generated} realistic sessions for {workflow_id}"
    }

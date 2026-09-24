from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import SessionModel
from app.schemas import LivePredictionRequest, LivePredictionResponse
from app.services.ml_service import ml_service
from app.services.workflow_definitions import get_workflow_def, get_step_labels, get_step_orders

router = APIRouter(prefix="/prediction", tags=["Predictions"])

@router.get("/{session_id}", response_model=LivePredictionResponse)
def get_session_prediction(session_id: str, db: Session = Depends(get_db)):
    session = db.query(SessionModel).filter(SessionModel.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    pred = ml_service.predict_session(session, db)
    return LivePredictionResponse(
        journey=session.journey_path or session.current_step,
        current_step=session.current_step,
        completion_probability=pred["completion_probability"],
        abandonment_probability=pred["abandonment_probability"],
        predicted_risk=pred["predicted_risk"],
        reasons=pred["reasons"],
        feature_values=pred["feature_values"]
    )

@router.post("/live", response_model=LivePredictionResponse)
def predict_live_journey(req: LivePredictionRequest):
    """
    Accepts arbitrary or in-progress simulated journey state
    and returns live machine learning prediction + explainable reasoning
    for any dynamic workflow.
    """
    wf_id = req.workflow_id or "job_application"
    wf_def = get_workflow_def(wf_id)
    step_orders = get_step_orders(wf_id)
    step_labels = get_step_labels(wf_id)

    start_s = wf_def.get("start_step", "start")
    success_s = wf_def.get("success_step", "submit")
    exit_s = wf_def.get("exit_step", "exit")

    current_step = req.current_step or (req.journey_steps[-1] if req.journey_steps else start_s)
    step_idx = step_orders.get(current_step, 0)
    steps_count = max(1, len(req.journey_steps))

    tot_duration = req.total_duration + req.time_spent_current
    avg_dwell = tot_duration / steps_count if steps_count > 0 else 20.0

    success_idx = step_orders.get(success_s, len(wf_def["steps"]) - 1)
    dist = max(0, success_idx - step_idx) if current_step != exit_s else 99

    # Calculate repeated transitions
    repeated_trans = 0
    seen_transitions = set()
    for i in range(len(req.journey_steps) - 1):
        pair = (req.journey_steps[i], req.journey_steps[i+1])
        if pair in seen_transitions:
            repeated_trans += 1
        seen_transitions.add(pair)

    bottleneck_visited = 1.0 if (req.backward_count > 0 or req.repeated_steps > 0 or (step_idx >= 3 and avg_dwell > 45.0)) else 0.0

    features = {
        "current_step_idx": float(step_idx),
        "steps_visited_count": float(steps_count),
        "total_duration": float(tot_duration),
        "avg_time_per_step": float(avg_dwell),
        "backward_movements_count": float(req.backward_count),
        "repeated_steps_count": float(req.repeated_steps),
        "repeated_transitions_count": float(repeated_trans),
        "errors_count": float(req.errors_count),
        "distance_from_completion": float(dist),
        "bottleneck_reached": float(bottleneck_visited)
    }

    pred = ml_service.predict_features(features, wf_id)
    journey_display = " -> ".join([step_labels.get(s, s.title()) for s in req.journey_steps])

    return LivePredictionResponse(
        journey=journey_display,
        current_step=current_step,
        completion_probability=pred["completion_probability"],
        abandonment_probability=pred["abandonment_probability"],
        predicted_risk=pred["predicted_risk"],
        reasons=pred["reasons"],
        feature_values=pred["feature_values"]
    )

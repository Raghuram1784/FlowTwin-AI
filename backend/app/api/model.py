from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas import ModelMetricsResponse
from app.services.ml_service import ml_service

router = APIRouter(prefix="/model", tags=["Machine Learning"])

@router.get("/metrics", response_model=ModelMetricsResponse)
def get_model_metrics(
    workflow_id: str = Query("job_application", description="Workflow to get metrics for"),
    db: Session = Depends(get_db)
):
    """
    Returns the Random Forest model's performance metrics for the given workflow:
    Accuracy, Precision, Recall, F1 score, Confusion Matrix, and Feature Importances.
    """
    if workflow_id not in ml_service.models:
        ml_service.train_model(db, workflow_id)
    return ml_service.metrics_cache.get(workflow_id, ml_service._get_fallback_metrics(workflow_id))

@router.post("/retrain", response_model=ModelMetricsResponse)
def retrain_model(
    workflow_id: str = Query("job_application", description="Workflow to retrain model for"),
    db: Session = Depends(get_db)
):
    """
    Retrains the Random Forest Classifier on all accumulated session events
    for the specified workflow and updates performance evaluations.
    """
    metrics = ml_service.train_model(db, workflow_id)
    return metrics

from typing import List
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas import SummaryAnalytics, GraphDataResponse, BottleneckItem, PathsAnalyticsResponse
from app.services.session_service import session_service
from app.services.graph_service import graph_service

router = APIRouter(prefix="/analytics", tags=["Analytics"])

@router.get("/summary", response_model=SummaryAnalytics)
def get_summary_analytics(
    workflow_id: str = Query("job_application", description="Workflow ID to analyze"),
    db: Session = Depends(get_db)
):
    """
    Returns executive KPI cards, completion vs abandonment rates,
    averages, and high-level workflow steps for a specific workflow.
    """
    return session_service.get_summary_analytics(db, workflow_id)

@router.get("/graph", response_model=GraphDataResponse)
def get_workflow_graph(
    workflow_id: str = Query("job_application", description="Workflow ID to analyze"),
    db: Session = Depends(get_db)
):
    """
    Returns the full directed weighted workflow graph calculated via NetworkX,
    including PageRank, betweenness centrality, degree centrality,
    closeness centrality, transition weights, and community detection.
    """
    return graph_service.get_graph_analytics(db, workflow_id)

@router.get("/bottlenecks", response_model=List[BottleneckItem])
def get_bottlenecks(
    workflow_id: str = Query("job_application", description="Workflow ID to analyze"),
    db: Session = Depends(get_db)
):
    """
    Returns dynamically ranked workflow problems with attrition metrics, dwell times,
    repeated navigation loops, and deterministic actionable recommendations.
    """
    return graph_service.get_bottlenecks(db, workflow_id)

@router.get("/paths", response_model=PathsAnalyticsResponse)
def get_paths(
    workflow_id: str = Query("job_application", description="Workflow ID to analyze"),
    db: Session = Depends(get_db)
):
    """
    Returns shortest successful path, top completed journeys,
    top failed journeys, and repeated cyclic loops for the specified workflow.
    """
    return graph_service.get_paths_analytics(db, workflow_id)

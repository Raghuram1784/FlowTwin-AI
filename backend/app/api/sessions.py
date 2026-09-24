from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_
from app.database import get_db
from app.models import SessionModel
from app.schemas import SessionResponse, SessionDetailResponse, SessionListResponse

router = APIRouter(prefix="/sessions", tags=["Sessions"])

@router.get("", response_model=SessionListResponse)
def get_sessions(
    workflow_id: Optional[str] = Query("job_application", description="Filter by workflow_id"),
    status: Optional[str] = Query(None, description="Filter by completed, abandoned, in_progress"),
    risk: Optional[str] = Query(None, description="Filter by low, medium, high"),
    step: Optional[str] = Query(None, description="Filter by current workflow step"),
    search: Optional[str] = Query(None, description="Search session_id or user_id"),
    page: int = Query(1, ge=1),
    limit: int = Query(15, ge=1, le=100),
    db: Session = Depends(get_db)
):
    query = db.query(SessionModel)

    if workflow_id and workflow_id != "all":
        query = query.filter(SessionModel.workflow_id == workflow_id)
    if status and status != "all":
        query = query.filter(SessionModel.status == status.lower())
    if risk and risk != "all":
        query = query.filter(SessionModel.predicted_risk == risk.lower())
    if step and step != "all":
        query = query.filter(SessionModel.current_step == step.lower())
    if search:
        s_term = f"%{search}%"
        query = query.filter(or_(SessionModel.id.ilike(s_term), SessionModel.user_id.ilike(s_term)))

    total = query.count()
    offset = (page - 1) * limit
    sessions = query.order_by(SessionModel.start_time.desc()).offset(offset).limit(limit).all()

    return SessionListResponse(
        total=total,
        page=page,
        limit=limit,
        sessions=sessions
    )

@router.get("/{session_id}", response_model=SessionDetailResponse)
def get_session_detail(session_id: str, db: Session = Depends(get_db)):
    session = db.query(SessionModel).filter(SessionModel.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return session

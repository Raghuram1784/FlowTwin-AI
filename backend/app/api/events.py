from typing import List
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import EventModel
from app.schemas import EventCreate, EventResponse
from app.services.session_service import session_service

router = APIRouter(prefix="/events", tags=["Events"])

@router.post("", response_model=EventResponse)
def log_event(event_in: EventCreate, db: Session = Depends(get_db)):
    """
    Logs an action event in a workflow session.
    Automatically updates the parent session, recalculates metrics,
    and invokes predictive risk modeling.
    """
    event = session_service.log_event(event_in, db)
    return event

@router.get("", response_model=List[EventResponse])
def get_events(
    session_id: str = Query(None),
    limit: int = Query(50, ge=1, le=500),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db)
):
    query = db.query(EventModel)
    if session_id:
        query = query.filter(EventModel.session_id == session_id)
    events = query.order_by(EventModel.timestamp.desc()).offset(offset).limit(limit).all()
    return events

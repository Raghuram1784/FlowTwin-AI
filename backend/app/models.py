from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.database import Base

class SessionModel(Base):
    __tablename__ = "sessions"

    workflow_id = Column(String(64), default="job_application", index=True, nullable=False)
    id = Column(String(64), primary_key=True, index=True)
    user_id = Column(String(64), index=True, nullable=False)
    start_time = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    end_time = Column(DateTime, nullable=True)
    status = Column(String(32), default="in_progress", index=True)  # in_progress, completed, abandoned
    current_step = Column(String(64), default="start", nullable=False)
    total_duration = Column(Float, default=0.0)  # total seconds spent
    step_count = Column(Integer, default=1)
    backward_count = Column(Integer, default=0)
    repeated_step_count = Column(Integer, default=0)
    repeated_transition_count = Column(Integer, default=0)
    error_count = Column(Integer, default=0)
    predicted_risk = Column(String(32), default="low")  # low, medium, high
    completion_probability = Column(Float, default=0.5)
    abandonment_probability = Column(Float, default=0.5)
    journey_path = Column(Text, default="start")
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    events = relationship("EventModel", back_populates="session", cascade="all, delete-orphan", order_by="EventModel.timestamp")

class EventModel(Base):
    __tablename__ = "events"

    id = Column(Integer, primary_key=True, autoincrement=True)
    workflow_id = Column(String(64), default="job_application", index=True, nullable=False)
    session_id = Column(String(64), ForeignKey("sessions.id", ondelete="CASCADE"), index=True, nullable=False)
    user_id = Column(String(64), index=True, nullable=False)
    from_step = Column(String(64), nullable=False)
    to_step = Column(String(64), nullable=False)
    action = Column(String(64), nullable=False)  # navigate, submit, back, exit, error, retry
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    time_spent = Column(Float, default=0.0)  # dwell time in seconds on from_step
    metadata_json = Column(Text, nullable=True)

    session = relationship("SessionModel", back_populates="events")

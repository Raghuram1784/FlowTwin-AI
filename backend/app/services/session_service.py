import uuid
from datetime import datetime, timezone
from typing import Optional, Dict, Any
from sqlalchemy.orm import Session
from app.models import SessionModel, EventModel
from app.schemas import EventCreate
from app.services.workflow_definitions import get_workflow_def, get_step_labels, get_step_orders
from app.services.ml_service import ml_service
from app.services.graph_service import graph_service

class SessionService:
    def log_event(self, event_data: EventCreate, db: Session) -> EventModel:
        wf_id = event_data.workflow_id or "job_application"
        wf_def = get_workflow_def(wf_id)
        step_orders = get_step_orders(wf_id)
        step_labels = get_step_labels(wf_id)

        session = db.query(SessionModel).filter(SessionModel.id == event_data.session_id).first()
        now = event_data.timestamp or datetime.now(timezone.utc)

        start_s = wf_def.get("start_step", "start")
        success_s = wf_def.get("success_step", "submit")
        exit_s = wf_def.get("exit_step", "exit")

        if not session:
            session = SessionModel(
                id=event_data.session_id,
                workflow_id=wf_id,
                user_id=event_data.user_id,
                start_time=now,
                current_step=event_data.from_step or start_s,
                journey_path=event_data.from_step or start_s,
                status="in_progress",
                total_duration=0.0,
                step_count=1,
                backward_count=0,
                repeated_step_count=0,
                repeated_transition_count=0,
                error_count=0,
                predicted_risk="low",
                completion_probability=0.5,
                abandonment_probability=0.5
            )
            db.add(session)
            db.flush()

        new_event = EventModel(
            session_id=event_data.session_id,
            workflow_id=wf_id,
            user_id=event_data.user_id,
            from_step=event_data.from_step,
            to_step=event_data.to_step,
            action=event_data.action,
            timestamp=now,
            time_spent=event_data.time_spent,
            metadata_json=event_data.metadata_json
        )
        db.add(new_event)

        # Backward navigation check
        from_order = step_orders.get(event_data.from_step, -1)
        to_order = step_orders.get(event_data.to_step, -1)
        if from_order != -1 and to_order != -1 and event_data.to_step != exit_s and event_data.from_step != exit_s:
            if to_order < from_order:
                session.backward_count = (session.backward_count or 0) + 1

        # Repeated step and transition check
        existing_events = db.query(EventModel).filter(EventModel.session_id == session.id).all()
        visited_steps = set(e.from_step for e in existing_events)
        visited_steps.add(event_data.from_step)

        if event_data.to_step in visited_steps and event_data.to_step != exit_s:
            session.repeated_step_count = (session.repeated_step_count or 0) + 1

        existing_transitions = set((e.from_step, e.to_step) for e in existing_events)
        if (event_data.from_step, event_data.to_step) in existing_transitions:
            session.repeated_transition_count = (session.repeated_transition_count or 0) + 1

        # Errors check
        if event_data.action in ["error", "validation_failed", "upload_error", "timeout"]:
            session.error_count = (session.error_count or 0) + 1

        # Step and path update
        session.current_step = event_data.to_step
        session.step_count = (session.step_count or 1) + 1
        session.total_duration = round((session.total_duration or 0.0) + (event_data.time_spent or 0.0), 1)

        journey_parts = [p.strip() for p in (session.journey_path or "").split("->") if p.strip()]
        if not journey_parts or journey_parts[-1] != event_data.to_step:
            journey_parts.append(event_data.to_step)
        session.journey_path = " -> ".join(journey_parts)

        # Termination status
        if event_data.to_step == success_s or event_data.action == "submit":
            session.status = "completed"
            session.end_time = now
        elif event_data.to_step == exit_s or event_data.action == "exit":
            session.status = "abandoned"
            session.end_time = now

        db.commit()
        db.refresh(session)

        # Update ML prediction
        ml_service.predict_session(session, db)

        db.refresh(new_event)
        return new_event

    def get_summary_analytics(self, db: Session, workflow_id: str = "job_application") -> Dict[str, Any]:
        sessions = db.query(SessionModel).filter(SessionModel.workflow_id == workflow_id).all()
        wf_def = get_workflow_def(workflow_id)
        step_labels = get_step_labels(workflow_id)

        total = len(sessions)
        if total == 0:
            steps_overview = [
                {
                    "id": s["id"],
                    "label": s["label"],
                    "visits": 0,
                    "drop_off_pct": 0.0,
                    "avg_time_spent": 0.0,
                    "role": "normal"
                }
                for s in wf_def["steps"] if s["id"] != wf_def.get("exit_step", "exit")
            ]
            return {
                "workflow_id": workflow_id,
                "total_sessions": 0,
                "completed_sessions": 0,
                "abandoned_sessions": 0,
                "in_progress_sessions": 0,
                "completion_rate": 0.0,
                "abandonment_rate": 0.0,
                "avg_journey_length": 0.0,
                "avg_completion_time": 0.0,
                "highest_bottleneck": "No bottleneck identified yet",
                "most_important_step": wf_def["steps"][0]["label"] if wf_def["steps"] else "Start",
                "high_risk_sessions_count": 0,
                "workflow_steps": steps_overview
            }

        completed = sum(1 for s in sessions if s.status == "completed")
        abandoned = sum(1 for s in sessions if s.status == "abandoned")
        in_progress = sum(1 for s in sessions if s.status == "in_progress")

        completion_rate = round((completed / total * 100), 1)
        abandonment_rate = round((abandoned / total * 100), 1)

        completed_sessions = [s for s in sessions if s.status == "completed"]
        avg_comp_time = round(sum(s.total_duration for s in completed_sessions) / len(completed_sessions), 1) if completed_sessions else 0.0
        avg_journey_len = round(sum(s.step_count for s in sessions) / total, 1)

        high_risk_count = sum(1 for s in sessions if s.predicted_risk == "high")

        # Dynamic graph node breakdown
        graph_data = graph_service.get_graph_analytics(db, workflow_id)
        node_dict = {n["id"]: n for n in graph_data["nodes"]}

        workflow_steps_list = []
        for step_item in wf_def["steps"]:
            step_id = step_item["id"]
            if step_id == wf_def.get("exit_step", "exit"):
                continue
            n_info = node_dict.get(step_id, {})
            workflow_steps_list.append({
                "id": step_id,
                "label": step_labels.get(step_id, step_item.get("label", step_id)),
                "visits": n_info.get("visits", 0),
                "drop_off_pct": n_info.get("drop_off_pct", 0.0),
                "avg_time_spent": n_info.get("avg_time_spent", 0.0),
                "role": n_info.get("role", "normal")
            })

        # Dynamic highest bottleneck
        bottlenecks = graph_service.get_bottlenecks(db, workflow_id)
        highest_bottleneck_label = bottlenecks[0]["label"] if bottlenecks else "None detected"

        # Most important step by PageRank
        sorted_nodes = sorted(graph_data["nodes"], key=lambda x: (x["pagerank"], x["betweenness_centrality"]), reverse=True)
        important_nodes = [
            n for n in sorted_nodes
            if n["id"] not in [wf_def.get("success_step", "submit"), wf_def.get("exit_step", "exit"), wf_def.get("start_step", "start")]
        ]
        most_important_label = important_nodes[0]["label"] if important_nodes else (workflow_steps_list[1]["label"] if len(workflow_steps_list) > 1 else workflow_steps_list[0]["label"])

        return {
            "workflow_id": workflow_id,
            "total_sessions": total,
            "completed_sessions": completed,
            "abandoned_sessions": abandoned,
            "in_progress_sessions": in_progress,
            "completion_rate": completion_rate,
            "abandonment_rate": abandonment_rate,
            "avg_journey_length": avg_journey_len,
            "avg_completion_time": avg_comp_time,
            "highest_bottleneck": highest_bottleneck_label,
            "most_important_step": most_important_label,
            "high_risk_sessions_count": high_risk_count,
            "workflow_steps": workflow_steps_list
        }

session_service = SessionService()

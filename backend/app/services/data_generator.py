import random
import uuid
from datetime import datetime, timedelta, timezone
from sqlalchemy.orm import Session
from app.models import SessionModel, EventModel
from app.services.session_service import session_service
from app.services.ml_service import ml_service
from app.schemas import EventCreate
from app.services.workflow_definitions import get_workflow_def, WORKFLOW_REGISTRY

def generate_synthetic_sessions(
    db: Session,
    workflow_id: str = "job_application",
    count: int = 500,
    reset: bool = True
):
    """
    Generates realistic, behavioral trajectories for any registered workflow:
    - Linear successful users
    - Exploratory users with backward loops
    - Mid-stage bottleneck abandoners
    - Early drop-offs
    - Rework/error loops
    """
    if reset:
        if workflow_id == "all":
            db.query(EventModel).delete()
            db.query(SessionModel).delete()
        else:
            db.query(EventModel).filter(EventModel.workflow_id == workflow_id).delete()
            db.query(SessionModel).filter(SessionModel.workflow_id == workflow_id).delete()
        db.commit()

    if workflow_id == "all":
        total_gen = 0
        for wid in WORKFLOW_REGISTRY:
            cnt = 400 if wid == "job_application" else 150
            total_gen += _generate_for_single_workflow(db, wid, cnt)
        return total_gen
    else:
        return _generate_for_single_workflow(db, workflow_id, count)

def _generate_for_single_workflow(db: Session, workflow_id: str, count: int) -> int:
    wf_def = get_workflow_def(workflow_id)
    canonical_steps = [s["id"] for s in wf_def["steps"] if s["id"] != wf_def.get("exit_step", "exit")]
    exit_s = wf_def.get("exit_step", "exit")
    success_s = wf_def.get("success_step", "submit")
    n_steps = len(canonical_steps)

    base_time = datetime.now(timezone.utc) - timedelta(days=14)

    # Generic behavioral archetypes
    archetypes = [
        {"type": "direct_success", "weight": 35},
        {"type": "exploratory_success", "weight": 15},
        {"type": "mid_bottleneck_drop", "weight": 22},
        {"type": "early_drop", "weight": 18},
        {"type": "late_review_drop", "weight": 10},
    ]

    types = [a["type"] for a in archetypes]
    weights = [a["weight"] for a in archetypes]

    generated = 0
    for i in range(count):
        session_id = f"sess_{workflow_id[:4]}_{uuid.uuid4().hex[:8]}"
        user_id = f"usr_{uuid.uuid4().hex[:8]}"

        random_offset = random.randint(0, 14 * 24 * 3600)
        curr_time = base_time + timedelta(seconds=random_offset)
        arch = random.choices(types, weights=weights)[0]

        events_spec = []

        if arch == "direct_success":
            for s_idx in range(n_steps - 1):
                u = canonical_steps[s_idx]
                v = canonical_steps[s_idx + 1]
                act = "submit" if v == success_s else "navigate"
                dwell = random.uniform(12, 35)
                events_spec.append((u, v, act, dwell))

        elif arch == "exploratory_success":
            for s_idx in range(n_steps - 1):
                u = canonical_steps[s_idx]
                v = canonical_steps[s_idx + 1]
                act = "submit" if v == success_s else "navigate"
                dwell = random.uniform(15, 38)
                events_spec.append((u, v, act, dwell))
                # Insert hesitation loop at step 1 or 2
                if s_idx == 1 and random.random() < 0.7:
                    events_spec.append((v, u, "back", random.uniform(10, 20)))
                    events_spec.append((u, v, "navigate", random.uniform(12, 25)))

        elif arch == "early_drop":
            cutoff = min(2, n_steps - 2)
            for s_idx in range(cutoff):
                u = canonical_steps[s_idx]
                v = canonical_steps[s_idx + 1]
                events_spec.append((u, v, "navigate", random.uniform(8, 22)))
            last_s = canonical_steps[cutoff]
            events_spec.append((last_s, exit_s, "exit", random.uniform(10, 25)))

        elif arch == "mid_bottleneck_drop":
            # Traverses halfway, experiences rework or error, then abandons
            mid_idx = max(2, int(n_steps * 0.55))
            for s_idx in range(mid_idx):
                u = canonical_steps[s_idx]
                v = canonical_steps[s_idx + 1]
                events_spec.append((u, v, "navigate", random.uniform(15, 40)))

            choke_s = canonical_steps[mid_idx]
            prev_s = canonical_steps[mid_idx - 1]

            # Rework loop
            events_spec.append((choke_s, prev_s, "back", random.uniform(18, 45)))
            events_spec.append((prev_s, choke_s, "navigate", random.uniform(20, 50)))
            # Drop-off
            events_spec.append((choke_s, exit_s, "exit", random.uniform(25, 75)))

        elif arch == "late_review_drop":
            # Reaches near the end (second to last step), then exits
            late_idx = max(2, n_steps - 2)
            for s_idx in range(late_idx):
                u = canonical_steps[s_idx]
                v = canonical_steps[s_idx + 1]
                events_spec.append((u, v, "navigate", random.uniform(14, 35)))
            last_s = canonical_steps[late_idx]
            events_spec.append((last_s, exit_s, "exit", random.uniform(20, 60)))

        # Log events
        for from_s, to_s, act, dwell in events_spec:
            event_obj = EventCreate(
                session_id=session_id,
                user_id=user_id,
                workflow_id=workflow_id,
                from_step=from_s,
                to_step=to_s,
                action=act,
                timestamp=curr_time,
                time_spent=round(dwell, 1),
                metadata_json=f'{{"archetype": "{arch}"}}'
            )
            session_service.log_event(event_obj, db)
            curr_time += timedelta(seconds=dwell)

        generated += 1

    ml_service.train_model(db, workflow_id)
    return generated

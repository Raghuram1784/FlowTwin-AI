import sys
print("Starting backend test script...")
from app.database import Base, engine, SessionLocal
from app.models import SessionModel, EventModel
from app.services.data_generator import generate_synthetic_sessions
from app.services.graph_service import graph_service
from app.services.ml_service import ml_service
from app.services.session_service import session_service
from app.services.workflow_definitions import get_all_workflows

print("Creating database tables...")
Base.metadata.create_all(bind=engine)

db = SessionLocal()
print("Seeding multi-workflow dataset...")
generate_synthetic_sessions(db, count=60, reset=True, workflow_id="all")

sess_count = db.query(SessionModel).count()
event_count = db.query(EventModel).count()
print(f"Total Sessions in DB: {sess_count}, Events in DB: {event_count}")

workflows = get_all_workflows()
print(f"Registered workflows: {[w['id'] for w in workflows]}")

for wf in workflows:
    wf_id = wf["id"]
    print(f"\n--- Testing Workflow: {wf['name']} ({wf_id}) ---")
    summary = session_service.get_summary_analytics(db, workflow_id=wf_id)
    print(f"Summary: total={summary['total_sessions']}, comp_rate={summary['completion_rate']}%, drop_rate={summary['abandonment_rate']}%")
    
    graph = graph_service.get_graph_analytics(db, workflow_id=wf_id)
    print(f"Graph nodes: {len(graph['nodes'])}, edges: {len(graph['edges'])}")
    
    bottlenecks = graph_service.get_bottlenecks(db, workflow_id=wf_id)
    top_b = bottlenecks[0] if bottlenecks else None
    if top_b:
        print(f"Top bottleneck: {top_b['label']} ({top_b['drop_off_pct']}%), rec: {top_b['recommendation'][:60]}...")
    else:
        print("No critical bottlenecks.")

    paths = graph_service.get_paths_analytics(db, workflow_id=wf_id)
    print(f"Shortest path: {paths.get('shortest_successful_path')}")

db.close()
print("\nAll multi-workflow backend tests PASSED successfully!")

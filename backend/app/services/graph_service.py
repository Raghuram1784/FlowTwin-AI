import networkx as nx
from typing import Dict, List, Any, Tuple, Optional
from sqlalchemy.orm import Session
from app.models import EventModel, SessionModel
from app.services.workflow_definitions import get_workflow_def, get_step_labels, get_step_orders

class GraphService:
    def __init__(self):
        pass

    def build_graph_from_events(self, db: Session, workflow_id: str = "job_application") -> Tuple[nx.DiGraph, Dict[str, Any]]:
        """
        Builds a directed weighted graph from EventModel entries for a specific workflow.
        Steps and canonical order are dynamically loaded from workflow definitions.
        """
        wf_def = get_workflow_def(workflow_id)
        step_labels = get_step_labels(workflow_id)
        step_orders = get_step_orders(workflow_id)
        canonical_steps = [s["id"] for s in wf_def["steps"]]

        events = (
            db.query(EventModel)
            .filter(EventModel.workflow_id == workflow_id)
            .order_by(EventModel.session_id, EventModel.timestamp)
            .all()
        )

        G = nx.DiGraph()

        step_visits: Dict[str, int] = {}
        step_dwell_times: Dict[str, List[float]] = {}
        step_exits: Dict[str, int] = {}
        step_entries: Dict[str, int] = {}

        for step in canonical_steps:
            G.add_node(step, label=step_labels.get(step, step.title()))
            step_visits[step] = 0
            step_dwell_times[step] = []
            step_exits[step] = 0
            step_entries[step] = 0

        edge_counts: Dict[Tuple[str, str], int] = {}
        edge_dwell_times: Dict[Tuple[str, str], List[float]] = {}

        for ev in events:
            u = ev.from_step
            v = ev.to_step
            time_spent = ev.time_spent or 0.0

            if not G.has_node(u):
                G.add_node(u, label=step_labels.get(u, u.title()))
                step_visits[u] = 0
                step_dwell_times[u] = []
                step_exits[u] = 0
                step_entries[u] = 0
            if not G.has_node(v):
                G.add_node(v, label=step_labels.get(v, v.title()))
                step_visits[v] = 0
                step_dwell_times[v] = []
                step_exits[v] = 0
                step_entries[v] = 0

            step_visits[u] = step_visits.get(u, 0) + 1
            step_dwell_times[u].append(time_spent)

            if u == wf_def.get("start_step", "start"):
                step_entries[u] = step_entries.get(u, 0) + 1

            if v == wf_def.get("exit_step", "exit") or ev.action == "exit":
                step_exits[u] = step_exits.get(u, 0) + 1

            edge = (u, v)
            edge_counts[edge] = edge_counts.get(edge, 0) + 1
            if edge not in edge_dwell_times:
                edge_dwell_times[edge] = []
            edge_dwell_times[edge].append(time_spent)

        # Fallback default nominal chain if no events yet
        if not edge_counts:
            steps_seq = [s for s in canonical_steps if s != wf_def.get("exit_step", "exit")]
            for i in range(len(steps_seq) - 1):
                u, v = steps_seq[i], steps_seq[i+1]
                edge_counts[(u, v)] = 1
                step_visits[u] = 1
                step_visits[v] = 1

        for (u, v), weight in edge_counts.items():
            is_back = False
            u_order = step_orders.get(u, -1)
            v_order = step_orders.get(v, -1)
            exit_s = wf_def.get("exit_step", "exit")
            if u_order != -1 and v_order != -1 and v != exit_s and u != exit_s:
                if v_order < u_order:
                    is_back = True

            avg_trans_time = 0.0
            dwells = edge_dwell_times.get((u, v), [])
            if dwells:
                avg_trans_time = round(sum(dwells) / len(dwells), 1)

            G.add_edge(u, v, weight=weight, is_backward=is_back, avg_time=avg_trans_time)

        meta = {
            "workflow_id": workflow_id,
            "step_visits": step_visits,
            "step_dwell_times": step_dwell_times,
            "step_exits": step_exits,
            "step_entries": step_entries,
            "edge_counts": edge_counts,
            "step_labels": step_labels,
            "wf_def": wf_def
        }
        return G, meta

    def get_graph_analytics(self, db: Session, workflow_id: str = "job_application") -> Dict[str, Any]:
        G, meta = self.build_graph_from_events(db, workflow_id)
        wf_def = meta["wf_def"]
        step_labels = meta["step_labels"]

        pagerank = {}
        degree_cent = {}
        betweenness = {}
        closeness = {}

        try:
            pagerank = nx.pagerank(G, weight="weight", alpha=0.85, max_iter=200)
        except Exception:
            pagerank = {n: round(1.0 / max(len(G.nodes), 1), 4) for n in G.nodes}

        try:
            degree_cent = nx.degree_centrality(G)
        except Exception:
            degree_cent = {n: 0.0 for n in G.nodes}

        try:
            betweenness = nx.betweenness_centrality(G, weight="weight", normalized=True)
        except Exception:
            betweenness = {n: 0.0 for n in G.nodes}

        try:
            closeness = nx.closeness_centrality(G)
        except Exception:
            closeness = {n: 0.0 for n in G.nodes}

        # Communities
        communities = {}
        try:
            undirected_G = G.to_undirected()
            comms = list(nx.community.greedy_modularity_communities(undirected_G))
            for c_idx, comm_set in enumerate(comms):
                for node in comm_set:
                    communities[node] = c_idx
        except Exception:
            for idx, n in enumerate(G.nodes):
                communities[n] = idx % 3

        nodes_list = []
        max_visits = max(meta["step_visits"].values()) if meta["step_visits"] and max(meta["step_visits"].values()) > 0 else 1

        start_s = wf_def.get("start_step", "start")
        success_s = wf_def.get("success_step", "submit")
        exit_s = wf_def.get("exit_step", "exit")

        for node in G.nodes():
            visits = meta["step_visits"].get(node, 0)
            dwells = meta["step_dwell_times"].get(node, [])
            avg_time = round(sum(dwells) / len(dwells), 1) if dwells else 0.0

            exits = meta["step_exits"].get(node, 0)
            drop_off_pct = round((exits / visits * 100), 1) if visits > 0 else 0.0

            incoming = []
            for u in G.predecessors(node):
                w = G[u][node].get("weight", 0)
                incoming.append({
                    "source": u,
                    "label": step_labels.get(u, u.title()),
                    "count": w
                })
            incoming.sort(key=lambda x: x["count"], reverse=True)

            outgoing = []
            total_out_weight = sum(G[node][v].get("weight", 0) for v in G.successors(node)) or 1
            for v in G.successors(node):
                w = G[node][v].get("weight", 0)
                outgoing.append({
                    "target": v,
                    "label": step_labels.get(v, v.title()),
                    "count": w,
                    "rate": round(w / total_out_weight * 100, 1)
                })
            outgoing.sort(key=lambda x: x["count"], reverse=True)

            # Assign dynamic role
            if node == start_s:
                role = "start"
            elif node == success_s:
                role = "successful_completion"
            elif node == exit_s:
                role = "exit"
            elif drop_off_pct >= 25.0:
                role = "high_abandonment"
            elif drop_off_pct >= 15.0 or (betweenness.get(node, 0.0) > 0.15 and avg_time > 40.0):
                role = "bottleneck"
            elif visits >= 0.7 * max_visits and visits > 20:
                role = "high_traffic"
            else:
                role = "normal"

            nodes_list.append({
                "id": node,
                "label": step_labels.get(node, node.title()),
                "role": role,
                "visits": visits,
                "entry_count": meta["step_entries"].get(node, 0),
                "exit_count": exits,
                "drop_off_pct": drop_off_pct,
                "pagerank": round(pagerank.get(node, 0.0), 4),
                "degree_centrality": round(degree_cent.get(node, 0.0), 4),
                "in_degree": G.in_degree(node),
                "out_degree": G.out_degree(node),
                "betweenness_centrality": round(betweenness.get(node, 0.0), 4),
                "closeness_centrality": round(closeness.get(node, 0.0), 4),
                "avg_time_spent": avg_time,
                "community_id": communities.get(node, 0),
                "incoming_paths": incoming,
                "outgoing_paths": outgoing
            })

        edges_list = []
        for u, v, data in G.edges(data=True):
            w = data.get("weight", 1)
            total_u_out = sum(G[u][dest].get("weight", 0) for dest in G.successors(u)) or 1
            rate = round(w / total_u_out * 100, 1)

            edges_list.append({
                "id": f"e_{u}_{v}",
                "source": u,
                "target": v,
                "weight": w,
                "transition_rate": rate,
                "is_backward": data.get("is_backward", False),
                "average_transition_time": data.get("avg_time", 0.0)
            })

        density = round(nx.density(G), 4)
        is_dag = nx.is_directed_acyclic_graph(G)

        return {
            "workflow_id": workflow_id,
            "nodes": nodes_list,
            "edges": edges_list,
            "total_nodes": G.number_of_nodes(),
            "total_edges": G.number_of_edges(),
            "density": density,
            "is_dag": is_dag
        }

    def get_paths_analytics(self, db: Session, workflow_id: str = "job_application") -> Dict[str, Any]:
        G, meta = self.build_graph_from_events(db, workflow_id)
        wf_def = meta["wf_def"]
        step_labels = meta["step_labels"]
        start_s = wf_def.get("start_step", "start")
        success_s = wf_def.get("success_step", "submit")

        shortest_path = []
        try:
            if G.has_node(start_s) and G.has_node(success_s) and nx.has_path(G, start_s, success_s):
                shortest_path = nx.shortest_path(G, source=start_s, target=success_s)
            else:
                shortest_path = [s["id"] for s in wf_def["steps"] if s["id"] != wf_def.get("exit_step", "exit")]
        except Exception:
            shortest_path = [s["id"] for s in wf_def["steps"] if s["id"] != wf_def.get("exit_step", "exit")]

        sessions = db.query(SessionModel).filter(SessionModel.workflow_id == workflow_id).all()
        successful_paths: Dict[str, Dict[str, Any]] = {}
        failed_paths: Dict[str, Dict[str, Any]] = {}

        total_completed = 0
        total_abandoned = 0

        for s in sessions:
            path_str = s.journey_path or start_s
            duration = s.total_duration or 0.0

            if s.status == "completed":
                total_completed += 1
                if path_str not in successful_paths:
                    successful_paths[path_str] = {"count": 0, "total_duration": 0.0}
                successful_paths[path_str]["count"] += 1
                successful_paths[path_str]["total_duration"] += duration
            elif s.status == "abandoned":
                total_abandoned += 1
                if path_str not in failed_paths:
                    failed_paths[path_str] = {"count": 0, "total_duration": 0.0}
                failed_paths[path_str]["count"] += 1
                failed_paths[path_str]["total_duration"] += duration

        top_success = []
        for p, data in successful_paths.items():
            cnt = data["count"]
            top_success.append({
                "path": p,
                "steps": [st.strip() for st in p.split("->") if st.strip()],
                "count": cnt,
                "percentage": round(cnt / (total_completed or 1) * 100, 1),
                "avg_duration": round(data["total_duration"] / cnt, 1)
            })
        top_success.sort(key=lambda x: x["count"], reverse=True)

        top_failed = []
        for p, data in failed_paths.items():
            cnt = data["count"]
            top_failed.append({
                "path": p,
                "steps": [st.strip() for st in p.split("->") if st.strip()],
                "count": cnt,
                "percentage": round(cnt / (total_abandoned or 1) * 100, 1),
                "avg_duration": round(data["total_duration"] / cnt, 1)
            })
        top_failed.sort(key=lambda x: x["count"], reverse=True)

        repeated_transitions = []
        for u, v, data in G.edges(data=True):
            if data.get("is_backward", False) or (G.has_edge(v, u) and u != v):
                w_fwd = data.get("weight", 0)
                w_rev = G[v][u].get("weight", 0) if G.has_edge(v, u) else 0
                repeated_transitions.append({
                    "from_step": u,
                    "from_label": step_labels.get(u, u.title()),
                    "to_step": v,
                    "to_label": step_labels.get(v, v.title()),
                    "frequency": w_fwd,
                    "reverse_frequency": w_rev,
                    "is_loop": True
                })
        repeated_transitions.sort(key=lambda x: x["frequency"], reverse=True)

        return {
            "workflow_id": workflow_id,
            "shortest_successful_path": shortest_path,
            "top_successful_paths": top_success[:5],
            "top_failed_paths": top_failed[:5],
            "repeated_transitions": repeated_transitions[:6]
        }

    def get_bottlenecks(self, db: Session, workflow_id: str = "job_application") -> List[Dict[str, Any]]:
        graph_data = self.get_graph_analytics(db, workflow_id)
        nodes = graph_data["nodes"]
        wf_def = get_workflow_def(workflow_id)
        step_labels = get_step_labels(workflow_id)
        success_s = wf_def.get("success_step", "submit")
        exit_s = wf_def.get("exit_step", "exit")

        candidate_nodes = [n for n in nodes if n["id"] not in [success_s, exit_s]]

        paths_data = self.get_paths_analytics(db, workflow_id)
        bottleneck_items = []

        for n in candidate_nodes:
            step_id = n["id"]
            step_label = n["label"]
            drop_off = n["drop_off_pct"]
            dwell = n["avg_time_spent"]
            visits = n["visits"]
            exits = n["exit_count"]
            betweenness = n["betweenness_centrality"]

            continuing = max(0, visits - exits)

            backward_count = sum(
                edge["weight"] for edge in graph_data["edges"]
                if (edge["source"] == step_id or edge["target"] == step_id) and edge["is_backward"]
            )

            related_failed = [
                p["path"] for p in paths_data["top_failed_paths"]
                if step_id in p["steps"]
            ][:3]

            # Most common previous step
            most_common_prev = n["incoming_paths"][0]["label"] if n["incoming_paths"] else None
            # Most common next step (excluding exit if available)
            most_common_next = None
            if n["outgoing_paths"]:
                non_exit = [o for o in n["outgoing_paths"] if o["target"] != exit_s]
                most_common_next = non_exit[0]["label"] if non_exit else n["outgoing_paths"][0]["label"]

            # Dynamic severity
            if drop_off >= 25.0:
                severity = "critical"
            elif drop_off >= 16.0:
                severity = "high"
            elif drop_off >= 8.0 or backward_count > 5:
                severity = "medium"
            else:
                severity = "low"

            # GENERIC DETERMINISTIC RULE-BASED RECOMMENDATION (No workflow-specific hardcoded text!)
            recommendation = self._generate_generic_recommendation(
                step_label=step_label,
                drop_off=drop_off,
                dwell=dwell,
                backward_count=backward_count,
                prev_label=most_common_prev,
                next_label=most_common_next,
                exits=exits
            )

            bottleneck_items.append({
                "step": step_id,
                "label": step_label,
                "rank": 0,
                "drop_off_pct": drop_off,
                "users_entering": visits,
                "users_continuing": continuing,
                "users_abandoning": exits,
                "avg_time_spent": dwell,
                "repeated_nav_count": backward_count,
                "related_failed_paths": related_failed,
                "most_common_prev": most_common_prev,
                "most_common_next": most_common_next,
                "recommendation": recommendation,
                "severity": severity,
                "betweenness": betweenness
            })

        bottleneck_items.sort(key=lambda x: (x["drop_off_pct"], x["avg_time_spent"]), reverse=True)

        for idx, item in enumerate(bottleneck_items):
            item["rank"] = idx + 1

        return bottleneck_items

    def _generate_generic_recommendation(
        self,
        step_label: str,
        drop_off: float,
        dwell: float,
        backward_count: int,
        prev_label: Optional[str],
        next_label: Optional[str],
        exits: int
    ) -> str:
        """
        Generates deterministic, analytics-driven recommendations based purely
        on drop-off %, dwell time anomalies, and backtracking patterns.
        Completely free of domain-specific hardcoding!
        """
        if backward_count > 5 and prev_label:
            return (
                f"Users frequently return from '{step_label}' back to '{prev_label}' ({backward_count} rework loops). "
                f"Review whether information or prerequisites required at '{step_label}' should be collected or clarified earlier during '{prev_label}'."
            )
        elif dwell > 60.0 and drop_off >= 20.0:
            return (
                f"Users spend an elevated average of {dwell:.1f}s on '{step_label}' with a {drop_off:.1f}% drop-off rate ({exits} abandonments). "
                f"Consider simplifying required inputs, providing inline validation feedback, or splitting this stage into progressive steps."
            )
        elif drop_off >= 25.0:
            return (
                f"Critical friction detected: '{step_label}' has a {drop_off:.1f}% abandonment rate. "
                f"Audit required fields, improve progress visibility, and add save-and-resume capability to reduce cold exits."
            )
        elif drop_off >= 15.0:
            return (
                f"Moderate drop-off of {drop_off:.1f}% observed at '{step_label}'. "
                f"Ensure instructions are clear and streamline navigation forward to '{next_label or 'the next step'}'."
            )
        elif backward_count > 0:
            return (
                f"Minor backtracking detected ({backward_count} loops). Review transition criteria from previous steps to maintain linear momentum."
            )
        else:
            return (
                f"Performance at '{step_label}' is within normal baseline parameters ({drop_off:.1f}% drop-off, {dwell:.1f}s average time)."
            )

graph_service = GraphService()

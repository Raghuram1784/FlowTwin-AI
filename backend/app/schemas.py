from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field

class WorkflowStepSchema(BaseModel):
    id: str
    label: str
    type: str = "step"
    order: int = 0

class WorkflowDefinitionSchema(BaseModel):
    id: str
    name: str
    description: str
    category: str
    start_step: str
    success_step: str
    exit_step: str
    steps: List[WorkflowStepSchema]

class WorkflowListResponse(BaseModel):
    workflows: List[WorkflowDefinitionSchema]

class EventCreate(BaseModel):
    session_id: str
    user_id: str
    workflow_id: str = "job_application"
    from_step: str
    to_step: str
    action: str = "navigate"
    timestamp: Optional[datetime] = None
    time_spent: float = 0.0
    metadata_json: Optional[str] = None

class EventResponse(BaseModel):
    id: int
    session_id: str
    user_id: str
    workflow_id: str = "job_application"
    from_step: str
    to_step: str
    action: str
    timestamp: datetime
    time_spent: float
    metadata_json: Optional[str] = None

    class Config:
        from_attributes = True

class SessionResponse(BaseModel):
    id: str
    user_id: str
    workflow_id: str = "job_application"
    start_time: datetime
    end_time: Optional[datetime] = None
    status: str
    current_step: str
    total_duration: float
    step_count: int
    backward_count: int
    repeated_step_count: int
    repeated_transition_count: int
    error_count: int
    predicted_risk: str
    completion_probability: float
    abandonment_probability: float
    journey_path: str
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class SessionDetailResponse(SessionResponse):
    events: List[EventResponse] = []

class SessionListResponse(BaseModel):
    total: int
    page: int
    limit: int
    sessions: List[SessionResponse]

class GraphNode(BaseModel):
    id: str
    label: str
    role: str  # start, normal, high_traffic, bottleneck, high_abandonment, successful_completion, exit
    visits: int
    entry_count: int
    exit_count: int
    drop_off_pct: float
    pagerank: float
    degree_centrality: float
    in_degree: int
    out_degree: int
    betweenness_centrality: float
    closeness_centrality: float
    avg_time_spent: float
    community_id: int = 0
    incoming_paths: List[Dict[str, Any]] = []
    outgoing_paths: List[Dict[str, Any]] = []

class GraphEdge(BaseModel):
    id: str
    source: str
    target: str
    weight: int  # frequency count
    transition_rate: float  # probability from source
    is_backward: bool = False
    average_transition_time: Optional[float] = None

class GraphDataResponse(BaseModel):
    workflow_id: str = "job_application"
    nodes: List[GraphNode]
    edges: List[GraphEdge]
    total_nodes: int
    total_edges: int
    density: float
    is_dag: bool

class BottleneckItem(BaseModel):
    step: str
    label: str
    rank: int
    drop_off_pct: float
    users_entering: int
    users_continuing: int
    users_abandoning: int
    avg_time_spent: float
    repeated_nav_count: int
    related_failed_paths: List[str]
    most_common_prev: Optional[str] = None
    most_common_next: Optional[str] = None
    recommendation: str
    severity: str  # critical, high, medium, low

class PathItem(BaseModel):
    path: str
    steps: List[str]
    count: int
    percentage: float
    avg_duration: float

class PathsAnalyticsResponse(BaseModel):
    workflow_id: str = "job_application"
    shortest_successful_path: List[str]
    top_successful_paths: List[PathItem]
    top_failed_paths: List[PathItem]
    repeated_transitions: List[Dict[str, Any]]

class SummaryAnalytics(BaseModel):
    workflow_id: str = "job_application"
    total_sessions: int
    completed_sessions: int
    abandoned_sessions: int
    in_progress_sessions: int
    completion_rate: float
    abandonment_rate: float
    avg_journey_length: float
    avg_completion_time: float
    highest_bottleneck: str
    most_important_step: str
    high_risk_sessions_count: int
    workflow_steps: List[Dict[str, Any]]

class ConfusionMatrix(BaseModel):
    true_positive: int
    true_negative: int
    false_positive: int
    false_negative: int

class ModelMetricsResponse(BaseModel):
    model_name: str
    accuracy: float
    precision: float
    recall: float
    f1_score: float
    confusion_matrix: ConfusionMatrix
    feature_importances: Dict[str, float]
    train_samples: int
    test_samples: int
    last_trained: Optional[str] = None

class LivePredictionRequest(BaseModel):
    workflow_id: str = "job_application"
    journey_steps: List[str] = ["start"]
    current_step: str = "start"
    total_duration: float = 0.0
    time_spent_current: float = 0.0
    backward_count: int = 0
    errors_count: int = 0
    repeated_steps: int = 0

class LivePredictionResponse(BaseModel):
    journey: str
    current_step: str
    completion_probability: float
    abandonment_probability: float
    predicted_risk: str  # Low, Medium, High
    reasons: List[str]
    feature_values: Dict[str, Any]

class SimulatorStepRequest(BaseModel):
    workflow_id: str = "job_application"
    session_id: Optional[str] = None
    user_id: Optional[str] = None
    to_step: str
    action: str = "navigate"
    time_spent: float = 15.0

class SeedRequest(BaseModel):
    workflow_id: str = "job_application"
    count: int = 500
    reset: bool = True

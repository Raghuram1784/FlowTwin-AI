from fastapi import APIRouter, HTTPException
from typing import List
from app.services.workflow_definitions import WORKFLOW_REGISTRY, get_workflow_def
from app.schemas import WorkflowDefinitionSchema, WorkflowListResponse

router = APIRouter(prefix="/workflows", tags=["Workflows"])

@router.get("", response_model=WorkflowListResponse)
def list_workflows():
    """
    Returns all registered workflow digital twin definitions.
    Enables FlowTwin AI to be completely workflow-independent.
    """
    wfs = [WorkflowDefinitionSchema(**wf) for wf in WORKFLOW_REGISTRY.values()]
    return WorkflowListResponse(workflows=wfs)

@router.get("/{workflow_id}", response_model=WorkflowDefinitionSchema)
def get_workflow(workflow_id: str):
    """
    Returns the step definitions, labels, and roles for a specific workflow.
    """
    if workflow_id not in WORKFLOW_REGISTRY:
        raise HTTPException(status_code=404, detail=f"Workflow '{workflow_id}' not found")
    return WorkflowDefinitionSchema(**get_workflow_def(workflow_id))

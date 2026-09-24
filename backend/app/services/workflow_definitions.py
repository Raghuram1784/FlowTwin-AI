from typing import Dict, List, Any

WORKFLOW_REGISTRY: Dict[str, Dict[str, Any]] = {
    "job_application": {
        "id": "job_application",
        "name": "Job Application",
        "description": "Candidate digital recruitment and application flow",
        "category": "Recruitment & HR",
        "start_step": "start",
        "success_step": "submit",
        "exit_step": "exit",
        "steps": [
            {"id": "start", "label": "Start", "type": "entry", "order": 0},
            {"id": "search", "label": "Search Jobs", "type": "navigation", "order": 1},
            {"id": "job_details", "label": "Job Details", "type": "review", "order": 2},
            {"id": "apply", "label": "Apply Initiation", "type": "form", "order": 3},
            {"id": "resume_upload", "label": "Resume Upload", "type": "upload", "order": 4},
            {"id": "questions", "label": "Screening Questions", "type": "questionnaire", "order": 5},
            {"id": "review", "label": "Review Application", "type": "verification", "order": 6},
            {"id": "submit", "label": "Submit Application", "type": "terminal_success", "order": 7},
            {"id": "exit", "label": "Drop-off / Exit", "type": "terminal_failure", "order": 99}
        ]
    },
    "hospital_appointment": {
        "id": "hospital_appointment",
        "name": "Hospital Appointment",
        "description": "Patient clinical appointment booking and scheduling flow",
        "category": "Healthcare",
        "start_step": "start",
        "success_step": "confirmation",
        "exit_step": "exit",
        "steps": [
            {"id": "start", "label": "Start", "type": "entry", "order": 0},
            {"id": "select_department", "label": "Select Department", "type": "selection", "order": 1},
            {"id": "choose_doctor", "label": "Choose Doctor", "type": "selection", "order": 2},
            {"id": "choose_slot", "label": "Select Time Slot", "type": "scheduling", "order": 3},
            {"id": "insurance_details", "label": "Insurance & KYC", "type": "form", "order": 4},
            {"id": "payment", "label": "Copay Payment", "type": "payment", "order": 5},
            {"id": "confirmation", "label": "Appointment Confirmed", "type": "terminal_success", "order": 6},
            {"id": "exit", "label": "Cancelled / Exit", "type": "terminal_failure", "order": 99}
        ]
    },
    "loan_application": {
        "id": "loan_application",
        "name": "Fintech Loan Application",
        "description": "Consumer digital credit verification and disbursement flow",
        "category": "Fintech & Banking",
        "start_step": "start",
        "success_step": "approval",
        "exit_step": "exit",
        "steps": [
            {"id": "start", "label": "Start", "type": "entry", "order": 0},
            {"id": "loan_amount", "label": "Loan Calculator", "type": "calculator", "order": 1},
            {"id": "personal_info", "label": "Applicant Profile", "type": "form", "order": 2},
            {"id": "kyc_verification", "label": "KYC Identity Check", "type": "verification", "order": 3},
            {"id": "income_proof", "label": "Income Verification", "type": "upload", "order": 4},
            {"id": "credit_check", "label": "Automated Underwriting", "type": "automated", "order": 5},
            {"id": "approval", "label": "Loan Disbursed", "type": "terminal_success", "order": 6},
            {"id": "exit", "label": "Application Abandoned", "type": "terminal_failure", "order": 99}
        ]
    }
}

def get_all_workflows() -> List[Dict[str, Any]]:
    return list(WORKFLOW_REGISTRY.values())

def get_workflow_def(workflow_id: str) -> Dict[str, Any]:
    if workflow_id in WORKFLOW_REGISTRY:
        return WORKFLOW_REGISTRY[workflow_id]
    # Default fallback
    return WORKFLOW_REGISTRY["job_application"]

def get_step_labels(workflow_id: str) -> Dict[str, str]:
    wf = get_workflow_def(workflow_id)
    return {s["id"]: s["label"] for s in wf["steps"]}

def get_step_orders(workflow_id: str) -> Dict[str, int]:
    wf = get_workflow_def(workflow_id)
    return {s["id"]: s.get("order", 0) for s in wf["steps"]}

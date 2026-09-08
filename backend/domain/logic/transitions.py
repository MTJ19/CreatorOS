def is_valid_contract_transition(from_status: str, to_status: str) -> bool:
    """
    Valid transitions:
    - draft -> uploaded -> signed
    - any -> void (brand-only, any time)
    - any -> pending_review (forced by an open escalation, Phase 2)
    """
    if to_status == "void":
        return True
    if to_status == "pending_review":
        return True
    
    if from_status == "draft" and to_status == "uploaded":
        return True
    if from_status == "uploaded" and to_status == "signed":
        return True
        
    return False

def is_valid_deliverable_transition(from_status: str, to_status: str) -> bool:
    """
    Valid transitions:
    - pending -> in_production -> editing -> submitted -> approved | revision_requested
    - revision_requested -> editing -> submitted (resubmission loop)
    - any -> rejected (brand-only)
    """
    if to_status == "rejected":
        return True

    if from_status == "pending" and to_status == "in_production":
        return True
    if from_status == "in_production" and to_status == "editing":
        return True
    if from_status == "editing" and to_status == "submitted":
        return True
    if from_status == "submitted" and to_status in ("approved", "revision_requested"):
        return True
    if from_status == "revision_requested" and to_status == "editing":
        return True

    return False

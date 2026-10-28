def is_valid_contract_transition(from_status: str, to_status: str) -> bool:
    """
    Valid transitions:
    - draft <-> uploaded <-> signed
    - any -> void (brand-only, any time)
    - any -> pending_review (forced by an open escalation, Phase 2)
    - void -> draft | uploaded | signed (reverting accidental void)
    - pending_review -> draft | uploaded | signed
    """
    if to_status == "void":
        return True
    if to_status == "pending_review":
        return True

    contract_active_statuses = {"draft", "uploaded", "signed"}
    if from_status in contract_active_statuses and to_status in contract_active_statuses:
        return True

    if from_status in ("void", "pending_review") and to_status in contract_active_statuses:
        return True

    return False

def is_valid_deliverable_transition(from_status: str, to_status: str) -> bool:
    """
    Valid transitions:
    Supports full bidirectional transitions and reversions between all deliverable statuses:
    pending, in_production, editing, submitted, approved, revision_requested, rejected.
    This ensures neither creator nor brand is ever trapped if a status was selected by mistake.
    """
    deliverable_statuses = {
        "pending",
        "in_production",
        "editing",
        "submitted",
        "approved",
        "revision_requested",
        "rejected",
    }
    return from_status in deliverable_statuses and to_status in deliverable_statuses

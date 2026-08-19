from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class Deliverable(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    deal_id: UUID
    title: str
    description: str
    status: str
    file_path: str | None = None
    created_at: datetime
    updated_at: datetime

class DeliverableCreateRequest(BaseModel):
    deal_id: UUID
    title: str
    description: str

class DeliverableStatusUpdateRequest(BaseModel):
    status: Literal['in_production', 'editing', 'submitted', 'approved', 'rejected', 'revision_requested']
    note: str | None = None

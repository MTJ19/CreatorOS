from datetime import date, datetime
from decimal import Decimal
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class Payment(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    contract_id: UUID
    amount_inr: Decimal
    status: str
    invoice_number: str
    invoice_pdf_path: str | None = None
    due_date: date | None = None
    paid_at: datetime | None = None
    created_at: datetime
    updated_at: datetime

class PaymentStatusUpdateRequest(BaseModel):
    status: Literal['pending', 'paid', 'overdue']

class PaymentCreateRequest(BaseModel):
    contract_id: UUID
    amount_inr: Decimal
    due_date: date | None = None

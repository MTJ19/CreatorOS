from datetime import UTC, datetime
from typing import Literal
from uuid import UUID, uuid4

from domain.interfaces.repositories import MessageRepo
from domain.models.message import Message


class MessageService:
    def __init__(self, message_repo: MessageRepo):
        self.message_repo = message_repo

    async def send(
        self, brand_id: UUID, creator_id: UUID, sender_type: Literal["brand", "creator"], body: str
    ) -> Message:
        message = Message(
            id=uuid4(), brand_id=brand_id, creator_id=creator_id,
            sender_type=sender_type, body=body, created_at=datetime.now(UTC),
        )
        return await self.message_repo.create(message)

    async def list_thread(self, brand_id: UUID, creator_id: UUID) -> list[Message]:
        return await self.message_repo.list_for_thread(brand_id, creator_id)

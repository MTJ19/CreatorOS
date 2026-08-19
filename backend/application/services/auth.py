from datetime import UTC, datetime
from uuid import UUID, uuid4

from supabase import Client

from domain.interfaces.repositories import BrandMemberRepo, BrandRepo, CreatorRepo
from domain.models.brand import Brand, BrandMember
from domain.models.auth import (
    BrandLoginRequest,
    BrandSignupRequest,
    AuthSession,
    CreatorLoginRequest,
    CreatorSignupRequest,
)
from domain.models.creator import Creator
from exceptions import ValidationError


class AuthService:
    def __init__(
        self,
        admin_client: Client,
        brand_repo: BrandRepo,
        brand_member_repo: BrandMemberRepo,
        creator_repo: CreatorRepo,
    ):
        self.admin_client = admin_client
        self.brand_repo = brand_repo
        self.brand_member_repo = brand_member_repo
        self.creator_repo = creator_repo

    def _create_auth_user(self, email: str, password: str) -> UUID:
        try:
            res = self.admin_client.auth.admin.create_user(
                {"email": email, "password": password, "email_confirm": True}
            )
        except Exception as e:
            raise ValidationError(f"Could not create account: {e}") from e
        return UUID(res.user.id)

    def _sign_in(self, email: str, password: str):
        try:
            return self.admin_client.auth.sign_in_with_password(
                {"email": email, "password": password}
            )
        except Exception as e:
            raise ValidationError(f"Invalid email or password: {e}") from e

    def _delete_auth_user(self, user_id: UUID) -> None:
        # Best-effort compensation: Supabase Auth and Postgres aren't in one
        # transaction, so if the profile row fails to write after the auth
        # user was created, the email would otherwise be permanently stuck
        # ("already registered") on every retry with no way to recover it.
        try:
            self.admin_client.auth.admin.delete_user(str(user_id))
        except Exception:
            pass

    async def brand_signup(self, request: BrandSignupRequest) -> AuthSession:
        user_id = self._create_auth_user(request.email, request.password)

        try:
            brand = Brand(
                id=uuid4(), name=request.brand_name, gst_number=None, pan_number=None,
                created_at=datetime.now(UTC)
            )
            created_brand = await self.brand_repo.create(brand)

            member = BrandMember(
                id=uuid4(), brand_id=created_brand.id, user_id=user_id, role="owner",
                created_at=datetime.now(UTC)
            )
            await self.brand_member_repo.create(member)
        except Exception:
            self._delete_auth_user(user_id)
            raise

        session = self._sign_in(request.email, request.password)
        return AuthSession(
            access_token=session.session.access_token,
            refresh_token=session.session.refresh_token,
            user_id=user_id,
            role="brand",
            brand_id=created_brand.id,
            brand_name=created_brand.name,
        )

    async def brand_login(self, request: BrandLoginRequest) -> AuthSession:
        session = self._sign_in(request.email, request.password)
        user_id = UUID(session.user.id)
        member = await self.brand_member_repo.get_by_user_id(user_id)
        if not member:
            raise ValidationError("This account is not linked to a brand.")
        brand = await self.brand_repo.get(member.brand_id)
        return AuthSession(
            access_token=session.session.access_token,
            refresh_token=session.session.refresh_token,
            user_id=user_id,
            role="brand",
            brand_id=member.brand_id,
            brand_name=brand.name if brand else None,
        )

    async def creator_signup(self, request: CreatorSignupRequest) -> AuthSession:
        user_id = self._create_auth_user(request.email, request.password)

        try:
            creator = Creator(
                id=uuid4(), brand_id=None, user_id=user_id,
                display_name=request.display_name, instagram_handle=request.instagram_handle,
                niche=request.niche, follower_tier=request.follower_tier,
                created_at=datetime.now(UTC)
            )
            created = await self.creator_repo.create(creator)
        except Exception:
            self._delete_auth_user(user_id)
            raise

        session = self._sign_in(request.email, request.password)
        return AuthSession(
            access_token=session.session.access_token,
            refresh_token=session.session.refresh_token,
            user_id=user_id,
            role="creator",
            brand_id=None,
            creator_id=created.id,
            display_name=created.display_name,
        )

    async def creator_login(self, request: CreatorLoginRequest) -> AuthSession:
        session = self._sign_in(request.email, request.password)
        user_id = UUID(session.user.id)
        creator = await self.creator_repo.get_by_user_id(user_id)
        if not creator:
            raise ValidationError("This account is not linked to a creator profile.")
        return AuthSession(
            access_token=session.session.access_token,
            refresh_token=session.session.refresh_token,
            user_id=user_id,
            role="creator",
            brand_id=creator.brand_id,
            creator_id=creator.id,
            display_name=creator.display_name,
        )

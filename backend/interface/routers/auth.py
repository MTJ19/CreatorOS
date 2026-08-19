from fastapi import APIRouter, Depends, HTTPException

from application.services.auth import AuthService
from domain.models.auth import (
    BrandLoginRequest,
    BrandSignupRequest,
    AuthSession,
    CreatorLoginRequest,
    CreatorSignupRequest,
)
from exceptions import ValidationError
from infrastructure.supabase.client import get_supabase_client
from infrastructure.supabase.repos import (
    SupabaseBrandMemberRepo,
    SupabaseBrandRepo,
    SupabaseCreatorRepo,
)

router = APIRouter(prefix="/auth", tags=["auth"])


def get_auth_service() -> AuthService:
    # fresh=True: sign_in_with_password mutates this client's session state,
    # so it must not be the shared/cached client or one user's session would
    # leak onto every other request that happens to reuse it.
    client = get_supabase_client(service_role=True, fresh=True)
    return AuthService(
        admin_client=client,
        brand_repo=SupabaseBrandRepo(client),
        brand_member_repo=SupabaseBrandMemberRepo(client),
        creator_repo=SupabaseCreatorRepo(client),
    )


@router.post("/brand/signup", response_model=AuthSession)
async def brand_signup(
    request: BrandSignupRequest,
    service: AuthService = Depends(get_auth_service)
):
    try:
        return await service.brand_signup(request)
    except ValidationError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/brand/login", response_model=AuthSession)
async def brand_login(
    request: BrandLoginRequest,
    service: AuthService = Depends(get_auth_service)
):
    try:
        return await service.brand_login(request)
    except ValidationError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/creator/signup", response_model=AuthSession)
async def creator_signup(
    request: CreatorSignupRequest,
    service: AuthService = Depends(get_auth_service)
):
    try:
        return await service.creator_signup(request)
    except ValidationError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/creator/login", response_model=AuthSession)
async def creator_login(
    request: CreatorLoginRequest,
    service: AuthService = Depends(get_auth_service)
):
    try:
        return await service.creator_login(request)
    except ValidationError as e:
        raise HTTPException(status_code=400, detail=str(e))

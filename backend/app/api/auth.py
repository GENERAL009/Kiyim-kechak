from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db, get_redis
from app.core.security import create_access_token, create_refresh_token, decode_token
from app.schemas.schemas import (
    LoginRequest, Token, UserResponse, UserCreate, UserUpdate, RoleResponse
)
from app.services import AuthService, AuditLogService
from app.api.deps import get_current_user, RoleChecker
from app.models.models import User, Role
from app.repositories import user_repo, role_repo

router = APIRouter()

@router.post("/login", response_model=Token)
def login(login_req: LoginRequest, db: Session = Depends(get_db), redis_client = Depends(get_redis)):
    user = AuthService.authenticate_user(db, email=login_req.email, password=login_req.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )
    
    # Create tokens
    access_token = create_access_token(data={"sub": user.email, "role": user.role.name})
    refresh_token = create_refresh_token(data={"sub": user.email, "role": user.role.name})

    # Cache refresh token in Redis if available
    if redis_client:
        try:
            # Expire after 7 days
            redis_client.setex(f"refresh_token:{user.email}", 7 * 24 * 3600, refresh_token)
        except Exception:
            pass # Keep working even if Redis has issues

    AuditLogService.log(db, user_id=user.id, action="USER_LOGIN", details=f"Logged in from API")
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer"
    }

@router.post("/refresh", response_model=Token)
def refresh(refresh_token: str, db: Session = Depends(get_db), redis_client = Depends(get_redis)):
    payload = decode_token(refresh_token)
    if not payload or payload.get("type") != "refresh":
        raise HTTPException(status_code=400, detail="Invalid refresh token")

    email = payload.get("sub")
    role_name = payload.get("role")
    
    # Validate token match in Redis if available
    if redis_client:
        try:
            cached_token = redis_client.get(f"refresh_token:{email}")
            if not cached_token or cached_token != refresh_token:
                raise HTTPException(status_code=401, detail="Refresh token expired or revoked")
        except Exception:
            pass # Graceful fallback

    # Generate new tokens
    new_access = create_access_token(data={"sub": email, "role": role_name})
    new_refresh = create_refresh_token(data={"sub": email, "role": role_name})

    if redis_client:
        try:
            redis_client.setex(f"refresh_token:{email}", 7 * 24 * 3600, new_refresh)
        except Exception:
            pass

    return {
        "access_token": new_access,
        "refresh_token": new_refresh,
        "token_type": "bearer"
    }

@router.post("/logout")
def logout(current_user: User = Depends(get_current_user), db: Session = Depends(get_db), redis_client = Depends(get_redis)):
    if redis_client:
        try:
            redis_client.delete(f"refresh_token:{current_user.email}")
        except Exception:
            pass
    AuditLogService.log(db, user_id=current_user.id, action="USER_LOGOUT", details="Logged out from API")
    return {"message": "Logged out successfully"}

@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user

# ==========================================
# ADMIN ONLY USER MANAGEMENT
# ==========================================
@router.post("/users", response_model=UserResponse)
def create_new_user(
    user_in: UserCreate,
    db: Session = Depends(get_db),
    admin: User = Depends(RoleChecker(["ADMIN"]))
):
    return AuthService.create_user(db, user_in, creator_id=admin.id)

@router.get("/users", response_model=List[UserResponse])
def get_all_users(
    db: Session = Depends(get_db),
    admin: User = Depends(RoleChecker(["ADMIN"]))
):
    return user_repo.get_multi(db, limit=200)

@router.put("/users/{user_id}", response_model=UserResponse)
def update_user_info(
    user_id: int,
    user_in: UserUpdate,
    db: Session = Depends(get_db),
    admin: User = Depends(RoleChecker(["ADMIN"]))
):
    db_user = user_repo.get(db, user_id)
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Hash password if updated
    if user_in.password:
        user_in.password = hash_password(user_in.password)

    updated_user = user_repo.update(db, db_obj=db_user, obj_in=user_in)
    AuditLogService.log(db, user_id=admin.id, action="UPDATE_USER", details=f"Updated user {updated_user.email}")
    return updated_user

@router.get("/roles", response_model=List[RoleResponse])
def get_roles(
    db: Session = Depends(get_db),
    admin: User = Depends(RoleChecker(["ADMIN"]))
):
    return role_repo.get_multi(db)

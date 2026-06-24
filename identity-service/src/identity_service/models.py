from pydantic import BaseModel, EmailStr, Field


class RegisterIn(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8)
    display_name: str = ""
    audience: str


class LoginIn(BaseModel):
    email: EmailStr
    password: str
    audience: str


class RefreshIn(BaseModel):
    refresh_token: str


class LogoutIn(BaseModel):
    refresh_token: str
    all_sessions: bool = False


class VerifyEmailIn(BaseModel):
    token: str


class RequestResetIn(BaseModel):
    email: EmailStr


class ResetPasswordIn(BaseModel):
    token: str
    new_password: str = Field(min_length=8)


class ChangePasswordIn(BaseModel):
    old_password: str
    new_password: str = Field(min_length=8)


class HandoffExchangeIn(BaseModel):
    handoff_code: str


class RoleIn(BaseModel):
    client: str
    role: str


class ClientIn(BaseModel):
    slug: str
    name: str = ""

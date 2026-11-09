"""Modelos Pydantic para autenticación."""

from pydantic import BaseModel, Field


class Credentials(BaseModel):
    email: str
    password: str


class TokenData(BaseModel):
    sub: str


class PasswordChange(BaseModel):
    current_password: str = Field(min_length=1, max_length=128)
    new_password: str = Field(min_length=12, max_length=128)


class MfaCode(BaseModel):
    code: str = Field(min_length=6, max_length=32)


class MfaDisable(BaseModel):
    password: str = Field(min_length=1, max_length=128)
    code: str = Field(min_length=6, max_length=32)


class MfaVerify(BaseModel):
    mfa_token: str = Field(min_length=1)
    code: str = Field(min_length=6, max_length=32)


class MfaChallenge(BaseModel):
    mfa_token: str = Field(min_length=1)


class MfaEmailDisable(BaseModel):
    password: str = Field(min_length=1, max_length=128)

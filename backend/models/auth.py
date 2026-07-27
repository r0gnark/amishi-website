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

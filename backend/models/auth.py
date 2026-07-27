"""Modelos Pydantic para autenticación."""

from pydantic import BaseModel


class Credentials(BaseModel):
    email: str
    password: str


class TokenData(BaseModel):
    sub: str

from typing import Optional
from pydantic import BaseModel


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: int
    user_role: str


class TokenPayload(BaseModel):
    sub: Optional[str] = None
    exp: int
    email: Optional[str] = None
    role: Optional[str] = None
    name: Optional[str] = None

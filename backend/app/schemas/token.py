from typing import Optional, List
from pydantic import BaseModel


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: int
    user_roles: List[str]
    active_role: str


class TokenPayload(BaseModel):
    sub: Optional[str] = None
    exp: int
    email: Optional[str] = None
    roles: Optional[List[str]] = None
    active_role: Optional[str] = None
    name: Optional[str] = None

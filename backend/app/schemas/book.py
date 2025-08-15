from __future__ import annotations
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field

class BookOut(BaseModel):
    id: int
    title: str
    author: str
    created_at: datetime
    created_by: str

    model_config = ConfigDict(from_attributes=True)

class BookCreate(BaseModel):
    title: str = Field(min_length=1, max_length=255, description="Book title")
    author: str = Field(min_length=1, max_length=255, description="Author name")
    created_by: Optional[str] = Field(
        default="system", min_length=1, max_length=255, description="Creator username"
    )

    model_config = ConfigDict(extra="forbid")

class BookUpdate(BaseModel):
    title: Optional[str] = Field(default=None, min_length=1, max_length=255)
    author: Optional[str] = Field(default=None, min_length=1, max_length=255)
    created_by: Optional[str] = Field(default=None, min_length=1, max_length=255)

    model_config = ConfigDict(extra="forbid")

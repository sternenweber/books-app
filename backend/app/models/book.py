from __future__ import annotations
from datetime import datetime
from sqlalchemy import DateTime, String, func, Index
from sqlalchemy.orm import Mapped, mapped_column
from app.db.base import Base


class Book(Base):
    __tablename__ = "book"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    author: Mapped[str] = mapped_column(String(255), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
        index=True
    )
    created_by: Mapped[str] = mapped_column(String(255), nullable=False)

    __table_args__ = (
        Index("ix_book_title_lower", func.lower(title)),
    )

    def __repr__(self) -> str:
        return f"<Book id={self.id} title={self.title!r}>"

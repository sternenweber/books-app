"""create book table

Revision ID: 537dc6c96509
Revises:
Create Date: 2025-08-15 10:21:59.973668
"""
from alembic import op
import sqlalchemy as sa

revision = "537dc6c96509"
down_revision = None
branch_labels = None
depends_on = None

def upgrade() -> None:
    op.create_table(
        "book",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.Column("author", sa.String(length=255), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("created_by", sa.String(length=255), nullable=False),
    )
    op.create_index("ix_book_created_at", "book", ["created_at"], unique=False)
    op.create_index("ix_book_title_lower", "book", [sa.text("lower(title)")], unique=False)

def downgrade() -> None:
    op.drop_index("ix_book_title_lower", table_name="book")
    op.drop_index("ix_book_created_at", table_name="book")
    op.drop_table("book")

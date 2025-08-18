"""init schema

Revision ID: xxxx_init_schema
Revises: 
Create Date: 2025-08-18 07:17:46.258233
"""

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = "xxxx_init_schema"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "book",
        sa.Column("id", sa.Integer, primary_key=True, index=True),
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.Column("author", sa.String(length=255), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.Column("created_by", sa.String(length=100), nullable=False),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("deleted_by", sa.String(length=100), nullable=True),
    )

    # Explicit indexes
    op.create_index("ix_book_created_at", "book", ["created_at"])
    op.create_index("ix_book_deleted_at", "book", ["deleted_at"])
    op.create_index("ix_book_title", "book", ["title"])
    op.create_index("ix_book_title_lower", "book", [sa.text("lower(title)")], unique=False)


def downgrade() -> None:
    op.drop_index("ix_book_title_lower", table_name="book")
    op.drop_index("ix_book_title", table_name="book")
    op.drop_index("ix_book_deleted_at", table_name="book")
    op.drop_index("ix_book_created_at", table_name="book")
    op.drop_table("book")

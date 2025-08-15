from __future__ import annotations
from sqlalchemy import select, func
from app.db.session import SessionLocal
from app.models.book import Book

DEMO_BOOKS = [
    {"title": "Clean Code", "author": "Robert C. Martin", "created_by": "system"},
    {"title": "The Pragmatic Programmer", "author": "Andrew Hunt", "created_by": "system"},
    {"title": "Design Patterns", "author": "Erich Gamma", "created_by": "system"},
    {"title": "Refactoring", "author": "Martin Fowler", "created_by": "system"},
    {"title": "Introduction to Algorithms", "author": "Cormen/Leiserson/Rivest/Stein", "created_by": "system"},
    {"title": "Domain-Driven Design", "author": "Eric Evans", "created_by": "system"},
    {"title": "Effective Java", "author": "Joshua Bloch", "created_by": "system"},
    {"title": "You Don't Know JS", "author": "Kyle Simpson", "created_by": "system"},
    {"title": "Python Crash Course", "author": "Eric Matthes", "created_by": "system"},
    {"title": "Fluent Python", "author": "Luciano Ramalho", "created_by": "system"},
]

def run() -> None:
    with SessionLocal() as db:
        existing = db.execute(select(func.count()).select_from(Book)).scalar_one()
        if existing and existing > 0:
            return

        for row in DEMO_BOOKS:
            exists = db.execute(
                select(Book).where(
                    func.lower(Book.title) == row["title"].lower(),
                    func.lower(Book.author) == row["author"].lower(),
                )
            ).first()
            if exists:
                continue
            db.add(Book(**row))

        db.commit()

if __name__ == "__main__":
    run()

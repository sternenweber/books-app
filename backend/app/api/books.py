from fastapi import APIRouter, Depends, HTTPException, Path, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from datetime import date, datetime, timedelta, timezone

from app.db.session import SessionLocal
from app.models.book import Book
from app.schemas.book import BookOut, BookCreate, BookUpdate

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def _start_of_day(d: date) -> datetime:
    return datetime.combine(d, datetime.min.time()).replace(tzinfo=timezone.utc)

def _end_of_day_exclusive(d: date) -> datetime:
    next_day = d + timedelta(days=1)
    return datetime.combine(next_day, datetime.min.time()).replace(tzinfo=timezone.utc)

@router.get("/books", response_model=List[BookOut])
def list_books(
    q: Optional[str] = Query(None, description="Case-insensitive search in title"),
    created_from: Optional[date] = Query(None, description="YYYY-MM-DD inclusive start"),
    created_to: Optional[date] = Query(None, description="YYYY-MM-DD inclusive end"),
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
):
    query = db.query(Book)

    if q:
        query = query.filter(func.lower(Book.title).like(f"%{q.lower()}%"))

    if created_from:
        query = query.filter(Book.created_at >= _start_of_day(created_from))
    if created_to:
        query = query.filter(Book.created_at < _end_of_day_exclusive(created_to))

    return (
        query.order_by(Book.created_at.desc(), Book.id.desc())
        .offset(offset)
        .limit(limit)
        .all()
    )

@router.get("/books/count")
def count_books(
    q: Optional[str] = Query(None, description="Case-insensitive search in title"),
    created_from: Optional[date] = Query(None, description="YYYY-MM-DD inclusive start"),
    created_to: Optional[date] = Query(None, description="YYYY-MM-DD inclusive end"),
    db: Session = Depends(get_db),
):
    query = db.query(func.count(Book.id))

    if q:
        query = query.filter(func.lower(Book.title).like(f"%{q.lower()}%"))
    if created_from:
        query = query.filter(Book.created_at >= _start_of_day(created_from))
    if created_to:
        query = query.filter(Book.created_at < _end_of_day_exclusive(created_to))

    total = query.scalar() or 0
    return {"total": total}

@router.get("/books/{book_id}", response_model=BookOut)
def get_book(
    book_id: int = Path(..., ge=1),
    db: Session = Depends(get_db),
):
    book = db.get(Book, book_id)
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")
    return book

@router.post("/books", response_model=BookOut, status_code=201)
def create_book(
    payload: BookCreate,
    db: Session = Depends(get_db),
):
    exists = (
        db.query(Book)
        .filter(
            func.lower(Book.title) == payload.title.lower(),
            func.lower(Book.author) == payload.author.lower(),
        )
        .first()
    )
    if exists:
        raise HTTPException(status_code=409, detail="Book already exists")

    book = Book(
        title=payload.title,
        author=payload.author,
        created_by=payload.created_by or "system",
    )
    db.add(book)
    db.commit()
    db.refresh(book)
    return book

@router.put("/books/{book_id}", response_model=BookOut)
@router.patch("/books/{book_id}", response_model=BookOut)
def update_book(
    payload: BookUpdate,
    book_id: int = Path(..., ge=1),
    db: Session = Depends(get_db),
):
    book = db.get(Book, book_id)
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(book, field, value)

    db.add(book)
    db.commit()
    db.refresh(book)
    return book

@router.delete("/books/{book_id}", status_code=204)
def delete_book(
    book_id: int = Path(..., ge=1),
    db: Session = Depends(get_db),
):
    book = db.get(Book, book_id)
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")

    db.delete(book)
    db.commit()
    return None



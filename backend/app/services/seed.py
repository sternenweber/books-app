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
    {"title": "JavaScript: The Good Parts", "author": "Douglas Crockford", "created_by": "system"},
    {"title": "Head First Design Patterns", "author": "Eric Freeman", "created_by": "system"},
    {"title": "Test-Driven Development", "author": "Kent Beck", "created_by": "system"},
    {"title": "Continuous Delivery", "author": "Jez Humble", "created_by": "system"},
    {"title": "Working Effectively with Legacy Code", "author": "Michael Feathers", "created_by": "system"},
    {"title": "Programming Pearls", "author": "Jon Bentley", "created_by": "system"},
    {"title": "Code Complete", "author": "Steve McConnell", "created_by": "system"},
    {"title": "Structure and Interpretation of Computer Programs", "author": "Abelson & Sussman", "created_by": "system"},
    {"title": "Algorithms", "author": "Robert Sedgewick", "created_by": "system"},
    {"title": "Programming Rust", "author": "Jim Blandy", "created_by": "system"},
    {"title": "Learning Python", "author": "Mark Lutz", "created_by": "system"},
    {"title": "Automate the Boring Stuff with Python", "author": "Al Sweigart", "created_by": "system"},
    {"title": "The Art of Computer Programming", "author": "Donald Knuth", "created_by": "system"},
    {"title": "Effective Python", "author": "Brett Slatkin", "created_by": "system"},
    {"title": "Modern Operating Systems", "author": "Andrew Tanenbaum", "created_by": "system"},
    {"title": "Computer Networking: A Top-Down Approach", "author": "Kurose & Ross", "created_by": "system"},
    {"title": "Operating System Concepts", "author": "Silberschatz, Galvin, Gagne", "created_by": "system"},
    {"title": "Compilers: Principles, Techniques, and Tools", "author": "Aho, Lam, Sethi, Ullman", "created_by": "system"},
    {"title": "Clean Architecture", "author": "Robert C. Martin", "created_by": "system"},
    {"title": "Agile Software Development", "author": "Robert C. Martin", "created_by": "system"},
    {"title": "Building Microservices", "author": "Sam Newman", "created_by": "system"},
    {"title": "Microservices Patterns", "author": "Chris Richardson", "created_by": "system"},
    {"title": "RESTful Web APIs", "author": "Leonard Richardson", "created_by": "system"},
    {"title": "Spring in Action", "author": "Craig Walls", "created_by": "system"},
    {"title": "Hibernate in Action", "author": "Christian Bauer", "created_by": "system"},
    {"title": "Pro Git", "author": "Scott Chacon", "created_by": "system"},
    {"title": "Kubernetes Up & Running", "author": "Brendan Burns", "created_by": "system"},
    {"title": "Docker Deep Dive", "author": "Nigel Poulton", "created_by": "system"},
    {"title": "Terraform: Up & Running", "author": "Yevgeniy Brikman", "created_by": "system"},
    {"title": "Cloud Native Patterns", "author": "Cornelia Davis", "created_by": "system"},
    {"title": "Designing Data-Intensive Applications", "author": "Martin Kleppmann", "created_by": "system"},
    {"title": "Fundamentals of Database Systems", "author": "Elmasri & Navathe", "created_by": "system"},
    {"title": "SQL Antipatterns", "author": "Bill Karwin", "created_by": "system"},
    {"title": "NoSQL Distilled", "author": "Pramod J. Sadalage", "created_by": "system"},
    {"title": "Data Science for Business", "author": "Provost & Fawcett", "created_by": "system"},
    {"title": "Hands-On Machine Learning with Scikit-Learn, Keras, and TensorFlow", "author": "Aurélien Géron", "created_by": "system"},
    {"title": "Deep Learning", "author": "Ian Goodfellow", "created_by": "system"},
    {"title": "Pattern Recognition and Machine Learning", "author": "Christopher Bishop", "created_by": "system"},
    {"title": "Artificial Intelligence: A Modern Approach", "author": "Russell & Norvig", "created_by": "system"},
    {"title": "Grokking Algorithms", "author": "Aditya Bhargava", "created_by": "system"},
    {"title": "Eloquent JavaScript", "author": "Marijn Haverbeke", "created_by": "system"},
    {"title": "Java Concurrency in Practice", "author": "Brian Goetz", "created_by": "system"},
    {"title": "C Programming Language", "author": "Brian Kernighan & Dennis Ritchie", "created_by": "system"},
    {"title": "Programming in Haskell", "author": "Graham Hutton", "created_by": "system"},
    {"title": "Learn You a Haskell for Great Good!", "author": "Miran Lipovača", "created_by": "system"},
    {"title": "The Rust Programming Language", "author": "Steve Klabnik & Carol Nichols", "created_by": "system"},
    {"title": "Programming Elixir", "author": "Dave Thomas", "created_by": "system"},
    {"title": "Programming Erlang", "author": "Joe Armstrong", "created_by": "system"},
    {"title": "Seven Languages in Seven Weeks", "author": "Bruce Tate", "created_by": "system"},
    {"title": "Learn Python the Hard Way", "author": "Zed Shaw", "created_by": "system"}
]

def run() -> None:
    with SessionLocal() as db:
        existing_pairs = {
            (t, a)
            for (t, a) in db.execute(
                select(func.lower(Book.title), func.lower(Book.author))
            ).all()
        }

        new_rows = []
        for row in DEMO_BOOKS:
            key = (row["title"].lower(), row["author"].lower())
            if key in existing_pairs:
                continue
            new_rows.append(Book(**row))

        if new_rows:
            db.add_all(new_rows)
            db.commit()

if __name__ == "__main__":
    run()

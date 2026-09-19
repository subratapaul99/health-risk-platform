"""
Database engine setup.

Defaults to SQLite for local/dev use (zero setup). In the architecture doc
this is PostgreSQL in production -- just set DATABASE_URL, e.g.
    postgresql+psycopg2://user:password@host:5432/health_risk
and nothing else in the codebase changes, since we go through SQLAlchemy.
"""

import os

from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./health_risk.db")

connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}

engine = create_engine(DATABASE_URL, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

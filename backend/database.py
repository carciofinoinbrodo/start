import os
import logging
from sqlmodel import SQLModel, Session, create_engine
from sqlalchemy import text
from pathlib import Path

logger = logging.getLogger(__name__)

# Support both SQLite (local dev) and PostgreSQL (production)
DATABASE_URL = os.getenv("DATABASE_URL")
IS_POSTGRES = False

if DATABASE_URL:
    # Render/Railway uses postgres:// but SQLAlchemy needs postgresql+psycopg:// for psycopg3
    if DATABASE_URL.startswith("postgres://"):
        DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql+psycopg://", 1)
    elif DATABASE_URL.startswith("postgresql://"):
        DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+psycopg://", 1)
    # PostgreSQL doesn't need check_same_thread
    engine = create_engine(DATABASE_URL)
    IS_POSTGRES = True
else:
    # Fallback to SQLite for local development
    DATABASE_PATH = Path(__file__).parent / "aiseo.db"
    DATABASE_URL = f"sqlite:///{DATABASE_PATH}"
    engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
    IS_POSTGRES = False


def enable_pgvector_extension():
    """Enable pgvector extension in PostgreSQL (required for vector similarity search)"""
    if not IS_POSTGRES:
        logger.info("Skipping pgvector extension (SQLite does not support extensions)")
        return

    try:
        with engine.connect() as conn:
            conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector"))
            conn.commit()
            logger.info("pgvector extension enabled successfully")
    except Exception as e:
        logger.warning(f"Could not enable pgvector extension: {e}")
        logger.warning("Vector search features will not be available")


def create_db_and_tables():
    """Create all tables in the database"""
    # Enable pgvector extension first (for PostgreSQL)
    enable_pgvector_extension()
    # Then create all tables
    SQLModel.metadata.create_all(engine)


def get_session():
    """Dependency for FastAPI routes"""
    with Session(engine) as session:
        yield session


def is_vector_search_available() -> bool:
    """Check if vector search (pgvector) is available"""
    if not IS_POSTGRES:
        return False
    try:
        with engine.connect() as conn:
            result = conn.execute(
                text("SELECT 1 FROM pg_extension WHERE extname = 'vector'")
            )
            return result.fetchone() is not None
    except Exception:
        return False

from sqlmodel import SQLModel, Session, create_engine
from pathlib import Path

# Database file in the backend directory
DATABASE_PATH = Path(__file__).parent / "aiseo.db"
DATABASE_URL = f"sqlite:///{DATABASE_PATH}"

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})


def create_db_and_tables():
    """Create all tables in the database"""
    SQLModel.metadata.create_all(engine)


def get_session():
    """Dependency for FastAPI routes"""
    with Session(engine) as session:
        yield session

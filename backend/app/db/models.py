"""
ORM schema.

Deliberately separates the raw submitted inputs (health_submissions) from
the model output (predictions), with the model version stored on every
prediction row. Adds User model for authentication, profile tracking,
and role-based permissions (admin/patient).
"""

import datetime

from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    JSON,
    String,
)
from sqlalchemy.orm import relationship

from app.db.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String, nullable=True)
    is_admin = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)


class HealthSubmission(Base):
    __tablename__ = "health_submissions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, index=True, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Raw clinical inputs
    pregnancies = Column(Float)
    glucose = Column(Float)
    blood_pressure = Column(Float)
    skin_thickness = Column(Float)
    insulin = Column(Float)
    bmi = Column(Float)
    diabetes_pedigree = Column(Float)
    age = Column(Float)

    prediction = relationship(
        "Prediction", back_populates="submission", uselist=False
    )


class Prediction(Base):
    __tablename__ = "predictions"

    id = Column(Integer, primary_key=True, index=True)
    submission_id = Column(Integer, ForeignKey("health_submissions.id"), nullable=False)
    user_id = Column(String, index=True, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    risk_score = Column(Float, nullable=False)  # probability, 0-1
    risk_band = Column(String, nullable=False)  # low / moderate / high
    model_version = Column(String, nullable=False)

    # Per-prediction SHAP attribution, stored as {feature: value}
    shap_values = Column(JSON, nullable=False)
    base_value = Column(Float, nullable=False)

    submission = relationship("HealthSubmission", back_populates="prediction")

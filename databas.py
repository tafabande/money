from datetime import datetime, timezone
from sqlmodel import SQLModel, Field
from typing import Optional

class Deposit(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    time: str # Store as string to match webapp 'when' or Firebase date
    amount: float
    depositor: str # partner in activities
    reason: str # note in activities
    category: str # goal in activities
    
    # Firebase metadata
    firebase_id: Optional[str] = Field(default=None, index=True)
    timestamp: Optional[datetime] = Field(default=None) # serverTimestamp from Firebase

    # New fields to support Google Sheets syncing and retry tracking
    sheet_synced: bool = Field(default=False, nullable=False)
    sheet_attempts: int = Field(default=0, nullable=False)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class Goal(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(index=True, unique=True)
    target: float
    saved: float
    firebase_id: Optional[str] = Field(default=None, index=True)

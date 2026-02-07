from sqlmodel import SQLModel, create_engine, Session, select
from databas import Deposit, Goal
from excell import file, Filepath
import pandas as pd
import logging
import os
import sqlite3
from typing import Dict, Any

File_path = "files/dbs.db"

# Ensure folder exists
os.makedirs(os.path.dirname(File_path), exist_ok=True)

# Use check_same_thread=False to allow ThreadingHTTPServer to use DB from handler threads
engine = create_engine(f"sqlite:///{File_path}", echo=False, connect_args={"check_same_thread": False})

# Ensure WAL for better concurrency
def _enable_sqlite_wal(path: str):
    try:
        conn = sqlite3.connect(path)
        conn.execute("PRAGMA journal_mode=WAL;")
        conn.execute("PRAGMA synchronous=NORMAL;")
        conn.commit()
        conn.close()
    except Exception as e:
        logging.warning("Could not enable WAL: %s", e)

_enable_sqlite_wal(File_path)

# Create tables
SQLModel.metadata.create_all(engine)

logging.basicConfig(level=logging.INFO)


def init_db():
    # noop for now since metadata.create_all already runs; kept for compatibility
    logging.info("Database initialized at %s", File_path)


def insert_deposit(data: Dict[str, Any]) -> int:
    """Insert a deposit record into local SQLite and sync to Excel.
    data expected: { 'time': 'YYYY-MM-DD', 'amount': float, 'depositor': str, 'reason': str, 'category': str, 'firebase_id': str, 'timestamp': datetime }
    Returns the inserted deposit id."""
    with Session(engine) as session:
        deposit = Deposit(
            time=data.get('time'),
            amount=data.get('amount'),
            depositor=data.get('depositor'),
            reason=data.get('reason'),
            category=data.get('category'),
            firebase_id=data.get('firebase_id'),
            timestamp=data.get('timestamp')
        )
        session.add(deposit)
        session.commit()
        session.refresh(deposit)
        inserted_id = deposit.id

    # Sync to Excel (best-effort)
    try:
        old_df = file()
        new_row = pd.DataFrame([[data.get('time'), data.get('amount'), data.get('depositor'), data.get('reason'), data.get('category')]],
                               columns=["Date", "Amount", "Depositor", "Reason", "Category"])
        df = pd.concat([old_df, new_row], ignore_index=True)
        df.to_excel(Filepath, index=False)
    except Exception as e:
        logging.warning("Excel sync failed: %s", e)

    return inserted_id


def dbstatement():
    with Session(engine) as session:
        statement = select(Deposit.amount, Deposit.category)
        results = session.exec(statement).all()

        balances = {}
        total_overall = 0
        for amount, category in results:
            total_overall += amount
            balances[category] = balances.get(category, 0) + amount

        balances['Total Balance'] = total_overall
        return balances


def mark_sheet_sync(deposit_id: int, success: bool):
    """Update sheet sync columns for a deposit."""
    with Session(engine) as session:
        deposit = session.get(Deposit, deposit_id)
        if not deposit:
            return False
        if success:
            deposit.sheet_synced = True
        else:
            deposit.sheet_attempts = (deposit.sheet_attempts or 0) + 1
        session.add(deposit)
        session.commit()
        return True

def upsert_goal(name: str, target: float, saved: float, firebase_id: str = None):
    with Session(engine) as session:
        statement = select(Goal).where(Goal.name == name)
        goal = session.exec(statement).first()
        if goal:
            goal.target = target
            goal.saved = saved
            if firebase_id:
                goal.firebase_id = firebase_id
        else:
            goal = Goal(name=name, target=target, saved=saved, firebase_id=firebase_id)
            session.add(goal)
        session.commit()
        return goal

def get_all_deposits():
    with Session(engine) as session:
        return session.exec(select(Deposit)).all()

def get_all_goals():
    with Session(engine) as session:
        return session.exec(select(Goal)).all()

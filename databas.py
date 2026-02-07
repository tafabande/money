from datetime import date
from sqlmodel import SQLModel, Field
from typing import Optional

class Deposit(SQLModel,table = True):
    time: date = Field(default_factory=date.today)
    id: Optional[int]= Field(default = None, primary_key = True)
    depositor: str
    amount: float
    reason: str
    category: str



    
    


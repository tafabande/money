from sqlmodel import SQLModel, create_engine,Session,select
from databas import Deposit
from excell import file, Filepath
import pandas as pd

File_path = "files/dbs.db"

engine = create_engine(f"sqlite:///{File_path}", echo = True)
SQLModel.metadata.create_all(engine)

def updatedb(data):
    with Session(engine) as session:

        deposit = Deposit(time=data[0],
                          depositor =data[2],
                          reason = data[3],
                          amount= data[1])

        session.add(deposit)
        session.commit()
    
    # Sync to Excel
    old_df = file()
    new_row = pd.DataFrame([data], columns=["Date", "Amount", "Depositor", "Reason"])
    df = pd.concat([old_df, new_row], ignore_index=True)
    df.to_excel(Filepath, index=False)

def dbstatement():
    with Session(engine) as session:
        statement_a = select(Deposit.amount).where(Deposit.depositor == "Taa")
        total_a= sum (session.exec(statement_a).all())

        statement_b = select(Deposit.amount).where(Deposit.depositor == "Pana")
        total_b= sum (session.exec(statement_b).all())

        statement =  select(Deposit.amount)
        total = session.exec(statement).all()
        balance = {
            'Pana': total_b,
            'Taa': total_a,
            'Balance': total
        }
        return balance
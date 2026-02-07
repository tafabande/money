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
                          amount= data[1],
                          depositor =data[2],
                          reason = data[3],
                          category = data[4])

        session.add(deposit)
        session.commit()
    
    # Sync to Excel
    old_df = file()
    new_row = pd.DataFrame([data], columns=["Date", "Amount", "Depositor", "Reason", "Category"])
    df = pd.concat([old_df, new_row], ignore_index=True)
    df.to_excel(Filepath, index=False)

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
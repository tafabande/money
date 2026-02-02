from sqlmodel import SQLModel, create_engine,Session,select
from databas import Deposit

File_path = "files/dbs.db"

engine = create_engine(f"sqlite:///{File_path}", echo = True)
SQLModel.metadata.create_all(engine)

def updatedb(data):
    with Session(engine) as session:

        deposit = Deposit(depositor =data[2],
                          reason = data[3],
                          amount= data[1])

    session.add(deposit)
    session.commit()

def dbstatement():
    with Session(engine) as session:
        statement_a = select(Deposit.amount).where(Deposit.depositor == "Taa")
        total_a= sum ([row for row,in session.exec(statement_a)])

        statement_b = select(Deposit.amount).where(Deposit.depositor == "Pana")
        total_b= sum ([row for row,in session.exec(statement_b)])

        statement =  select(Deposit.amount)
        total = [row for row,in session.exec(statement)]
        balance = {
            'Pana': total_b,
            'Taa': total_a,
            'Balance': total
        }
        return balance
from datetime import datetime,date
from databas_logic import updatedb, dbstatement



def get_data():
    """code to get data to input into the Excel file"""
    get_amount = int(input("Enter amount ... "))
    get_reason = input("What is it for...")
    get_depositor = input("What is it for...")
    get_date = date.today()

    data = [get_date,get_amount,get_depositor,get_reason ]
    return data


def main():
    choice = input("Would you like to UPDATE or check BALANCE?:.... ").upper()

    if choice == "UPDATE":
        updatedb(get_data())
        print(f"update for{datetime.now}has been completed successfully")
    elif choice == "BALANCE":
        statement = dbstatement()
        for key,value in statement.items():
            print(f"{key}: {value}")




if __name__ == "__main__":
    main()
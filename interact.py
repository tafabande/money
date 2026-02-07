from datetime import datetime,date
from databas_logic import updatedb, dbstatement



def get_data(is_deduction=False):
    """code to get data to input into the Excel file"""
    if is_deduction:
        print("\n--- 💸 Deducting Moolah 💸 ---")
    else:
        print("\n--- 💸 Adding a New Entry 💸 ---")

    try:
        get_amount = int(input("How much moolah we talking? 💰: "))
    except ValueError:
        print("Whoops! That doesn't look like a number. Let's try again with 0.")
        get_amount = 0
        
    if is_deduction:
        get_amount = -abs(get_amount)
        get_category = "Other"
        print(f"Submitting as a deduction from 'Other' category.")
    else:
        print("\nWhere should this be filed under?")
        print("1. Stand")
        print("2. Maroro")
        print("3. Event")
        print("4. Other")
        cat_choice = input("Select a category (1-4): ").strip()
        cat_map = {"1": "Stand", "2": "Maroro", "3": "Event", "4": "Other"}
        get_category = cat_map.get(cat_choice, "Other")

    get_reason = input("What's the story behind this? ✨: ")
    get_depositor = input("Who's the generous soul? (Taah/Panah/Other) 👤: ").strip()
    get_date = date.today()

    data = [get_date, get_amount, get_depositor, get_reason, get_category]
    return data


def main():
    print("🌟 Welcome to the Money Tracker 🌟")
    
    while True:
        print("\nWhat's the plan for today?")
        print("1. UPDATE - Add some fresh data 📈")
        print("2. BALANCE - See where we stand ⚖️")
        print("3. DEDUCT - Take some out 💸")
        print("4. EXIT - Catch you later! 👋")
        
        choice = input("\nPick a number or type your choice: ").upper()

        if choice in ["1", "UPDATE"]:
            updatedb(get_data())
            print(f"\n✅ Boom! Update for {datetime.now().strftime('%Y-%m-%d %H:%M')} is locked and loaded!")
        
        elif choice in ["2", "BALANCE"]:
            print("\n--- 📊 Current Financial Standing 📊 ---")
            statement = dbstatement()
            for key, value in statement.items():
                print(f"🔹 {key:.<15} {value}")
            print("-" * 40)
            
        elif choice in ["3", "DEDUCT"]:
            updatedb(get_data(is_deduction=True))
            print(f"\n✅ Deduction for {datetime.now().strftime('%Y-%m-%d %H:%M')} is locked and loaded!")

        elif choice in ["4", "EXIT", "QUIT"]:
            print("\nStay wealthy! See ya next time! ✌️✨")
            break
        
        else:
            print("\n🤔 Hmm, that wasn't an option. Try 'UPDATE', 'BALANCE', 'DEDUCT', or 'EXIT'!")

        cont = input("\nWant to do something else? (y/n): ").lower()
        if cont != 'y':
            print("\nAdios! Have a great one! 👋")
            break




if __name__ == "__main__":
    main()
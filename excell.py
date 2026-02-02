from interact import get_data
from datetime import datetime
import os
import pandas as pd

Filepath = 'files/money.xlsx'
Cols = ["Date","Amount","Depositor","Reason"]

def file():
    """handles the file availability"""
    if not os.path.exists(Filepath):
        df = pd.DataFrame(columns=Cols)
        df.to_excel(Filepath,index=False)

    df = pd.read_excel(Filepath)
    return df

def update():
    data = get_data()
    old_df = file()
    df = pd.concat([old_df,data])
    df.to_excel(Filepath,index=False)

   
   


 



# from interact import get_data

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

def update(data):
    from databas_logic import updatedb
    updatedb(data)

   
   


 



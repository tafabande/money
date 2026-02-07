import logging
import time
import os
from typing import List

CREDENTIALS_PATH = os.environ.get('GOOGLE_CREDENTIALS_PATH', 'files/ourmonry.json.json')
SHEET_ID = "1HIlSyIp-FQy4HArVdBbZ87AHrbfdhSXRgyE5NUbrh6GaL8enMUeh"


def _load_gspread():
    try:
        import gspread
        from google.oauth2.service_account import Credentials
        return gspread, Credentials
    except Exception as e:
        logging.warning("gspread/google-auth not available: %s", e)
        return None, None


def _authorize():
    gspread, Credentials = _load_gspread()
    if gspread is None or Credentials is None:
        raise RuntimeError('gspread or google-auth not installed')
    if not os.path.exists(CREDENTIALS_PATH):
        raise RuntimeError(f'Credentials not found at {CREDENTIALS_PATH}')

    scopes = [
        'https://www.googleapis.com/auth/spreadsheets',
        'https://www.googleapis.com/auth/drive'
    ]
    creds = Credentials.from_service_account_file(CREDENTIALS_PATH, scopes=scopes)
    client = gspread.authorize(creds)
    return client


def append_row(sheet_id: str, row: List[str], worksheet: str = None) -> bool:
    """Append a row to Google Sheet. Returns True on success."""
    client = _authorize()
    sh = client.open_by_key(sheet_id)
    ws = sh.sheet1 if worksheet is None else sh.worksheet(worksheet)
    ws.append_row(row)
    return True


def append_with_retries(sheet_id: str, row: List[str], worksheet: str = None, retries: int = 3) -> bool:
    delay = 0.5
    for attempt in range(1, retries + 1):
        try:
            append_row(sheet_id, row, worksheet)
            return True
        except Exception as e:
            logging.warning('Sheets append attempt %s failed: %s', attempt, e)
            time.sleep(delay)
            delay *= 2
    return False

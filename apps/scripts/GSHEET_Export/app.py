from Google import create_service 
import pandas as pd

def run_batchUpdate_request(service, google_sheet_id, request_body_json):
    try:
        response = service.spreadsheets().batchUpdate(
            spreadsheetId=google_sheet_id,
            body=request_body_json
        ).execute()
        return response
    except Exception as e:
        print(e)
        return None

import os
from Google import create_service


# enter the path of your credentials file which you got during authentication
CLIENT_SECRET_FILE = ''  


API_SERVICE_NAME = 'sheets'
API_VERSION = 'v4'
SCOPES = ['https://www.googleapis.com/auth/spreadsheets']

# enter the id of your google spreadsheet
GOOGLE_SHEET_ID = '1KJSDsNVa8_Jqara1N7OxnXzRGCfjwBixZcvvh5Gneeg'

service = create_service(CLIENT_SECRET_FILE, API_SERVICE_NAME, API_VERSION, SCOPES)

"""
Iterate Worksheets
"""
gsheets = service.spreadsheets().get(spreadsheetId=GOOGLE_SHEET_ID).execute()
sheets = gsheets['sheets']

for sheet in sheets:
    if sheet['properties']['title'] != 'master':
        dataset = service.spreadsheets().values().get(
            spreadsheetId=GOOGLE_SHEET_ID,
            range=sheet['properties']['title'],
            majorDimension='ROWS'
        ).execute()
        df = pd.DataFrame(dataset['values'])
        df.columns = df.iloc[0]
        df.drop(df.index[0], inplace=True)
        df.to_csv(sheet['properties']['title'] + '.csv', index=False)
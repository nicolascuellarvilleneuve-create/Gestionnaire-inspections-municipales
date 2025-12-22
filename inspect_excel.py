
import pandas as pd
import json

try:
    file_path = "grille d'inspection.xlsx"
    # Read the Excel file, specifically the 'Data' sheet if possible, or list sheets
    xl = pd.ExcelFile(file_path)
    print(f"Sheets: {xl.sheet_names}")
    
    if 'Data' in xl.sheet_names:
        df = pd.read_excel(file_path, sheet_name='Data')
        print("Columns:", df.columns.tolist())
        print("First 3 rows:", df.head(3).to_dict(orient='records'))
    else:
        print("Sheet 'Data' not found. Reading first sheet.")
        df = pd.read_excel(file_path, sheet_name=0)
        print("Columns:", df.columns.tolist())
        print("First 3 rows:", df.head(3).to_dict(orient='records'))

except Exception as e:
    print(f"Error: {e}")

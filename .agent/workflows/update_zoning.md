---
description: How to update the Zoning Grid from Excel
---

If you modify the "grille d'inspection.xlsx" file, you must run the import script to update the application's data.

Steps:

1.  Save your changes to `grille d'inspection.xlsx` in the project root.
2.  Run the following command in the terminal:
    ```powershell
    node scripts/import_zoning.cjs
    ```
    // turbo
3.  Restart the development server if it's running (or it might HMR automatically).
4.  Verify the changes in the application (e.g., check margins for a specific zone).

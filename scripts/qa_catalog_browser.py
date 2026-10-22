"""Run the catalog UI against a new disposable SQL Server database.

Shares the guarded setup/teardown of the authentication browser runner. No
existing development or administrative database is used for application data.
"""

from qa_auth_browser import main


if __name__ == "__main__":
    main("04", "frontend/scripts/catalog-browser.mjs", {
        "CEMARIS_PORTAL_ENABLED": "true",
        "CEMARIS_FEE_TAX_PERCENTAGE_DEFAULT": "13",
        "CEMARIS_CONTRACT_PRINTS": '["screen/contract","pdf/synthetic"]',
        "CEMARIS_CUSTOM_PDF_PRINT_TITLES": '{"synthetic":"Synthetic Contract PDF"}',
    })

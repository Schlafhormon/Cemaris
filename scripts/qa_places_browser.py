"""Step-05 production UI/API QA on a newly created disposable SQL Server DB."""

import json

from qa_auth_browser import main


if __name__ == "__main__":
    main("05", "frontend/scripts/places-browser.mjs", {
        "CEMARIS_AUTH_CAN_UPDATE_CEMETERIES": '["qa-admin"]',
        "CEMARIS_PORTAL_ENABLED": "true",
        "CEMARIS_BURIAL_SITE_NAME_SEGMENTS": json.dumps({
            "includeCemeteryKey": True, "separator": "-", "segments": {
                "1": {"isAvailable": True, "isRequired": True, "label": "Row", "minLength": 1, "maxLength": 8, "pattern": "[A-Z]+"},
                "2": {"isAvailable": True, "isRequired": True, "label": "Number", "minLength": 1, "maxLength": 4, "pattern": "[0-9]+"},
            },
        }),
    })

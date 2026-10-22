"""Run from backend: python -m cemaris.import_tools --help."""

import argparse
import json
import logging
import os
from pathlib import Path

from cemaris.burial_sites import BurialSiteOptions
from cemaris.db.engine import create_database_engine
from .sql import import_legacy_csv


def main(argv=None):
    parser = argparse.ArgumentParser(description="Cemaris standalone import tools; disposable SQL Server databases only")
    parser.add_argument("--database-url", default=os.environ.get("CEMARIS_IMPORT_DATABASE_URL"), help="Separate disposable SQL Server URL")
    parser.add_argument("--showDebug", action="store_true")
    commands = parser.add_subparsers(dest="command", required=True)
    legacy = commands.add_parser("legacy-csv", help="Replace legacy source tables using CMMASTER/CMPRPAID/CMWKORDR CSVs")
    legacy.add_argument("master_path")
    legacy.add_argument("prepaid_path")
    legacy.add_argument("work_order_path")
    legacy.add_argument("--mapping", type=Path, help="JSON: cemeteries/funeralHomes/city/province")
    legacy.add_argument("--burial-site-naming", type=Path, help="JSON burialSiteNameSegments configuration")
    legacy.add_argument("--fee-category-id", type=int)
    legacy.add_argument("--audit", action="store_true")
    arguments = parser.parse_args(argv)
    if not arguments.database_url:
        parser.error("Set CEMARIS_IMPORT_DATABASE_URL or --database-url to a disposable SQL Server database")
    logging.basicConfig(level=logging.DEBUG if arguments.showDebug else logging.WARNING)
    engine = create_database_engine(arguments.database_url)
    try:
        with engine.begin() as connection:
            mapping = json.loads(arguments.mapping.read_text(encoding="utf-8")) if arguments.mapping else None
            options = BurialSiteOptions(burial_site_name_segments=json.loads(arguments.burial_site_naming.read_text(encoding="utf-8"))) if arguments.burial_site_naming else None
            result = import_legacy_csv(connection, arguments.master_path, arguments.prepaid_path, arguments.work_order_path,
                mapping=mapping, burial_site_options=options, audit_enabled=arguments.audit, fee_category_id=arguments.fee_category_id)
        print(json.dumps(result, ensure_ascii=False))
    finally:
        engine.dispose()


if __name__ == "__main__":
    main()

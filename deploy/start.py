"""Container entrypoint: fail before jobs start if SQL/schema is unavailable."""

import os
import sys

from readiness import main as database_ready


def main() -> int:
    if database_ready():
        return 1
    os.execv(sys.executable, [
        sys.executable, "-m", "uvicorn", "cemaris.main:app", "--host", "0.0.0.0",
        "--port", "8000", "--workers", "1", "--no-proxy-headers", "--no-access-log",
    ])
    return 1  # exec only returns when it fails.


if __name__ == "__main__":
    raise SystemExit(main())

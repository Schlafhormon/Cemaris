"""Run every isolated frozen-source oracle; never install or modify Sunrise.

Browser probes use CEMARIS_PLAYWRIGHT_MODULE/CEMARIS_BROWSER_EXECUTABLE.
This does not run the original complete application or Cypress/Axe suite.
"""
from __future__ import annotations

import json
from pathlib import Path
import subprocess
import time

ROOT = Path(__file__).resolve().parents[1]


def main() -> int:
    output = ROOT / ".local/qa-step16/reference"
    output.mkdir(parents=True, exist_ok=True)
    results = []
    for script in sorted((ROOT / "scripts").glob("reference_*.mjs")):
        started = time.monotonic()
        with (output / (script.stem + ".log")).open("w", encoding="utf-8") as log:
            try:
                result = subprocess.run(["node", str(script), "--check-fixture"], cwd=ROOT,
                                        stdout=log, stderr=subprocess.STDOUT, timeout=240)
                code = result.returncode
            except subprocess.TimeoutExpired:
                code = 124
        results.append({"script": script.name, "exit_code": code,
                        "seconds": round(time.monotonic() - started, 2)})
        print(f"{'PASS' if code == 0 else 'FAIL'}: {script.name}", flush=True)
    (output / "results.json").write_text(json.dumps(results, indent=2) + "\n", encoding="utf-8")
    return int(any(row["exit_code"] for row in results))


if __name__ == "__main__":
    raise SystemExit(main())

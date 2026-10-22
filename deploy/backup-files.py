#!/usr/bin/env python3
"""Snapshot Cemaris files; SQL backups remain the SQL server operator's job.

This command briefly stops the running API/web and always starts them again.
To pair it with a SQL backup, stop them beforehand, trigger the SQL backup on
SRV-SQL02, run this command with its reference, then start the services. A
reference is recorded, never presented as a verified SQL backup or restore.
"""

import argparse
from datetime import datetime, timezone
import fcntl
import hashlib
import json
import os
from pathlib import Path
import subprocess
import sys
import tarfile
from uuid import uuid4

ROOT = Path(__file__).resolve().parents[1]
COMPOSE = ["docker", "compose", "--project-directory", str(ROOT)]


def output(command):
    result = subprocess.run(command, capture_output=True, text=True)
    if result.returncode:
        raise RuntimeError("Deployment command failed; inspect service status privately")
    return result.stdout.strip()


def deployed_image(service, configured_image):
    # During an update the configured tag may already point to the candidate.
    # A snapshot must record the image of the existing container instead.
    containers = output(COMPOSE + ["ps", "--all", "--quiet", service]).splitlines()
    if len(containers) > 1:
        raise RuntimeError("A file snapshot requires exactly one container per service")
    if containers:
        return output(["docker", "inspect", containers[0], "--format", "{{.Image}}"])
    return output(["docker", "image", "inspect", configured_image, "--format", "{{.Id}}"])


def archive_volume(image, volume, path):
    code = ("import sys,tarfile; a=tarfile.open(fileobj=sys.stdout.buffer,mode='w|gz'); "
            "a.add('/source',arcname='.'); a.close()")
    with path.open("xb") as archive:
        result = subprocess.run([
            "docker", "run", "--rm", "--user", "0:0", "--network", "none",
            "--mount", f"type=volume,src={volume},dst=/source,readonly",
            "--entrypoint", "/app/.venv/bin/python", image, "-c", code,
        ], stdout=archive, stderr=subprocess.PIPE)
    if result.returncode:
        raise RuntimeError("Volume archive failed")
    with tarfile.open(path) as archive:
        archive.getmembers()


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--sql-backup-reference", help="Externally created SQL backup/job reference")
    args = parser.parse_args()
    os.umask(0o077)
    os.chdir(ROOT)
    config = json.loads(output(COMPOSE + ["config", "--format", "json"]))
    api = config["services"]["api"]
    volumes, customizations = {}, None
    for mount in api["volumes"]:
        if mount["target"] in {"/app/data/attachments", "/app/data/sessions"}:
            if mount["type"] != "volume":
                raise ValueError("Expected named application data volumes")
            volumes[Path(mount["target"]).name] = config["volumes"][mount["source"]]["name"]
        if mount["target"] == "/app/customizations":
            if mount["type"] != "bind" or not mount.get("read_only"):
                raise ValueError("Expected read-only host customizations")
            customizations = Path(mount["source"])
    if set(volumes) != {"attachments", "sessions"} or customizations is None:
        raise ValueError("Application persistence is incomplete")
    for volume in volumes.values():
        output(["docker", "volume", "inspect", volume])
    directory = ROOT / "backups"
    directory.mkdir(mode=0o700, exist_ok=True)
    os.chmod(directory, 0o700)
    with (directory / ".lock").open("a") as lock:
        fcntl.flock(lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
        running = output(COMPOSE + ["ps", "--status", "running", "--services"]).splitlines()
        if "migrate" in running:
            raise ValueError("Wait for migration before taking a file snapshot")
        restart = [service for service in ("api", "web") if service in running]
        destination = directory / (datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
                                   + "-" + uuid4().hex[:12])
        destination.mkdir(mode=0o700)
        manifest = {
            "status": "incomplete", "scope": "files-only",
            "created_utc": datetime.now(timezone.utc).isoformat(),
            "commit": output(["git", "rev-parse", "HEAD"]),
            "sql_backup_reference": args.sql_backup_reference,
            "sql_backup_verified": False,
            "images": {name: deployed_image(name, service["image"])
                       for name, service in config["services"].items()},
        }
        manifest_path = destination / "manifest.json"
        manifest_path.write_text(json.dumps(manifest, indent=2) + "\n")
        try:
            if restart:
                output(COMPOSE + ["stop", "web", "api"])
            manifest["files_quiesced_utc"] = datetime.now(timezone.utc).isoformat()
            for name, volume in volumes.items():
                archive_volume(api["image"], volume, destination / (name + ".tar.gz"))
            with tarfile.open(destination / "configuration.tar.gz", "x:gz") as archive:
                for name in (".env", "compose.yaml"):
                    archive.add(ROOT / name, arcname=name)
                archive.add(customizations, arcname="customizations")
                proxy = ROOT.parent / "reverse-proxy" / "Caddyfile"
                if proxy.is_file():
                    archive.add(proxy, arcname="proxy/Caddyfile")
                trust = ROOT / "deploy" / "trust"
                if trust.is_dir():
                    archive.add(trust, arcname="deploy/trust")
            manifest["sha256"] = {}
            for path in destination.glob("*.tar.gz"):
                with path.open("rb") as stream:
                    manifest["sha256"][path.name] = hashlib.file_digest(stream, "sha256").hexdigest()
            manifest["status"] = "complete"
        finally:
            manifest_path.write_text(json.dumps(manifest, indent=2) + "\n")
            if restart:
                output(COMPOSE + ["start", *restart])
        print("File snapshot completed: " + str(destination))
        print("SQL backup/verification remains external; inspect the manifest's scope and reference.")


if __name__ == "__main__":
    try:
        main()
    except Exception:
        print("Cemaris file snapshot failed; check configuration, disk and service health privately",
              file=sys.stderr)
        raise SystemExit(1)

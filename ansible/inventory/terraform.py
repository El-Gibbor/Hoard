#!/usr/bin/env python3
"""Ansible dynamic inventory built from the Terraform outputs in ../../terraform."""

import argparse
import json
import os
import shlex
import subprocess
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
TERRAFORM_DIR = os.environ.get("HOARD_TERRAFORM_DIR", os.path.join(ROOT, "terraform"))
EMPTY = {"_meta": {"hostvars": {}}}


def terraform_outputs():
    try:
        result = subprocess.run(
            ["terraform", f"-chdir={TERRAFORM_DIR}", "output", "-json"],
            capture_output=True,
            text=True,
            check=True,
        )
    except (OSError, subprocess.CalledProcessError) as error:
        print(f"terraform output failed: {error}", file=sys.stderr)
        return {}
    return {name: item["value"] for name, item in json.loads(result.stdout or "{}").items()}


def private_key(ssh_command):
    parts = shlex.split(ssh_command)
    return parts[parts.index("-i") + 1] if "-i" in parts else None


def inventory():
    outputs = terraform_outputs()
    host = outputs.get("public_ip")
    if not host:
        print(f"No public_ip output in {TERRAFORM_DIR}. Run terraform apply first.", file=sys.stderr)
        return EMPTY

    hostvars = {"ansible_user": outputs.get("admin_username", "hoard")}
    key = private_key(outputs.get("ssh_command", ""))
    if key:
        hostvars["ansible_ssh_private_key_file"] = key

    return {
        "hoard": {"hosts": [host]},
        "_meta": {"hostvars": {host: hostvars}},
    }


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument("--list", action="store_true")
    group.add_argument("--host")
    args = parser.parse_args()

    data = inventory()
    if args.host:
        data = data["_meta"]["hostvars"].get(args.host, {})
    print(json.dumps(data, indent=2))


if __name__ == "__main__":
    main()

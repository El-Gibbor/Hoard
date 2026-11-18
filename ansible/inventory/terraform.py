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
    return os.environ.get("HOARD_SSH_KEY") or (parts[parts.index("-i") + 1] if "-i" in parts else None)


def inventory():
    outputs = terraform_outputs()
    bastion = outputs.get("bastion_public_ip")
    app = outputs.get("app_private_ip")
    if not bastion or not app:
        print(f"No bastion_public_ip or app_private_ip output in {TERRAFORM_DIR}. Run terraform apply first.", file=sys.stderr)
        return EMPTY

    user = outputs.get("admin_username", "hoard")
    key = private_key(outputs.get("ssh_command", ""))
    login = {"ansible_user": user}
    if key:
        login["ansible_ssh_private_key_file"] = key

    # The app VM has no public IP, so SSH hops through the bastion with the same key.
    jump = ["ssh", "-o", "StrictHostKeyChecking=accept-new", "-W", "%h:%p"]
    if key:
        jump += ["-i", key]
    jump.append(f"{user}@{bastion}")

    # A new host's key is trusted on first contact, as on a fresh CD runner. A changed key is still refused.
    trust_new = "-o StrictHostKeyChecking=accept-new"

    return {
        "bastion": {"hosts": [bastion], "vars": {"ansible_ssh_common_args": trust_new}},
        "hoard": {
            "hosts": [app],
            "vars": {
                "ansible_ssh_common_args": f"{trust_new} -o ProxyCommand={shlex.quote(shlex.join(jump))}",
                "app_url": outputs.get("app_url"),
                "acr_name": outputs.get("acr_name"),
                "acr_login_server": outputs.get("acr_login_server"),
                "db_host": outputs.get("database_host"),
                "db_name": outputs.get("database_name"),
                "db_user": outputs.get("database_username"),
                "db_password": outputs.get("database_password"),
            },
        },
        "_meta": {"hostvars": {bastion: dict(login), app: dict(login)}},
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

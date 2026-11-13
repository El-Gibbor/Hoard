#!/bin/sh
# Write ansible/inventory/hosts.ini from this checkout's Terraform outputs.
set -eu

root=$(CDPATH= cd -- "$(dirname "$0")/.." && pwd)
dest_dir="$root/ansible/inventory"
dest="$dest_dir/hosts.ini"

ip=$(terraform -chdir="$root/terraform" output -raw public_ip)
user=$(terraform -chdir="$root/terraform" output -raw admin_username)

mkdir -p "$dest_dir"
cat > "$dest" <<EOF
[hoard]
${ip} ansible_user=${user} ansible_ssh_private_key_file=~/.ssh/hoard
EOF

echo "Wrote $dest"

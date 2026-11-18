#!/usr/bin/env bash
# Creates the storage account that holds the Terraform state, then writes backend.hcl.
# Usage: ./bootstrap.sh <prefix> <location>
set -euo pipefail

if [ $# -ne 2 ]; then
  echo "Usage: $0 <prefix> <location>" >&2
  exit 1
fi

prefix="$1"
location="$2"
group="${prefix}-tfstate-rg"
container="tfstate"
# Storage account names are 3-24 lowercase letters and digits, unique across Azure.
account="$(echo "${prefix//-/}tfstate" | cut -c1-18)$(openssl rand -hex 3)"

if existing="$(az storage account list -g "$group" --query '[0].name' -o tsv 2>/dev/null)" && [ -n "$existing" ]; then
  account="$existing"
  echo "Using the existing storage account $account"
else
  az group create -n "$group" -l "$location" --tags project=hoard owner="$prefix" managed_by=bootstrap -o none
  az storage account create -n "$account" -g "$group" -l "$location" \
    --sku Standard_LRS --kind StorageV2 \
    --min-tls-version TLS1_2 --https-only true \
    --allow-blob-public-access false --allow-shared-key-access false \
    -o none
  az storage account blob-service-properties update --account-name "$account" -g "$group" \
    --enable-versioning true --enable-delete-retention true --delete-retention-days 7 -o none
fi

# Shared keys are off, so the signed-in user needs a data role to read and write the state.
scope="$(az storage account show -n "$account" -g "$group" --query id -o tsv)"
me="$(az ad signed-in-user show --query id -o tsv)"
az role assignment create --assignee-object-id "$me" --assignee-principal-type User \
  --role "Storage Blob Data Contributor" --scope "$scope" -o none

az storage container create -n "$container" --account-name "$account" --auth-mode login -o none

cat > backend.hcl <<EOF
resource_group_name  = "$group"
storage_account_name = "$account"
container_name       = "$container"
key                  = "hoard.tfstate"
use_azuread_auth     = true
EOF

echo "Wrote backend.hcl. Next: terraform init -backend-config=backend.hcl"

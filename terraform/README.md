# Hoard on Azure

This folder builds one virtual machine for Hoard. The network and firewall are already defined. This adds the machine, a static public IP, and outputs Ansible can read without copying values by hand.

Each teammate applies this in their own Azure subscription. Use your own `prefix` so the resource names do not clash.

## Prerequisites

- [Terraform](https://developer.hashicorp.com/terraform/install) 1.6 or newer
- [Azure CLI](https://learn.microsoft.com/cli/azure/install-azure-cli)
- An Azure subscription you are allowed to create resources in
- An SSH key pair. Password login on the VM is disabled.

Create the key if you do not already have one:

```bash
ssh-keygen -t ed25519 -f ~/.ssh/hoard -N ""
```

That writes `~/.ssh/hoard` (the private key) and `~/.ssh/hoard.pub` (the public key). Terraform reads the public key. The `ssh_command` output uses the private key.

## Sign in to Azure

```bash
az login
az account show --query id -o tsv
```

Copy the id from the second command. If you have more than one subscription, pick the one you want with `az account set --subscription <id>` before you apply.

## Configure

From this directory, copy the example and edit it:

```bash
cd terraform
cp terraform.tfvars.example terraform.tfvars
```

On Windows PowerShell, use `copy terraform.tfvars.example terraform.tfvars` instead of `cp`.

Set these in `terraform.tfvars`:

| Name | What to put |
| --- | --- |
| `subscription_id` | The id from `az account show` |
| `prefix` | A short name unique to you, such as `hoard-chioma`. Lowercase letters, digits and hyphens, 4–20 characters. |
| `location` | An Azure region your subscription allows, such as `southafricanorth` |
| `admin_ip` | Your current public IP with `/32`, such as `203.0.113.10/32`. SSH is accepted only from this address. |
| `ssh_public_key_path` | Path to the public key. The default `~/.ssh/hoard.pub` matches the command above. |

Find your public IP with `curl -4 ifconfig.me` (or open [https://ifconfig.me](https://ifconfig.me)). `terraform.tfvars` is gitignored. Do not commit it.

## Init, plan, apply

Still in `terraform/`:

```bash
terraform init
terraform plan
terraform apply
```

`init` downloads the Azure provider. `plan` shows what will be created. `apply` asks you to type `yes`, then creates the resource group, network, firewall, public IP and VM. The first apply takes a few minutes.

## Read the outputs

```bash
terraform output
```

| Output | Use |
| --- | --- |
| `public_ip` | Static address of the VM |
| `vm_id` | Azure resource ID of the VM |
| `resource_group_name` | Group that holds this deployment |
| `admin_username` | User to log in as |
| `ssh_command` | Full command that opens a shell |

To print one value:

```bash
terraform output -raw ssh_command
```

Run that command in a terminal. The first connection asks you to trust the host key. If SSH times out, your public IP has changed: update `admin_ip` in `terraform.tfvars` and apply again.

## Destroy

When you are finished, delete everything this configuration created:

```bash
terraform destroy
```

Type `yes`. This removes the VM, the network and the resource group. It does not delete your SSH key or `terraform.tfvars`.

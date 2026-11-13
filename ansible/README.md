# Harden the Hoard server

This playbook logs into the virtual machine from `terraform/` and locks it down. It updates packages, allows only SSH, HTTP and HTTPS through the firewall, turns off root and password login, and installs fail2ban plus automatic security upgrades.

It does not install Docker or start Hoard. That is a separate play.

## Prerequisites

- Terraform has been applied in `terraform/`, so `public_ip` and `admin_username` exist
- The SSH private key `~/.ssh/hoard` (the pair created for Terraform)
- Ansible, including the `community.general` collection, which the Ubuntu `ansible` package provides

```bash
sudo apt install ansible
```

## Build the inventory

From the repository root:

```bash
sh ansible/inventory.sh
```

The script reads `terraform output` and writes `ansible/inventory/hosts.ini`. That file is not committed. `ansible/inventory/hosts.ini.example` shows the same shape with a placeholder address.

## Run the playbook

From the `ansible` directory:

```bash
cd ansible
ansible-playbook playbook.yml
```

Run it a second time. When the server is already in the desired state, the recap shows `changed=0`.

## Check the result

On the virtual machine:

```bash
sudo ufw status
sudo sshd -T | grep -E 'permitrootlogin|passwordauthentication'
systemctl is-active fail2ban
```

`ufw status` lists 22, 80 and 443. `permitrootlogin` and `passwordauthentication` are `no`. fail2ban is `active`.

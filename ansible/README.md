# Set up the Hoard server

This playbook logs into the virtual machine from `terraform/`, locks it down, installs Docker, and starts Hoard.

The `common` role updates packages, allows only SSH, HTTP and HTTPS through the firewall, turns off root and password login, and installs fail2ban plus automatic security upgrades.

The `docker` role installs Docker Engine and the Compose plugin from Docker's apt repository, and adds the admin user to the `docker` group.

The `app` role writes a production Compose file, applies database migrations and seeds the categories and admin account with the `hoard-migrate` image, then starts Hoard. The API and the web app are pulled from `ghcr.io/el-gibbor/hoard-api` and `ghcr.io/el-gibbor/hoard-web`. The tag defaults to `main`, which the Publish workflow pushes on every merge. Postgres stays on the Docker network. The browser uses port 80.

## Prerequisites

- Terraform has been applied in `terraform/`, so `public_ip` and `admin_username` exist
- The SSH private key `~/.ssh/hoard` (the pair created for Terraform)
- Ansible, including the `community.general` collection, which the Ubuntu `ansible` package provides

```bash
sudo apt install ansible
```

## Secrets

Copy the example and replace the database password, the JWT secret and the admin password. The password should be letters and digits, because it is placed inside a Postgres URL. The JWT secret must be at least 32 characters.

```bash
cp group_vars/hoard/vault.yml.example group_vars/hoard/vault.yml
ansible-vault encrypt group_vars/hoard/vault.yml
```

`vault.yml` is not committed. If the container packages are private, set `ghcr_token` in that file to a GitHub token with `read:packages` before encrypting it.

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
ansible-playbook playbook.yml --ask-vault-pass
```

Run it a second time. When the server is already in the desired state, the recap shows `changed=0`.

## Check the result

On the virtual machine:

```bash
sudo ufw status
sudo sshd -T | grep -E 'permitrootlogin|passwordauthentication'
systemctl is-active fail2ban
docker compose -f /opt/hoard/docker-compose.prod.yml ps
```

`ufw status` lists 22, 80 and 443. `permitrootlogin` and `passwordauthentication` are `no`. fail2ban is `active`. The Compose listing shows `db`, `api` and `web` running. Open `http://<public_ip>` in a browser.

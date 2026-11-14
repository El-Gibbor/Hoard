# Set up the Hoard server

This playbook logs into the virtual machine from `terraform/`, locks it down, installs Docker, and starts Hoard.

The `common` role updates packages, allows only SSH, HTTP and HTTPS through the firewall, turns off root and password login, and installs fail2ban plus automatic security upgrades.

The `docker` role installs Docker Engine and the Compose plugin from Docker's apt repository, and adds the admin user to the `docker` group.

The `app` role writes a production Compose file, applies database migrations and seeds the categories and admin account with the `hoard-migrate` image, then starts Hoard. The API and the web app are pulled from `ghcr.io/el-gibbor/hoard-api` and `ghcr.io/el-gibbor/hoard-web`. The tag defaults to `main`, which the Publish workflow pushes on every merge. Postgres stays on the Docker network. The browser uses port 80.

The deploy steps run in a `block` with a `rescue`. If migrating, starting or the health check fails, the play prints `docker compose ps` and the last 40 log lines of every container, then stops with the failing step's name. A failed image pull also says to make the packages public or set `ghcr_token`.

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

## Inventory

The inventory is dynamic. `ansible.cfg` points at `inventory/terraform.py`, which Ansible runs every time. It reads `terraform output -json` from `../terraform` and returns the VM in the `hoard` group, with `admin_username` as the SSH user and the private key from `ssh_command`. There is no file to generate or keep in sync: after `terraform apply` the playbook finds the new VM, and after `terraform destroy` the inventory is empty.

Check what Ansible sees:

```bash
cd ansible
ansible-inventory --graph --ask-vault-pass
```

Set `HOARD_TERRAFORM_DIR` to read the outputs of a different Terraform directory.

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
sudo sshd -T | grep -E 'permitrootlogin|passwordauthentication|maxauthtries|x11forwarding'
systemctl is-active fail2ban
sudo docker compose --env-file /opt/hoard/hoard.env -f /opt/hoard/docker-compose.prod.yml ps
```

`ufw status` lists 22, 80 and 443. `permitrootlogin`, `passwordauthentication` and `x11forwarding` are `no`, and `maxauthtries` is `3`. fail2ban is `active`. The Compose listing shows `db`, `api` and `web` running. Open `http://<public_ip>` in a browser.

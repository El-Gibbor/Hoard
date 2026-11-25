# Security

## Reporting a vulnerability

Please do not open a public issue for a security problem. Use **Security → Report a vulnerability** on this repository to send a private report to the maintainers. Include the affected file or endpoint, steps to reproduce, and the impact you expect. We aim to reply within 3 working days.

## Scans in CI

Every pull request to `main` and every push to another branch runs these scans in [CI](.github/workflows/ci.yml). Each one is a required status check, so a failing scan blocks the merge. On a merge to `main`, [CD](.github/workflows/cd.yml) runs the same CI workflow again, then scans each image it builds with Trivy before pushing it to the Azure Container Registry, so nothing unscanned is deployed.

| Job | Tool | Scope | Fails when |
| --- | --- | --- | --- |
| **Dependency audit (backend)** / **(frontend)** | `npm audit` | `backend/` and `frontend/` package locks | A production dependency has a **moderate** or worse advisory, or any dependency (including dev tooling) has a **high** or worse one that is not accepted in [`.npm-audit-allowlist.json`](.npm-audit-allowlist.json). An accepted advisory fails again once its review date passes |
| **Terraform checks** | `terraform fmt`, `terraform validate`, Checkov 3.4.5 | `terraform/` | Code is unformatted or invalid, or any Checkov check fails without an inline skip and reason |
| **Ansible lint** | ansible-lint 26.11.0, `production` profile | `ansible/` | Any rule violation |
| **Docker images (api)** / **(migrate)** / **(web)** | Trivy 0.62.1 | The built `hoard-api`, `hoard-migrate` and `hoard-web` images, OS and Node packages | A **critical** or **high** vulnerability that has a fix. The image is scanned before it is published, so a failing image never reaches the registry |

Production code gets the stricter audit threshold because it is what runs on the server. Dev tooling only runs on developer machines and in CI.

Each scan uploads its report as a workflow artifact: `npm-audit-backend`, `npm-audit-frontend`, `checkov-report` (SARIF) and `trivy-api` / `trivy-web` (SARIF, all severities).

## Findings

| # | Source | Finding | Severity | Decision |
| --- | --- | --- | --- | --- |
| 1 | npm audit | [GHSA-g3hv-75wg-m249](https://github.com/advisories/GHSA-g3hv-75wg-m249): `minimatch` denial of service, pulled in by ESLint 10 and `typescript-eslint` (reported as 10 entries per app) | Moderate | **Accepted.** Dev dependency only; not in either image. The only fix offered is downgrading to ESLint 9. Below the high threshold for dev dependencies. Revisit when ESLint ships a fixed `minimatch`. |
| 2 | npm audit | Production dependencies in both apps | None | No action needed. |
| 3 | Checkov | `CKV_AZURE_160`: port 80 open to the internet on the app subnet NSG (`terraform/modules/network`) | Medium | **Accepted.** Browsers reach Hoard on port 80 through the load balancer. Skipped inline with the reason. Resolved by serving HTTPS only once the app has a domain and certificate. |
| 4 | Checkov | `CKV_AZURE_119`: a network interface with a public IP (`terraform/modules/compute`) | Medium | **Fixed for the app VM, accepted for the bastion.** Since the Summative the app VM has no public IP; browsers come through the load balancer. Only the bastion keeps one, and its NSG accepts SSH from `admin_ip` alone. Skipped inline with the reason. |
| 5 | Checkov | `CKV_AZURE_10`: SSH open to the internet | High | **Prevented.** Caught when testing the scan. Since the module split, NSG rules are generated with `for_each`, which Checkov cannot evaluate, so the guard lives in Terraform: `admin_ip` rejects `0.0.0.0/0`, and the network module rejects any rule that opens port 22 to `*`. Either fails `terraform validate` in the **Terraform checks** job. |
| 6 | ansible-lint | `syntax-check[unknown-module]`: `community.general.ufw` could not be resolved | Error | **Fixed.** Added `ansible/requirements.yml`; CI installs it before linting. |
| 7 | ansible-lint | `var-naming[no-role-prefix]`: `hoard_up` and `hoard_migrate` registered inside the `app` role | Warning | **Fixed.** Renamed to `app_up` and `app_migrate`. |
| 8 | Trivy | `hoard-api`: 10 high advisories (`brace-expansion`, `pacote`, `sigstore`, `picomatch`, `ip-address`), all inside the npm bundled with the Node base image | High | **Fixed.** The API runs with `node` alone, so the runtime stage deletes npm, npx and corepack. |
| 9 | Trivy | `hoard-api`: CVE-2026-109518 in Debian `apt` / `libapt-pkg6.0` | High | **Fixed.** Base image bumped from `node:22.23.4` to `node:22.23.5` (pinned by digest). |
| 10 | Trivy | `hoard-web`: 18 Alpine findings, including a critical `brotli-libs` CVE-2026-111497 and high ones in `nginx`, `curl`, `libexpat`, `libxslt`, `musl` and `zlib` | Critical | **Fixed.** Base image bumped to `nginx-unprivileged:1.30.6-alpine`, and the runtime stage runs `apk upgrade` so Alpine fixes apply before a new base image is published. Both images now report 0 fixable critical or high vulnerabilities. |
| 11 | Code review | [#57](https://github.com/El-Gibbor/Hoard/issues/57): a token keeps working after its user is deleted or demoted until it expires | Medium | **Open.** Tracked in #57; `requireAuth` should load the user and role from the database. |
| 12 | npm audit | [GHSA-fc5q-39xc-vjpf](https://github.com/advisories/GHSA-fc5q-39xc-vjpf): `picomatch` ReDoS through repeated extglobs, pulled in by `vitest` and `vite` in both apps | High | **Accepted until 2026-12-31.** No patched release exists (4.0.7 is the latest and is affected), and `npm audit fix --force` would only downgrade vitest. Dev tooling only; not in either image, and the production audit passes. Listed in `.npm-audit-allowlist.json` with the reason and review date, so the audit fails again if it is still unfixed on that date or if any other high advisory appears. |
| 13 | Checkov | `CKV2_AZURE_57`: PostgreSQL Flexible Server without a private endpoint (`terraform/modules/database`) | Medium | **Accepted.** The server uses VNet integration instead: it sits in a delegated subnet with public access off, so it has no public address. Its NSG accepts 5432 from the app subnet only. Skipped inline with the reason. |
| 14 | Checkov | `CKV_AZURE_136`: no geo-redundant database backup | Low | **Accepted.** Doubles the backup cost and needs a paired region the student subscription may not allow. Local backups are kept for 7 days. |
| 15 | Checkov | Eight ACR checks: seven that need the Premium tier (about $50 a month), for a private endpoint (`CKV_AZURE_139`), content trust, geo-replication, quarantine, retention, zone redundancy and dedicated data endpoints (`CKV_AZURE_164`–`167`, `233`, `237`), plus Defender scanning (`CKV_AZURE_163`) | Medium | **Accepted.** Basic tier, with the admin user and anonymous pull off, so only Entra ID tokens can push or pull. Trivy scans every image in CI and CD before it is pushed, which covers the scanning and quarantine checks. |
| 16 | Trivy (CD) | `hoard-migrate`: 10 high advisories (`brace-expansion`, `pacote`, `sigstore`, `picomatch`, `ip-address`) in the npm bundled with the Node base image, the same set as finding 8 | High | **Fixed.** Caught by CD's scan on the first deploy, which stopped the image before it reached ACR. CI had only scanned `api` and `web`, so it now builds and scans `migrate` too. The migrate stage deletes npm, npx and corepack like the runtime stage, and runs `prisma` and `tsx` from `node_modules/.bin`. |
| 17 | Code review (#105) | The database password is an inventory variable for the `hoard` group, so `ansible-inventory --list` prints it in plain text | Low | **Accepted.** The inventory reads it from the Terraform state, so anyone who can run the inventory can already read it with `terraform output -raw database_password`, and only people with access to the state storage can do either. CD never prints the inventory, and the tasks that use the password run with `no_log`. Fix if the system stays in use: keep the password in Azure Key Vault and let the VM read it with a managed identity. |
| 18 | npm audit | [GHSA-7589-6fvf-x4pw](https://github.com/advisories/GHSA-7589-6fvf-x4pw): `effect` ReDoS in `Schema.TemplateLiteral`, pulled in by `prisma` through `@prisma/config`, which pins `effect@3.20.0` | High | **Fixed.** Published after the Summative merge and turned the backend audit red on main. `npm audit fix --force` would downgrade Prisma to 6, so `backend/package.json` overrides `effect` to `^3.22.5`, a patched release with the same major version. Prisma generates, validates and passes the backend tests with it. |

## Controls in place

- **Network:**
  - the app VM sits in a private subnet with no public IP. Browsers reach it only through the Standard Load Balancer on port 80;
  - SSH reaches the app VM only from the bastion subnet, and the bastion only from `admin_ip`. CD adds a rule for its runner's address for the length of a deploy and removes it afterwards, even when the deploy fails;
  - the database subnet accepts 5432 from the app subnet only, and every subnet denies other traffic from inside the VNet;
  - UFW on each VM enforces the open ports again (22 and 80 on the app VM, 22 on the bastion).
- **SSH:** key-only login, no root login, keyboard-interactive auth off, at most 3 attempts per connection, X11 forwarding off, and fail2ban bans repeated failures.
- **Patching:** unattended security upgrades are on.
- **Identity:**
  - GitHub Actions signs in to Azure with OIDC. There is no client secret to leak or rotate;
  - the federated credential only trusts the `production` environment, and that environment only accepts protected branches, so only `main` can deploy;
  - the CD identity has Reader on the resource group, AcrPush on the registry, Network Contributor on the bastion NSG only, and Storage Blob Data Reader on the Terraform state. It cannot change other infrastructure.
- **Secrets:**
  - none are committed: `*.tfvars`, `backend.hcl`, `.env*`, Terraform state and `ansible/group_vars/hoard/vault.yml` are ignored;
  - the database password is generated by Terraform and lives only in the remote state, which allows Entra ID access only (shared keys off, TLS 1.2, versioning on);
  - the registry has no admin password. The VM logs in with a short-lived token from `az acr login --expose-token`;
  - app secrets live in an Ansible Vault file locally and in `production` environment secrets for CD. Tasks that write or use them run with `no_log`.
- **Database:** connections use TLS (`sslmode=require`), and public network access is off.
- **Containers:**
  - pinned base images, run as a non-root user;
  - every image is scanned with Trivy before it reaches a registry.
- **Branch protection:** every scan above must pass, with one approving review, before anything merges to `main`.

# Security

## Reporting a vulnerability

Please do not open a public issue for a security problem. Use **Security → Report a vulnerability** on this repository to send a private report to the maintainers. Include the affected file or endpoint, steps to reproduce, and the impact you expect. We aim to reply within 3 working days.

## Scans in CI

Every pull request to `main` and every push to another branch runs these scans in [CI](.github/workflows/ci.yml). Each one is a required status check, so a failing scan blocks the merge.

| Job | Tool | Scope | Fails when |
| --- | --- | --- | --- |
| **Dependency audit (backend)** / **(frontend)** | `npm audit` | `backend/` and `frontend/` package locks | A production dependency has a **moderate** or worse advisory, or any dependency (including dev tooling) has a **high** or worse one |
| **Terraform checks** | `terraform fmt`, `terraform validate`, Checkov 3.4.5 | `terraform/` | Code is unformatted or invalid, or any Checkov check fails without an inline skip and reason |
| **Ansible lint** | ansible-lint 26.11.0, `production` profile | `ansible/` | Any rule violation |
| **Docker images** | Trivy (in progress, #64) | `hoard-api` and `hoard-web` images | Planned: fixable **critical** or **high** vulnerabilities |

Production code gets the stricter audit threshold because it is what runs on the server. Dev tooling only runs on developer machines and in CI.

Each scan uploads its report as a workflow artifact: `npm-audit-backend`, `npm-audit-frontend` and `checkov-report` (SARIF).

## Findings

| # | Source | Finding | Severity | Decision |
| --- | --- | --- | --- | --- |
| 1 | npm audit | [GHSA-g3hv-75wg-m249](https://github.com/advisories/GHSA-g3hv-75wg-m249): `minimatch` denial of service, pulled in by ESLint 10 and `typescript-eslint` (reported as 10 entries per app) | Moderate | **Accepted.** Dev dependency only; not in either image. The only fix offered is downgrading to ESLint 9. Below the high threshold for dev dependencies. Revisit when ESLint ships a fixed `minimatch`. |
| 2 | npm audit | Production dependencies in both apps | None | No action needed. |
| 3 | Checkov | `CKV_AZURE_160`: port 80 open to the internet on the NSG (`terraform/security.tf`) | Medium | **Accepted.** Browsers reach Hoard on port 80. Skipped inline with the reason. Resolved by serving HTTPS only once the app has a domain and certificate. |
| 4 | Checkov | `CKV_AZURE_119`: the VM's network interface has a public IP (`terraform/compute.tf`) | Medium | **Accepted.** A single VM with no load balancer needs a public IP for browsers and SSH. Mitigated by the controls below. Skipped inline with the reason. |
| 5 | Checkov | `CKV_AZURE_10`: SSH open to the internet | High | **Prevented.** Caught when testing the scan; the NSG only allows port 22 from `var.admin_ip`, and the variable rejects `0.0.0.0/0`. |
| 6 | ansible-lint | `syntax-check[unknown-module]`: `community.general.ufw` could not be resolved | Error | **Fixed.** Added `ansible/requirements.yml`; CI installs it before linting. |
| 7 | ansible-lint | `var-naming[no-role-prefix]`: `hoard_up` and `hoard_migrate` registered inside the `app` role | Warning | **Fixed.** Renamed to `app_up` and `app_migrate`. |
| 8 | Code review | [#57](https://github.com/El-Gibbor/Hoard/issues/57): a token keeps working after its user is deleted or demoted until it expires | Medium | **Open.** Tracked in #57; `requireAuth` should load the user and role from the database. |

## Controls in place

- **Network:** the NSG allows only 22 (from the deployer's IP), 80 and 443. UFW on the VM enforces the same rules again.
- **SSH:** key-only login, no root login, keyboard-interactive auth off, and fail2ban bans repeated failures.
- **Patching:** unattended security upgrades are on.
- **Secrets:**
  - none are committed: `*.tfvars`, `.env*`, Terraform state and `ansible/group_vars/hoard/vault.yml` are ignored;
  - deployment secrets live in an Ansible Vault file;
  - the tasks that write or use them run with `no_log`.
- **Containers:**
  - pinned base images, run as a non-root user;
  - Postgres is only reachable on the internal Docker network.
- **Branch protection:** every scan above must pass, with one approving review, before anything merges to `main`.

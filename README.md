# Hoard

> **Know where your MoMo went.** A spending and budget tracker for young Rwandans who pay mostly with mobile money and cash.

## Problem Statement

University students and young professionals in **Kigali, Rwanda**, handle most of their money through mobile money (MTN MoMo, Airtel Money) and cash. Many budgeting apps work from bank-statement data, but most young Rwandans are not banked. Their spending is spread across small MoMo transfers, merchant payments and cash, with no single place to see it, and they run out of money before the month ends.

The evidence:

- **Mobile money is how Rwandans handle money.** In FinScope 2024, 86% of adults own or have used mobile money and 77% have a registered wallet in their own name, while only about 22% are banked. ([NISR – FinScope 2024](https://microdata.statistics.gov.rw/index.php/catalog/120/overview), [KT Press](https://www.ktpress.rw/2024/06/finscope-2024-shows-progress-in-rwandas-financial-inclusion/))
- **Young people are short of money and borrow informally.** About 66% of Rwandan youth borrowed money in the previous 12 months, but only 16% borrowed from formal institutions. ([Access to Finance Rwanda youth report, via The New Times](https://www.newtimes.co.rw/article/188894/News/88-percent-of-rwandan-youth-are-financially-included-a-new-report/amp))
- **Young users can handle a digital tool but lack financial knowledge.** A survey of 300 Rwandans aged 18–32 found average financial knowledge, moderate digital literacy and gaps in money practices. ([Preprints.org](https://www.preprints.org/manuscript/202601.0737/v1))

Hoard lets users record expenses by payment method in Rwandan francs, set a monthly budget, and see straight away whether they are within, approaching or over it.

## Target Users

| User | Who they are | What they need |
| --- | --- | --- |
| **Students** (primary) | University students in Kigali living on allowances, stipends or part-time income | Stretch a fixed monthly amount and avoid running out before month end |
| **Young professionals** | Early-career workers aged 18–32, often paid into a MoMo wallet | See where money goes across MoMo, cash and bank |
| **Admins** | Platform operators | Manage spending categories and view platform-wide insights |

## Core Features

1. **Expense tracking:** log, edit and delete expenses in RWF with a category, date, payment method (MTN MoMo, Airtel Money, cash, card, bank transfer) and notes. Search, filter and sort them.
2. **Monthly budget:** set a budget per month and see the amount spent, the amount remaining and a *within / approaching / over* status.
3. **Personal dashboard:** monthly total, remaining budget, highest expense, and spending by category and by payment method.
4. **Accounts and admin:** sign up and sign in with user and admin roles. Admins manage categories and view platform insights.

## Technology Stack

| Layer | Technology |
| --- | --- |
| Frontend | React, TypeScript, Vite, React Router, Redux Toolkit |
| Backend | Node.js, TypeScript, Express, Zod, JWT |
| Database | PostgreSQL with Prisma ORM |
| Testing | Vitest, Supertest |
| DevOps | Docker, Docker Compose, GitHub Actions |

## Getting Started

### Prerequisites

- Node.js 20 or newer
- npm 10 or newer
- Docker, for the local Postgres database. Compose publishes it on port 5433 so it does not clash with another Postgres already using 5432.

### Run the API locally

```bash
git clone https://github.com/El-Gibbor/Hoard.git
cd Hoard
docker compose up -d db
cd backend
cp .env.example .env
npm install
npm run db:deploy
npm run db:seed
npm run dev            # http://localhost:4000/api/health
```

`npm run db:seed` loads the default spending categories and one admin account. Set `ADMIN_PASSWORD` in `.env` before seeding. The script can be run again without creating duplicates.

### Accounts

- `POST /api/auth/register` with name, email and password returns `201` and a token.
- `POST /api/auth/login` with email and password returns `200` and a token. A wrong email and a wrong password return the same `401`.
- `GET /api/auth/me` with an `Authorization: Bearer` token returns the signed-in user.
- Sign-out is handled by the client, which discards the token. There is no sign-out endpoint.

Responses never include the password hash. Set `JWT_SECRET` in `.env` before starting the API. It must be at least 32 characters.

### API

Expense and category routes require `Authorization: Bearer <token>`. Amounts are whole Rwandan francs.

- `GET /api/categories` returns every category, sorted by name, with Uncategorized last.
- `POST /api/expenses` records an expense for the signed-in user and returns `201`.
- `GET /api/expenses` lists that user's expenses, newest date first. `?month=YYYY-MM` limits the list to one month.

Example expense:

```json
{
  "title": "Airtime",
  "amount": 1500,
  "categoryId": "category-id",
  "date": "2026-10-15",
  "paymentMethod": "MTN_MOMO",
  "notes": "Weekly bundle"
}
```

### Run the tests

Start Postgres first (`docker compose up -d db` from the repository root). Then, from `backend/`:

```bash
npm test
```

Tests use a separate database, `hoard_test`, and create it if it is missing. They do not write to the `hoard` development database. The suite applies migrations, then checks the health route, the seed, sign-up and sign-in, and expenses.

### Backend Scripts

| Script | Purpose |
| --- | --- |
| `npm run dev` | Start the API with hot reload |
| `npm run build` | Compile TypeScript to `dist/` |
| `npm start` | Run the compiled API |
| `npm run lint` | Lint with ESLint |
| `npm run typecheck` | Type-check without emitting files |
| `npm test` | Run the test suite with Vitest and Supertest |
| `npm run db:migrate` | Create and apply a development migration |
| `npm run db:deploy` | Apply committed migrations |
| `npm run db:seed` | Seed default categories and the admin account |
| `npm run db:generate` | Generate the Prisma client |

### Environment Variables

| Variable | Required | Description |
| --- | --- | --- |
| `NODE_ENV` | No | `development`, `production` or `test`. Defaults to `development`. |
| `PORT` | No | Port the API listens on. Defaults to `4000`. |
| `CLIENT_ORIGIN` | No | Allowed frontend origin(s), comma-separated. Defaults to `http://localhost:5173`. |
| `DATABASE_URL` | Yes | Postgres connection string. The example points at the Compose database. |
| `ADMIN_EMAIL` | For seed | Email of the seeded admin account. |
| `ADMIN_NAME` | For seed | Name of the seeded admin account. |
| `ADMIN_PASSWORD` | For seed | Password of the seeded admin account. Never commit a real password. |
| `JWT_SECRET` | Yes | Secret used to sign login tokens. At least 32 characters. |
| `JWT_EXPIRES_IN` | No | Token lifetime. Defaults to `1d`. |

## Continuous Integration

[GitHub Actions](.github/workflows/ci.yml) runs on every pull request to `main` and every push to `main`. The **Backend checks** job starts Postgres, installs dependencies, applies migrations, then lints, type-checks, tests and builds the API. A pull request cannot merge until this job passes.

## Branch Protection

`main` is protected so every change is reviewed and the branch stays deployable.

| Rule | Why it matters |
| --- | --- |
| Pull request required before merging | No direct pushes; every change is visible and reviewable |
| 1 approving review required | A second person catches bugs and shares knowledge of the code |
| Stale approvals dismissed on new commits | An approval only counts for the code that was actually reviewed |
| Code owner review required | A listed owner from [`CODEOWNERS`](.github/CODEOWNERS) signs off on every change |
| Conversation resolution required | Review comments are addressed before merging, not ignored |
| Linear history required | Squash or rebase merges keep the history readable |
| Rules enforced for administrators | The rules apply to everyone, including repository owners |
| Force pushes and branch deletion blocked | Shared history cannot be rewritten or lost |
| **Backend checks** status check required | The CI job must pass, so code that fails lint, type-check, tests or the build cannot reach `main` |

Branches are **not** required to be up to date with `main` before merging. With four people merging in parallel, that rule would force a re-run on every open pull request each time `main` moves. Each CI run still tests the pull request merged with `main` as it stood when the run started.

### Branch Workflow

1. Branch from an up-to-date `main` using a prefix: `feature/`, `fix/`, `chore/` or `docs/` (e.g. `feature/12-monthly-budget`).
2. Open a pull request into `main` that links its issue (`Closes #12`).
3. Get one approval, resolve all review comments, then squash and merge.

## License

[MIT](LICENSE)

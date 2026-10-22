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

Setup instructions will be added as the frontend and backend are built.

## License

[MIT](LICENSE)

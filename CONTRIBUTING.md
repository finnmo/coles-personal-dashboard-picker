# Contributing

## Development Setup

```bash
# Prerequisites: Node 20+, Docker
git clone <repo>
cd coles-personal-dashboard-picker
npm install
cp .env.example .env
# Fill in .env values (see .env.example comments)
npx tsx scripts/generate-password-hash.ts <your-password>
mkdir -p data
npx prisma migrate dev
npm run dev
```

## Branch Naming

| Type    | Pattern        | Example                        |
| ------- | -------------- | ------------------------------ |
| Feature | `feat/<name>`  | `feat/purchase-tracking`       |
| Bug fix | `fix/<name>`   | `fix/priority-score-edge-case` |
| Chore   | `chore/<name>` | `chore/update-dependencies`    |
| Docs    | `docs/<name>`  | `docs/deployment-guide`        |

## Commit Format

This project uses [Conventional Commits](https://www.conventionalcommits.org/).

```
feat: add Google Tasks integration
fix: correct priority score for new products
chore: update dependencies
docs: add Shortcuts setup guide
test: add priority algorithm edge cases
```

Commitlint enforces this via a git hook. Non-conforming commits are rejected.

## Pull Request Process

1. Branch from `main`: `git checkout -b feat/<name>`
2. Implement the feature fully (all tests, lint, type-check passing)
3. Open a PR to `main` using the PR template
4. All CI checks must pass before merge
5. Self-review is acceptable for this personal project

## Test Requirements

Every PR that touches application code must include:

- Unit tests for pure logic (`tests/unit/`)
- Integration tests for API routes and DB queries (`tests/integration/`)
- E2E coverage for the affected user flow (`tests/e2e/`)

Run the full suite before pushing:

```bash
npm run lint
npm run type-check
npm run test
npm run test:integration
```

## Code Style

- TypeScript strict mode — no `any`, no `@ts-ignore`
- No comments explaining _what_ code does — only _why_ (non-obvious constraints)
- Prettier formats automatically on commit via lint-staged
- Maximum line length: 100 characters

## Feature Branch Order

Branches **must** be implemented in sequence (each depends on the previous):

1. `feat/project-setup` ✓
2. `feat/auth`
3. `feat/dashboard-ui`
4. `feat/admin-panel`
5. `feat/purchase-tracking`
6. `feat/list-integration-reminders`
7. `feat/list-integration-google`
8. `feat/docker-deploy`

Do not start a branch until the previous one is merged to `main`.

## Branch Protection

`main` branch settings:

- Require PR before merging
- Required status checks: `lint`, `type-check`, `unit-test`, `integration-test`, `build`
- No force push
- No direct commits

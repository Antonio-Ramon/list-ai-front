# /create-commit

Analyze the current git diff and create one or more conventional commits, grouping files by domain context. All commit messages must be in English.

## Steps

### 1. Gather changes

Run these in parallel:
- `git status --short` — list all changed/untracked files
- `git diff HEAD` — full diff of staged + unstaged changes

If there are no changes, stop and tell the user there is nothing to commit.

### 2. Group files by context

Map each changed file to a domain group using the path as the key signal:

| Path prefix | Group name |
|---|---|
| `features/auth/` | `auth` |
| `features/broker/` | `broker` |
| `features/strategy/` | `strategy` |
| `features/trading/` | `trading` |
| `features/modedev/` | `modedev` |
| `features/marketplace/` | `marketplace` |
| `features/live-monitor/` | `live-monitor` |
| `features/trial/` | `trial` |
| `features/quota/` | `quota` |
| `features/feedback/` | `feedback` |
| `features/<other>/` | `<other>` |
| `services/` | `services` |
| `ServerActions/` | `server-actions` |
| `app/api/` | `api` |
| `app/` (pages) | `app` |
| `lib/providers/` | `providers` |
| `lib/utils/` | `utils` |
| `lib/hooks/` | `hooks` |
| `components/` | `ui` |
| `styles/` | `styles` |
| `supabase/` | `db` |
| `public/` | `assets` |
| Root config files (`*.config.*`, `*.json`, `*.yaml`, `.env*`, `tsconfig*`) | `config` |
| `docs/`, `*.md` | `docs` |

Files that span multiple unrelated groups stay in their own group. If a group has only one or two files and they logically belong together with another group, merge them.

### 3. Determine commit type per group

For each group pick the conventional commit type that best fits the diff:

- `feat` — new feature or capability
- `fix` — bug fix
- `refactor` — restructuring without behavior change
- `chore` — tooling, dependencies, config, build
- `style` — formatting, CSS, visual-only changes
- `docs` — documentation only
- `perf` — performance improvement
- `test` — adding or fixing tests

### 4. Write the commit message

Format: `type(scope): short description`

Rules:
- **English only** — no Portuguese, no mixed language
- Imperative mood: "add", "fix", "remove", "update" — not "added" or "adds"
- Max 72 characters for the subject line
- No period at the end
- No vague words like "various", "misc", "changes", "updates"
- The description must state **what** changed, not **how**

Good examples:
```
feat(strategy): add deploy context and actions
fix(broker): correct token refresh on session expiry
chore(config): update pnpm-lock for react-is dependency
refactor(services): extract base URL normalization to ServiceApi
docs(db): add migration notes for subscriptions table
```

### 5. Commit each group

For each group, in a logical order (config/db first, then lib, then features, then app):

1. Stage only the files in that group: `git add <file1> <file2> ...`
2. Commit: `git commit -m "type(scope): description"`

Do **not** use `git add .` or `git add -A` — stage explicitly by file path.

After all commits, run `git log --oneline -10` and show the user the final commit list.

### 6. If $ARGUMENTS is provided

Treat the argument as additional context or a hint for the commit message (e.g., the ticket number, a specific description override, or a scope override). Incorporate it where relevant.

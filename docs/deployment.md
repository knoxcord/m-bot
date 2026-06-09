# Deployment

This project uses github actions to generate builds packages as releases that
can be downloaded and deployed.

## Flow

1. **PR to `main`** — `.github/workflows/pr.yml` runs lint, typecheck, build,
   and verifies `package.json` `version` was incremented past `main`.
2. **Merge to `main`** — `.github/workflows/release.yml` builds on a GitHub
   runner and publishes a GitHub Release `v<version>` whose asset is
   `m-bot-v<version>.tgz` (contains `build/`, `package.json`, `yarn.lock`,
   `.yarnrc.yml`).
3. **Deploy** — on server, `scripts/deploy.sh` downloads the latest
   release, installs matching dependencies (incl. native `better-sqlite3`
   bindings), and reloads pm2.

## One-time server setup

Install the prerequisites on the server:

```bash
# GitHub CLI (Debian/Ubuntu) — see https://github.com/cli/cli for current steps
sudo apt update && sudo apt install gh

# Authenticate gh so it can download releases from a private repo
gh auth login

# Enable yarn 4.x (matches package.json "packageManager")
corepack enable
```

Place the deploy script on the server. Easiest is to keep a clone of the repo
and run the script from there, or copy just the script:

```bash
# Option A: keep a clone (also gives gh repo auto-detection)
git clone git@github.com:knoxcord/m-bot.git ~/m-bot

# Option B: copy only the script into your app dir
curl -fsSL -o ~/m-bot/deploy.sh \
  https://raw.githubusercontent.com/knoxcord/m-bot/main/scripts/deploy.sh
chmod +x ~/m-bot/deploy.sh
```

The script assumes the app lives in `~/m-bot` and the pm2 process id is `0`.
Override with env vars if not:

```bash
APP_DIR=/srv/m-bot PM2_APP=m-bot ./deploy.sh
```

## Routine deploy

SSH into the server and run:

```bash
cd ~/m-bot
./scripts/deploy.sh      # or ./deploy.sh if you copied it standalone
```

That downloads the latest release, swaps in `build/`, runs
`yarn install --immutable` (near-instant unless dependencies changed), and
`pm2 reload`s the bot.

### Manual equivalent

If you'd rather not use the script:

```bash
cd ~/m-bot
rm -f m-bot-*.tgz
gh release download --repo knoxcord/m-bot --pattern 'm-bot-*.tgz'
rm -rf build
tar xzf m-bot-*.tgz
yarn install --immutable
pm2 reload 0
rm -f m-bot-*.tgz
```

## Rollback

Deploy any earlier release by passing its tag:

```bash
./scripts/deploy.sh v0.15.0
```

## Notes

- **Native module:** `better-sqlite3` is compiled per-platform. We deliberately
  run `yarn install` on the server so its bindings match the server's Node
  ABI, rather than bundling `node_modules` from the runner.
- **Stale files:** the script `rm -rf build` before extracting, so files
  removed from the source in a later release don't linger.
- **Version bumps:** every merge to `main` must bump `package.json` `version`
  (enforced by the PR workflow), so each release tag is unique.

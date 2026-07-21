# Deploying Lingua to GitHub Pages (free, no credit card)

The repo is preconfigured. On every push to `main`, a GitHub Actions workflow
(`.github/workflows/deploy.yml`) builds a static version of the app and
publishes it to GitHub Pages. Translation runs client-side by calling free
public translation APIs (MyMemory, with Lingva as a fallback) directly from the
browser — no API key, no backend, and no install. This works on any device,
including phones and low-memory laptops.

## One-time setup

### 1. Create a GitHub repository
- Sign in at https://github.com (create a free account if needed).
- Click **New repository**.
- Give it a name, e.g. `lingua`.
- Set it to **Public** (required for Pages on a free account).
- Do **not** add a README, .gitignore, or license — keep it empty.
- Create the repository.

### 2. Turn on Pages
- In the new repo: **Settings → Pages**.
- Under **Build and deployment → Source**, choose **GitHub Actions**.

### 3. Push this code
From this project folder, replace `USER` and `REPO` with yours:

```bash
git remote add origin https://github.com/USER/REPO.git
git push -u origin main
```

The first `git push` opens a GitHub sign-in window in your browser — approve it
once and Windows remembers it.

### 4. Watch it deploy
- Open the repo's **Actions** tab. The "Deploy to GitHub Pages" run should go
  green in ~2 minutes.
- Your site is then live at:  **https://USER.github.io/REPO/**

## Updating the live site later

Any change → commit → push. The site redeploys automatically:

```bash
git add -A
git commit -m "Describe your change"
git push
```

## Notes
- The public URL includes the repo name (`/REPO/`) because it's a project page.
- Translation calls free public APIs from the browser: MyMemory first (stable,
  CORS-enabled, no key), falling back to Lingva if MyMemory is unavailable or
  hits its daily per-network limit. Every request has a 10s timeout, so the UI
  never hangs; if all providers fail, a clear error is shown.
- For higher-quality Claude translation you can instead deploy to a server host
  (Vercel, Cloud Run, …) with an API key — the code still supports that path.

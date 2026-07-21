# Deploying Lingua to GitHub Pages (free, no credit card)

The repo is preconfigured. On every push to `main`, a GitHub Actions workflow
(`.github/workflows/deploy.yml`) builds a static version of the app and
publishes it to GitHub Pages. Translation runs entirely in the visitor's
browser via an on-device model (Transformers.js / NLLB-200) — no API key, no
backend, and no external translation service.

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
- Translation runs on-device: the first translation downloads the NLLB-200
  model into the visitor's browser (a few hundred MB, one time), which is then
  cached and works offline. Subsequent translations are fast, and WebGPU is
  used automatically when available. Nothing is ever sent to a server.
- For higher-quality Claude translation you can instead deploy to a server host
  (Vercel, Cloud Run, …) with an API key — the code still supports that path.

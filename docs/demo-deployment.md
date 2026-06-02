# Demo Deployment and Logistics

How the prototype is hosted and run for viewers. The deployment target is Vercel, connected to a GitHub repository, so that every push to GitHub automatically updates the live demo. Because the prototype has no backend (the data lives in an in-memory store seeded from static files, mutated through the mock service layer), it is a self-contained client application, which makes this setup simple and the demo reproducible. This document covers what is deployed, the GitHub-to-Vercel setup step by step, the branch-to-environment model, the three ways a viewer encounters the demo, the reset-between-viewers behavior, and the practical constraints.

## What is being deployed

A single client-side application: a Next.js app, the in-memory store seeded from the JSON files at load, the mock service worker intercepting the network calls, and the guided tour layered on top. No database, no API server, no secrets. This is the direct consequence of the architecture (`build-spec/mock-and-tech-spine/`): the whole system runs in the browser.

Implications:
- Vercel hosts Next.js natively (Vercel maintains Next.js), so there is no special configuration to make the framework run. Vercel detects it and applies the right build settings automatically.
- It loads the same seed every time, so every viewer sees the same starting state and the same numbers.
- There is nothing to break between viewers except the in-session mutations, which a reset clears.
- No environment variables, database URLs, or secrets are needed, because there is no backend to point at. This keeps the Vercel setup to its simplest form.

## GitHub-to-Vercel setup (first time)

The goal: a GitHub repository holding the prototype code, connected to a Vercel project, so a `git push` triggers an automatic deploy. Done once; after that, deployment is just pushing code.

### Prerequisites

- A GitHub account (the prototype code lives in a repository there).
- The prototype code committed to that repository. Until the build exists, this is empty; the steps below are the workflow you will use once there is code to push.
- A Vercel account. Vercel offers a free Hobby tier that is sufficient for a demo; sign up at vercel.com.

### Step 1: put the code on GitHub

If the code is not yet in a GitHub repo, from the project folder (the prototype root, where `package.json` lives):

```
git init
git add .
git commit -m "Initial prototype"
```

Then create an empty repository on GitHub (github.com, New repository, no README/license so it stays empty), and connect and push:

```
git remote add origin https://github.com/<your-username>/<repo-name>.git
git branch -M main
git push -u origin main
```

After this, the code is on GitHub on the `main` branch.

### Step 2: connect Vercel to GitHub

1. Sign in to vercel.com. On first sign-in, choose "Continue with GitHub" so Vercel is linked to your GitHub account; authorize the Vercel GitHub app when prompted. (You can limit its access to only the one repository if you prefer.)
2. In the Vercel dashboard, click "Add New" then "Project".
3. Vercel lists your GitHub repositories. Find the prototype repo and click "Import". If it is not listed, click "Adjust GitHub App Permissions" and grant access to that repository.

### Step 3: configure and deploy

1. Vercel auto-detects the framework as Next.js and fills in the build command (`next build`) and output settings. Leave these at the detected defaults; nothing needs changing for this prototype.
2. There are no environment variables to set (no backend). Skip that section.
3. Click "Deploy". Vercel builds the project and, when it finishes, gives a live URL (of the form `<project-name>.vercel.app`). That URL is the demo.

### Step 4: confirm auto-deploy on push

The connection is now live. To confirm the auto-update works, make any small change, commit, and push:

```
git add .
git commit -m "Test auto-deploy"
git push
```

Within a minute or two, Vercel detects the push, runs a new build, and updates the live URL automatically. You can watch the build in the Vercel dashboard under the project's "Deployments" tab. After this confirmation, the workflow for every future change is simply: edit, commit, push, and the demo updates itself.

## The branch-to-environment model (how Vercel uses your branches)

Vercel maps Git branches to deployments automatically, which is useful for showing work without breaking the live demo:

- **Production:** a push to the `main` branch updates the production deployment (the stable `<project-name>.vercel.app` URL you share with prospects). Keep `main` always demo-ready.
- **Preview:** a push to any other branch, or any pull request, gets its own temporary preview URL that does not affect production. Use a branch (for example `wip`) to try a change, see it on its preview URL, and only merge to `main` when it is ready. This is how you avoid an experiment reaching a prospect's link.

Practical rule for a demo: do day-to-day work on a branch, watch it on the preview URL, and merge to `main` only when you want the shared demo to change.

## Custom domain (optional)

The default `<project-name>.vercel.app` URL is fine for sharing. If you want a branded link (for example `demo.yourcompany.com`), add it in the Vercel project under Settings, Domains, and follow Vercel's instructions to point the domain's DNS at Vercel. This is optional and changes nothing about how the app runs.

## The three ways a viewer encounters the demo

1. **Self-serve link (unattended).** A prospect receives the Vercel URL and runs it alone. The guided tour in Watch mode carries them: the title screen, the cast, then the eight chapters with coach-marks and Next, ending in the payoff. Watch mode is the default precisely so an unattended viewer cannot get stuck; it always reaches the end. This is the primary case the tour was designed for.
2. **Live call (attended).** You share your screen and drive. You can use the tour, or hop personas freely with the role-switcher and click through the real screens, or flip individual tour steps to Try-it to let the prospect drive a moment (the landed-cost award, the match). The same deploy supports all of this.
3. **Booth/kiosk (unattended, repeated).** At an event, the demo runs repeatedly for strangers. This needs the clean reset between viewers (below) so each person starts fresh, and benefits from an idle-reset (return to the title screen after a period of inactivity). For an event with unreliable wifi, note that the Vercel-hosted app still needs the network to load the first time; once loaded it runs in the browser without further calls.

## Reset between viewers (the determinism guarantee)

The store reset (`build-spec/mock-and-tech-spine/01-data-store.md`) reloads the seed to a byte-identical starting state. For the demo this means:

- **Manual reset:** a "Restart demo" control returns the store to seed and the tour to the title screen. You hit it between meetings; the kiosk attendant hits it between visitors.
- **Idle reset (kiosk):** after a configurable idle period the app auto-resets to the title screen, so the next visitor starts clean without staff intervention.
- **Hard reset:** a full page reload reseeds from scratch (the store is in-memory), so the worst case is always recoverable by refreshing.

Because the seed is pinned (deterministic generation, demo date fixed at 2026-06-01), every reset produces exactly the same data, the same landed-cost figures, the same KPIs. A prospect who runs it twice sees the same story; you can rehearse against a fixed target. This reproducibility is a feature of the no-backend design.

## Performance and footprint

- The seed is modest (tens of files, a few hundred records each), loaded once at startup. After the initial load from Vercel, all interactions are in-memory; there are no further server round-trips, so the app feels instant.
- A small deterministic artificial latency is added to interactions (so loading states are visible and the app feels real); this is in-browser, not network.
- The Vercel free tier comfortably handles a demo's traffic. There is no server load to scale because there is no backend; Vercel is serving a static-plus-client bundle.

## Security and data

- No real data, no PII, no credentials, no secrets. The fictional company (Meridian Consumer Health) and its seeded people are invented. There is nothing to leak, and nothing to configure in Vercel for secrets.
- No backend means no attack surface beyond a static site served by Vercel.
- The role-switcher and fake login are demo devices; they are removed or gated out of any build that is not an internal demo, so a prospect build does not expose the persona-hopping unless intended.

## What a stranger does, start to finish (the unattended path)

1. Opens the Vercel link. The dark title screen explains the story in three sentences. One button: Start.
2. The cast screen introduces the seven people and the company. One button: Let's begin.
3. The tour runs the eight chapters. At each step a coach-mark narrates one to three sentences and the app performs the action; the viewer hits Next. The active persona changes as the story hands off. Specific numbers (the landed-cost flip, the KPIs) appear on screen as narrated.
4. The payoff dashboard closes the loop. A closing card offers Restart or Explore on your own.
5. If they choose Explore, they get the live app with the role-switcher, to click anything. If they walk away, the idle reset returns it to the title for the next person.

No instructions, no account, no setup. The prospect experiences the platform without anyone having to walk them through it, and the experience is the same every time.

## Day-to-day workflow after setup

Once the GitHub-to-Vercel connection exists, deployment is no longer a separate task:

- **Update the demo:** make the code change, `git commit`, `git push` to `main`. Vercel rebuilds and updates the live URL automatically within a minute or two.
- **Try something without risk:** push to a branch (not `main`), open its preview URL, review, then merge to `main` when ready.
- **Roll back:** in the Vercel dashboard, under Deployments, find a previous good deployment and promote it to production. Because each deploy is immutable, rolling back is instant and safe.
- **No migrations, no data state to manage:** the seed is the data and it travels with the build, so there is never a database to migrate or back up.

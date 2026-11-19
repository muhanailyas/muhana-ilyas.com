# Putting muhana-ilyas.com online

This guide assumes no programming. You will click through four websites: GitHub (stores the site), Cloudflare (hosts it and runs the admin login), GitHub again (login app), and your domain registrar. Budget about 45 minutes the first time.

Everything here is free except the domain name itself.

There are two routes:

| | Route A (recommended) | Route B |
|---|---|---|
| Where the site lives | Cloudflare Pages (free) | Your Hostinger hosting plan |
| Domain | Bought anywhere (Hostinger is fine), pointed to Cloudflare | Hostinger |
| Rebuild after saving in admin | Automatic, about 1 minute | Automatic via GitHub Actions, about 2 minutes |
| Admin login | Cloudflare Worker (free) | Same Cloudflare Worker (free) |

Do Steps 1 to 4 for both routes. Then do **5A** or **5B**.

---

## Step 1. Accounts you need

1. **GitHub**: sign up at <https://github.com/signup>. You already have `muhanailyas`, so just sign in.
2. **Cloudflare**: sign up at <https://dash.cloudflare.com/sign-up>. The free plan is enough.
3. **GitHub Desktop** (a normal app, no command line): download from <https://desktop.github.com> and sign in with your GitHub account.

## Step 2. Put the site files on GitHub

1. On github.com click **+** (top right) > **New repository**.
   - Repository name: `muhana-ilyas.com`
   - Visibility: **Public** or **Private** (both work; Private hides your drafts).
   - Do **not** tick "Add a README". Click **Create repository**.
2. On the next page click **Set up in Desktop**. GitHub Desktop opens and asks where to save the (empty) repository. Choose a folder such as `Documents/GitHub` and click **Clone**.
3. Unzip `muhana-ilyas-site.zip`. Copy **everything inside** the unzipped folder (including the hidden `.github` folder, `.gitignore` and `.node-version`) into the repository folder that GitHub Desktop just created.
   - Windows: in File Explorer choose View > Show > Hidden items first.
   - macOS: in Finder press Cmd + Shift + . (full stop) to show hidden files.
4. Back in GitHub Desktop you will see a long list of changed files. Type `First version of the site` in the Summary box (bottom left), click **Commit to main**, then **Push origin** (top bar).
5. Refresh your repository page on github.com: you should see folders named `content`, `public`, `src` and so on.

## Step 3. Set up the admin login helper (Cloudflare Worker)

The admin panel signs you in with GitHub. GitHub requires a tiny piece of server code to finish that sign-in safely; Cloudflare runs it for free. This is the only "server" in the whole setup and you never need to touch it again.

1. Open <https://github.com/sveltia/sveltia-cms-auth> and click the **Deploy to Cloudflare Workers** button in its README. Sign in to Cloudflare when asked and follow the prompts to deploy.
2. When it finishes, open the Cloudflare dashboard > **Workers & Pages** > **sveltia-cms-auth**. Copy the address shown, which looks like `https://sveltia-cms-auth.yourname.workers.dev`. This is your **Worker URL**.
3. Create the GitHub login app: go to <https://github.com/settings/applications/new> and fill in:
   - Application name: `muhana-ilyas.com admin`
   - Homepage URL: `https://muhana-ilyas.com`
   - Authorization callback URL: your Worker URL followed by `/callback`, for example `https://sveltia-cms-auth.yourname.workers.dev/callback`
   - Click **Register application**. On the next page copy the **Client ID**, then click **Generate a new client secret** and copy the secret (it is only shown once).
4. Back in Cloudflare > **sveltia-cms-auth** > **Settings** > **Variables and Secrets**, add:
   - `GITHUB_CLIENT_ID` = the Client ID
   - `GITHUB_CLIENT_SECRET` = the client secret (choose type **Secret** so it is hidden)
   - `ALLOWED_DOMAINS` = `muhana-ilyas.com, www.muhana-ilyas.com, muhana-ilyas-com.pages.dev`
     (if Cloudflare gives your Pages site a different `.pages.dev` address in Step 5A, put that exact address here instead)
   - Click **Deploy** (or **Save**).

## Step 4. Tell the admin panel where things are

1. On github.com open your repository, then `public` > `admin` > `config.yml`, and click the pencil icon (Edit).
2. Change two lines near the top:
   ```yaml
   repo: muhanailyas/muhana-ilyas.com
   base_url: https://sveltia-cms-auth.yourname.workers.dev
   ```
   (`repo` is your GitHub username, a slash, and the repository name. `base_url` is your Worker URL **without** `/callback`.)
3. Click **Commit changes**.

---

## Step 5A. Host on Cloudflare Pages (recommended)

### Connect the repository
1. Cloudflare dashboard > **Workers & Pages** > **Create** > **Pages** tab > **Connect to Git**.
2. Choose GitHub, authorise Cloudflare, and select `muhana-ilyas.com`.
3. Build settings:
   - Framework preset: **Astro**
   - Build command: `npm run build`
   - Build output directory: `dist`
   - Environment variable: `NODE_VERSION` = `22`
4. Click **Save and Deploy**. After 1 to 2 minutes your site is live at an address like `muhana-ilyas-com.pages.dev`. Open it and check it looks right.
5. Open `https://muhana-ilyas-com.pages.dev/admin/` and click **Sign in with GitHub**. If you can see your publications list, the admin panel works.

### Connect your domain (muhana-ilyas.com)
As of 19 November 2026, `muhana-ilyas.com` was not registered, so you need to buy it first. Two ways:

**Option 1, simplest: buy it at Cloudflare.** Dashboard > **Domain Registration** > **Register Domains** > search `muhana-ilyas.com` > buy. Cloudflare sells domains at cost and the DNS is set up for you. Then go to step "Attach the domain" below.

**Option 2: buy it at Hostinger** (useful if you want to keep billing there).
1. Buy the domain in Hostinger hPanel.
2. In Cloudflare dashboard click **Add a domain** (or **Add a site**), type `muhana-ilyas.com`, pick the **Free** plan. Cloudflare shows two nameservers, such as `ada.ns.cloudflare.com` and `bob.ns.cloudflare.com`.
3. In Hostinger hPanel > **Domains** > `muhana-ilyas.com` > **DNS / Nameservers** > **Change nameservers** > choose "Use custom nameservers" and paste the two Cloudflare nameservers. Save.
4. Wait until Cloudflare emails you that the domain is active (usually under an hour, at most 24 hours).

**Attach the domain**
1. Cloudflare > **Workers & Pages** > your Pages project > **Custom domains** > **Set up a custom domain** > type `muhana-ilyas.com` > continue and confirm. Repeat for `www.muhana-ilyas.com`.
2. HTTPS certificates are created automatically within a few minutes.
3. From now on, use `https://muhana-ilyas.com/admin/` to edit the site.

## Step 5B. Host on Hostinger instead (files uploaded by GitHub Actions)

Use this only if you want the files to live on your Hostinger hosting plan. The admin panel still works because the login helper from Step 3 runs on Cloudflare independently.

1. In Hostinger hPanel > **Files** > **FTP Accounts**, note the **FTP host/IP**, **username** and set a **password**.
2. On github.com open your repository > **Settings** > **Secrets and variables** > **Actions** > **New repository secret**, and add three secrets:
   - `FTP_SERVER` = the FTP host (for example `ftp.muhana-ilyas.com` or the IP address)
   - `FTP_USERNAME` = the FTP username
   - `FTP_PASSWORD` = the FTP password
3. Open the **Actions** tab of your repository and enable workflows if GitHub asks.
4. Make any change in the admin panel (or run **Actions > Deploy to Hostinger > Run workflow**). GitHub builds the site and uploads it into `public_html`. The first upload takes a few minutes; later ones only send changed files.
5. In hPanel make sure the domain `muhana-ilyas.com` points to this hosting plan (it does by default when bought at Hostinger), and enable the free SSL certificate under **Security** > **SSL**.

On Route A this workflow does nothing (it skips itself while the FTP secrets are absent), so you can leave it or delete `.github/workflows/deploy-hostinger.yml`.

---

## After setup

- **Edit content** at `https://muhana-ilyas.com/admin/`. Each Save is committed to GitHub and the live site updates in 1 to 2 minutes.
- **Google Scholar and Google Search**: submit `https://muhana-ilyas.com/sitemap-index.xml` in Google Search Console (<https://search.google.com/search-console>) so pages are indexed quickly.
- **Your profiles**: add `https://muhana-ilyas.com` as the homepage on Google Scholar, ORCID, ResearchGate, GitHub and LinkedIn.

## If something goes wrong

| Problem | Fix |
|---|---|
| Pages build fails with a Node.js version message | Check the `NODE_VERSION` = `22` variable in the Pages project settings, then **Retry deployment**. |
| Build fails after an admin edit | Open the failed deployment log in Cloudflare; the last red lines name the file. Usually a required field was left empty. Fix it in the admin panel and save again. |
| "Sign in with GitHub" opens a page that says the domain is not allowed | Add the exact domain you are using to `ALLOWED_DOMAINS` in the Worker (Step 3.4). |
| The sign-in pop-up closes and nothing happens | `base_url` in `config.yml` is wrong or ends with `/callback`. It must be the plain Worker URL. |
| The callback page shows "redirect_uri mismatch" | The GitHub OAuth app's callback URL must be exactly Worker URL + `/callback`. |

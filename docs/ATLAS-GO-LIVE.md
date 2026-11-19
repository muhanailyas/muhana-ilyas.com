# Switching the Atlas page from "coming soon" to live

The Atlas page (`/atlas/`) is controlled by one entry in the admin panel: **Settings > Atlas page (APONO)**. No code changes are needed.

## Now: coming soon
With **Status = Coming soon** the page shows the short name, title, tagline, a short teal line, the message "The atlas will be shown soon." and, if an email is filled in, a link that opens an email titled "Notify me when APONO launches". Leave **Email for 'notify me' requests** empty to hide that link.

## Going live: three options

**A. Embed the interactive atlas inside your site (best).**
1. Deploy the atlas app (for example the NiiVue prototype on Vercel) and copy its address.
2. Settings > Atlas page > set **Status** to **Live**.
3. Paste the address into **Live: atlas app to embed in the page**. Adjust **embed height** if the viewer looks cramped (900 to 1000 px works well for brain viewers).
4. Write a short introduction in **Live: description** (what the atlas shows, how to cite it, which tumour types are included).
5. **Save**. The page now shows the introduction followed by the working atlas.

> The atlas app must allow being shown inside another site. On Vercel this is the default. If you see a blank box, the app is sending an `X-Frame-Options: DENY` or `frame-ancestors` header; allow `https://muhana-ilyas.com` there, or use option B.

**B. Link out to a separate atlas site.** Set **Status** to **Live**, leave the embed field empty and paste the address into **Live: link to the full atlas**. The page shows the description and an **Open the atlas** button.

**C. Static figure.** Set **Status** to **Live**, upload an image in **Live: image** and write the description. Useful for a first public release of the meningioma maps before the interactive tool is ready.

You can combine A and B (embed plus a button to open full screen).

## Also update
- **News**: add a line such as "APONO, the Atlas of Psychological Outcomes in Neuro-Oncology, is now live."
- **Projects > APONO**: change status if appropriate and add a link to `/atlas/`.
- To go back to "coming soon", set **Status** to **Coming soon** and save; your live settings are kept.

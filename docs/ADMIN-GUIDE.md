# How to use your admin panel

Open **https://muhana-ilyas.com/admin/** and click **Sign in with GitHub**. You only sign in once per browser.

**What you will see.** A left sidebar lists the sections: *Settings, News, Publications, Projects, Repositories, Teaching, Blog*. Clicking one shows a list of entries in the middle. Clicking an entry opens the editor: the form fields on the left and, for pages with longer text, a live preview on the right. The blue **Save** button is at the top right of the editor. A **media library** button (a picture icon in the top bar) shows every uploaded image and PDF.

**What Save does.** Each Save is stored in your GitHub repository and the public site updates by itself about one minute later. Nothing is lost: every earlier version stays in GitHub's history.

---

## 1. Add a blog post
1. Sidebar > **Blog** > **New Post** (top right).
2. Fill in **Title** and **Date**, and optionally a one-line **Summary** and **Tags**.
3. Write in the **Post** box. The toolbar works like Word: headings, bold, italic, lists, links, quotes and code blocks.
   - **Image**: drag an image file straight into the text where you want it.
   - **Maths**: type `$E = mc^2$` for inline, or put `$$ ... $$` on its own line for a displayed equation.
4. Tick **Draft** if you are not ready to publish. Drafts are saved but hidden on the site.
5. Click **Save**.

## 2. Add a publication
**Fastest way: paste BibTeX.**
1. Sidebar > **Publications** > **New Publication**.
2. Copy the BibTeX from the journal's "Cite" button or Google Scholar's "Cite > BibTeX", and paste it into the **BibTeX** box.
3. Type or paste the **Title** (needed to name the entry). Leave the other fields empty: authors, journal, year, volume, pages and DOI are read from the BibTeX when the site rebuilds.
4. Optional: paste the abstract, upload a PDF (only if the licence allows), add a code link.
5. Tick **Show on home page** if it should appear under *Selected publications*, and give it a **Position** (1 = top).
6. **Save**.

**Or fill in the form**: enter authors one per row (drag the handle to reorder), journal, year and DOI. Your own name is bolded automatically wherever it appears.

**Automatic import from ORCID.** Once a paper is on your ORCID record, GitHub can add it for you: open your repository on github.com > **Actions** > **Import publications from ORCID** > **Run workflow**. This also runs by itself on the 1st of every month. It never changes entries you have edited.

**Hide or delete a publication.** Open it and tick **Hide from the site** (reversible), or use **Delete** from the editor's menu (the three dots next to Save).

## 3. Replace your CV
1. Sidebar > **Settings** > **CV**.
2. Drag your new PDF onto the **CV (PDF)** field (or click it and choose a file). The old file is replaced in the page.
3. Update **Last updated** and click **Save**.

## 4. Change your profile photo
1. Sidebar > **Settings** > **Site, profile and menu**.
2. In **Profile photo**, click **Replace** (or drag a new image onto the field). Use a square photo of at least 600 x 600 pixels; it is shown as a circle.
3. Update **Photo description** (for example "Portrait of Muhana Fawwazy Ilyas"), then **Save**.

The same page holds your name, affiliation line, biography, research interests, profile links and the top menu. Lists such as **Profile links** and **Top menu** can be reordered by dragging and items removed with the trash icon.

## 5. Delete an image or file
1. Click the **media library** icon in the top bar.
2. Hover over the image or PDF and click the **trash** icon (or select it and press Delete). Confirm.
3. Before deleting, make sure nothing still uses it (for example a project thumbnail); a page that points to a deleted image shows a broken picture.

---

## Other everyday tasks

| Task | Where |
|---|---|
| Add a news line on the home page | **News** > New News item. One line; `*italic*` and `[link text](https://...)` work. |
| Add or reorder projects | **Projects**. Set **Position in list** (1 = first). Upload a landscape thumbnail. |
| Add a GitHub repository | **Repositories** > New. Paste the URL and a short description. |
| Add a talk, course or workshop | **Teaching** > New. Upload slides (PDF) or paste a link. Future dates show under "Upcoming". |
| Change contact details or switch on the contact form | **Settings** > **Contact page** (see below). |
| Show Altmetric or Dimensions badges | **Settings** > **Site** > tick the two badge options. |
| Hide a page from the menu | **Settings** > **Site** > **Top menu** > remove the item. |

## Switch on the contact form (optional, free)
1. Sign up at <https://formspree.io> (free plan: 50 messages per month) and create a form. Formspree shows a form address like `https://formspree.io/f/xwkgabcd`.
2. In the admin panel: **Settings** > **Contact page** > paste `xwkgabcd` into **Formspree form ID**, tick **Show contact form**, **Save**.
3. Messages arrive in your email inbox.

## Use Neue Montreal for the header (optional)
Neue Montreal is a commercial font by Pangram Pangram, so it cannot be bundled with the site. Their free trial files are allowed for personal, non-commercial projects such as a personal portfolio; buy a web licence if the site becomes commercial.

1. Get the files at <https://pangrampangram.com/products/neue-montreal> ("Free to try", sent by email).
2. On github.com open your repository > `public` > `fonts` > **Add file** > **Upload files**, and drag in these four files from the download (keep their names): `PPNeueMontreal-Thin.otf`, `PPNeueMontreal-Book.otf`, `PPNeueMontreal-Medium.otf`, `PPNeueMontreal-Bold.otf`. Click **Commit changes**.
3. In the admin panel: **Settings** > **Site, profile and menu** > **Header font** > choose **Neue Montreal** > **Save**.

The site header and your name on the About page switch to Neue Montreal; everything else keeps the system font. To switch back, choose **System font**.

## Journal badges
Each publication shows a short label in a navy box (for example `EIMJ`, `Lancet Neurol`, `SNI`). Change it in the publication's **Journal badge** field; leave it empty to show no badge.

## Good habits
- Fill in image descriptions: they help visually impaired visitors and Google.
- Keep image files under about 500 KB. Phone photos can be resized at <https://squoosh.app> first.
- If the site does not update after a few minutes, check the latest deployment in Cloudflare (Workers & Pages > your project > Deployments). A red entry shows which file has a problem.

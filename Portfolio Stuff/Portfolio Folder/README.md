# Alan's Portfolio — How to Manage It

Everything lives in **one file: `index.html`**. You only ever edit the marked block at the top.

## Adding a project (30 seconds)

1. Open `index.html` in any editor.
2. Find the banner near the top:

   ```
   ★★★  ADD YOUR PROJECTS HERE  ★★★
   ```

3. Copy an existing `{ ... }` block, paste it at the top of the `PROJECTS` list, and edit:

   ```js
   {
     title: "My New Project",
     desc: "What it does and why it's cool.",
     tags: ["Python", "ML"],          // powers the filter buttons automatically
     github: "https://github.com/you/repo",  // "" hides the button
     demo: "",                        // "" hides the button
     image: "",                       // "" = auto-generated gradient cover
     featured: false                  // true = ★ badge + sorted first
   },
   ```

4. Save → refresh the browser. Done. Filter buttons update themselves from your tags.

## Also editable (same block)

- `SKILLS` — your skill chips, grouped by category
- `PROFILE` — name, tagline, about text, email, GitHub/LinkedIn, resume link

## Resume

Drop `resume.pdf` in the same folder as `index.html` (or set `PROFILE.resume` to a URL).

## Deploying free on GitHub Pages

1. Create a repo named `yourusername.github.io`
2. Put `index.html` (and `resume.pdf`) in it, commit, push
3. Site is live at `https://yourusername.github.io` within a minute

Updating later = edit `index.html`, commit, push.

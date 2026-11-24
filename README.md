# Irish Policy Monitor — Website

A responsive, static website built from the project's structured research files.

## Preview locally
Because the website loads JSON data with `fetch`, run it through a local web server rather than opening `index.html` directly.

```bash
python -m http.server 8000
```

Then visit http://localhost:8000/website/ (if started from the project root), or start the server inside this `website` folder and visit http://localhost:8000.

## Publish for public access
The simplest no-cost route is GitHub Pages:

1. Create a GitHub repository and upload the contents of this `website` folder.
2. In the repository, open **Settings → Pages**.
3. Choose **Deploy from a branch**, select `main` and `/ (root)`, then save.
4. GitHub will provide a public website URL. A custom domain can be connected later.

Netlify and Cloudflare Pages can also publish this static folder.

## Important scope and editorial notes
- This is an initial public-facing research snapshot, not a complete audit of every Government commitment.
- Some party-position summaries and source references still require verification against original publications.
- The commitment tracker uses conservative status definitions; `in_progress` does not mean a target is on track.
- This website is read-only. Public submissions, accounts, comments and automated data updates need a backend and moderation process.
- Review every source and date before promoting the site as a current factual reference.

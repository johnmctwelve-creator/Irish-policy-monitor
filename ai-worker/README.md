# Irish Policy Monitor AI — deployment

This folder contains the secure API for the website's AI assistant. The browser never receives the OpenAI API key.

## 1. Create a Cloudflare Worker

Create a Worker in Cloudflare and deploy \`src/index.js\`. Set the Worker compatibility date to a current supported date.

## 2. Configure secrets and variables

Add these Worker settings:

- Secret \`OPENAI_API_KEY\`: your OpenAI API key.
- Variable \`OPENAI_MODEL\`: \`gpt-4.1-mini\` (or another Responses API model enabled for your account).
- Variable \`ALLOWED_ORIGIN\`: \`https://johnmctwelve-creator.github.io\`.
- Optional variable \`IPM_DATA_BASE\`: raw GitHub data folder URL. Defaults to this repository's main/data folder.

Do not put the API key in website JavaScript, HTML, GitHub Pages files or a public repository.

## 3. Connect the website

After deployment, copy the Worker URL and replace the placeholder in the final script tag in the repository's \`index.html\`:

\`\`\`html
<script src="ipm-ai.js?v=1" data-api-base="https://YOUR-WORKER.workers.dev"></script>
\`\`\`

The site is hosted on GitHub Pages, which is static hosting; the Worker supplies the private server-side API.

## 4. Test

- Open \`https://YOUR-WORKER.workers.dev/health\`; expect \`{"ok":true,"service":"Irish Policy Monitor AI"}\`.
- Open the website and ask a question about housing.
- Confirm the answer includes source links and caveats.

## Current MVP boundaries

- Retrieves from the public JSON research files in the repository; it does not yet index every article or every linked PDF.
- Uses lightweight lexical retrieval, not embeddings. This is intentionally a small first release; replace with PostgreSQL/pgvector or managed retrieval as the corpus grows.
- The source files are cached in the Worker isolate for up to ten minutes.
- Add Cloudflare rate limiting, usage monitoring, abuse protection and a privacy notice before broad public promotion.
- Verify data reuse permissions and editorial status for every ingested source.
- The assistant does not access visitor identity or need an account.

## Local development

Use Cloudflare's Wrangler CLI with a local secret:

\`\`\`bash
npx wrangler dev
\`\`\`

Set \`OPENAI_API_KEY\` as a local secret using Wrangler; do not commit \`.dev.vars\`.

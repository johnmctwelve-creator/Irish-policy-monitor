# Irish Policy Monitor — Website

A responsive, static public-interest guide to Irish Government policy, evidence, Programme for Government commitments and selected party alternatives.

## Published research edition

The website currently includes:
- 11 structured policy assessments, each with a provisional conclusion, left/right perspectives, opposition alternatives, international context, source links and explicit evidence gaps.
- 33 source-linked research indicators.
- 9 selected Programme for Government commitments, with evidence notes and provisional status definitions.
- 9 selected party position records, including Government parties and opposition parties.
- Responsive policy, evidence, party-comparison and commitment-tracker views.

## Run locally

The website loads JSON files with `fetch`, so serve it through a local web server rather than opening `index.html` directly.

```bash
python -m http.server 8000
```

Then visit http://localhost:8000/ if started inside this website folder.

## Publish with GitHub Pages

1. Upload the contents of this folder to the repository root.
2. Open **Settings → Pages**.
3. Choose **Deploy from a branch**, select `main` and `/ (root)`, then save.
4. GitHub Pages publishes the site at the repository's Pages URL.

## Editorial scope and limitations

This is an expanded research edition, not a complete independent audit or a comprehensive comparison of every party manifesto.

- The nine commitment records are a selected subset, not a full extraction of the Programme for Government. Exact quotations, page references, annual trajectories and some baselines still require verification.
- Party positions are selected, not exhaustive. Some entries rely on standing party policy pages or secondary summaries; publication dates, costings and parliamentary records require further checking.
- Evidence coverage is uneven. Immigration processing and accommodation metrics, disability-service waiting times, and defence readiness measures remain priority data gaps.
- Policy conclusions are provisional and limited to the dated indicators and sources shown. A missing indicator is not evidence of no action or policy failure.
- International comparisons are contextual, not rankings; institutional differences limit direct transferability.
- The commitment status `in_progress` means an implementation action or output is evidenced; it does not mean the final target is on track.
- This read-only website has no accounts, public submissions, comments or automated data updates. Research updates require editorial review and a new repository commit.

The site is not an official Government of Ireland publication and does not endorse any party.


## Expanded Programme for Government and manifesto research

Two additional datasets are published and rendered on the website:

- `data/pfg_commitments_expanded.json`: 44 monitorable commitments across 11 policy domains, with printed Programme for Government page references and suggested measures. These are paraphrases, not a literal extraction of every pledge in the 162-page programme. Baselines, annual milestones and delivery statuses are not invented where the programme does not specify them.
- `data/manifesto_comparison_2024.json`: thematic comparison of nine 2024 party manifesto sources across housing, health, economy, climate, immigration and education.

The manifesto comparison is a first comparative edition, not yet a page-by-page manifesto audit. The Aontú link resolves to its policy portal and the Independent Ireland link to an archive index; obtain direct PDF links and verify page-level detail before treating those entries as fully sourced. The 2024 manifestos are historical party positions and must not be conflated with current policy or Government measures.

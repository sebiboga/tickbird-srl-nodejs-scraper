# Tickbird Scraper — GitHub Pages

## About

This page displays live job data for Tickbird SRL, fetched from the Peviitor API.

## How it works

1. The scraper runs daily via GitHub Actions
2. Fetches jobs from Zoho Recruit API (`join-us.tickbird.com/recruit/v2/public/Job_Openings?pagename=Careers`)
3. Validates company via ANAF (CIF 41104408)
4. Upserts jobs to SOLR (peviitor.ro's job database)
5. This page fetches live data from `api.peviitor.ro/v1/search/`

## Links

- [Live Jobs Page](https://sebiboga.github.io/tickbird-srl-nodejs-scraper/)
- [GitHub Repository](https://github.com/sebiboga/tickbird-srl-nodejs-scraper)
- [Peviitor.ro](https://peviitor.ro/)

## Technologies

- Zoho Recruit API (JSON source)
- Node.js + node-fetch (scraper)
- Apache SOLR (data store)
- GitHub Actions (automation)
- GitHub Pages (documentation)

# Project Files

## JavaScript Files

| File | Description |
|------|-------------|
| `index.js` | Main scraper - full workflow: validate company → scrape Zoho Recruit → transform → upsert to SOLR |
| `company.js` | Validates company via ANAF + Peviitor APIs, checks if company is active/inactive |
| `solr.js` | SOLR operations module - query, upsert, delete jobs + company core |
| `src/anaf.js` | ANAF API core module - getCompanyFromANAF(cif), searchCompany(brand) |
| `demoanaf.js` | CLI entry point for ANAF module (thin wrapper around src/anaf.js) |
| `validate-jobs.js` | Job URL validator CLI |

## Markdown Files

| File | Description |
|------|-------------|
| `AGENTS.md` | Rules for AI agents working on this project |
| `instructions.md` | Project documentation - workflow, technologies, API endpoints |
| `job-model.md` | Job schema definition (Peviitor Core) |
| `company-model.md` | Company schema definition (Peviitor Core) |
| `files.md` | This file - documents role of each project file |

## Configuration Files

| File | Description |
|------|-------------|
| `package.json` | Node.js project config - dependencies (node-fetch), scripts |
| `package-lock.json` | Locked dependency versions |
| `.gitignore` | Ignores node_modules/, .env.local, tmp/ |
| `.env.local` | Local environment variables (SOLR_AUTH) - NOT committed |

## Dependencies (node_modules/)

- `node-fetch` - HTTP requests
- `dotenv` - Environment variable loading

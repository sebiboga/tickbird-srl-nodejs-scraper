# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-06-06

### Added
- Initial release
- Job scraping from Zoho Recruit API (Tickbird Romania)
- Company validation via ANAF (CIF 41104408)
- Solr integration for job storage (job core + company core)
- GitHub Actions workflows for daily scraping, testing, and GitHub Pages deploy
- ANAF API fallback with cached data support
- GitHub Pages docs with live Peviitor API data

### Features
- Automated daily job scraping
- Company core validation and management
- Romanian location filtering
- Work mode normalization (remote, hybrid, on-site)
- Zoho Recruit API integration

## License

Copyright (c) 2024-2026 BOGA SEBASTIAN-NICOLAE
Licensed under MIT License

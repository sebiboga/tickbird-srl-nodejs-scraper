# Robots.txt Analysis — Tickbird

Sursa: https://tickbird.com/robots.txt

## Reguli

Nu există un robots.txt public pe tickbird.com. Site-ul este un Angular SPA găzduit pe Wix.

## Interpretare pentru scraper

| Cale | Accesibil? | Ce conține |
|---|---|---|
| `join-us.tickbird.com/recruit/v2/public/` | ✅ Da | API-ul public Zoho Recruit folosit de scraper |
| `tickbird.com/careers` | ✅ Da | Pagina de cariere (Angular SPA) |

## Concluzie

API-ul public Zoho Recruit (`join-us.tickbird.com/recruit/v2/public/Job_Openings`) nu este restricționat de robots.txt și nu necesită autentificare. Scraperul face o singură cerere API pentru toate job-urile — comportament rezonabil, nu agresiv.

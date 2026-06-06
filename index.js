import fetch from "node-fetch";
import fs from "fs";
import { fileURLToPath } from "url";
import { validateAndGetCompany } from "./company.js";
import { querySOLR, upsertJobs, upsertCompany } from "./solr.js";

const COMPANY_CIF = "41104408";
const API_URL = "https://join-us.tickbird.com/recruit/v2/public/Job_Openings?pagename=Careers";
const JOB_BASE = "https://tickbird.zohorecruit.eu/jobs/Careers";

let COMPANY_NAME = null;

async function fetchJobs() {
  const res = await fetch(API_URL, {
    headers: {
      "User-Agent": "job_seeker_ro_spider",
      "Accept": "application/json"
    }
  });
  if (!res.ok) throw new Error(`Tickbird API error: ${res.status}`);
  const data = await res.json();
  return data;
}

function parseApiJobs(apiData) {
  const jobs = apiData.data || [];
  return {
    jobs: jobs.map(job => {
      const remote = job.Remote_Job === "Yes";
      const jobType = (job.Job_Type || "").toLowerCase();
      let workmode = "on-site";
      if (remote) workmode = "remote";
      else if (jobType.includes("remote")) workmode = "remote";
      else if (jobType.includes("hybrid")) workmode = "hybrid";

      const location = [];
      if (job.City) location.push(job.City);
      if (job.Country?.toLowerCase() === "romania" && !job.City) location.push("România");

      const tags = [];
      if (job.Industry) tags.push(job.Industry.toLowerCase());
      if (job.Work_Experience) tags.push(job.Work_Experience.toLowerCase());

      const postingName = job.Posting_Title
        ? job.Posting_Title.replace(/[^a-zA-Z0-9-]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "")
        : `job-${job.id}`;
      const url = job.$url || `${JOB_BASE}/${job.id}/${postingName}?source=CareerSite`;

      return { url, title: job.Posting_Title, workmode, location, tags };
    }),
    total: jobs.length
  };
}

async function scrapeAllListings() {
  console.log("Fetching jobs from Tickbird Zoho Recruit API...");
  const data = await fetchJobs();
  const result = parseApiJobs(data);
  console.log(`Total jobs on site: ${result.total}`);
  return result.jobs;
}

function mapToJobModel(rawJob, cif, companyName = COMPANY_NAME) {
  const now = new Date().toISOString();
  const job = {
    url: rawJob.url,
    title: rawJob.title,
    company: companyName,
    cif: cif,
    location: rawJob.location?.length ? rawJob.location : ["România"],
    tags: rawJob.tags?.length ? rawJob.tags : undefined,
    workmode: rawJob.workmode || undefined,
    date: now,
    status: "scraped"
  };
  Object.keys(job).forEach((k) => job[k] === undefined && delete job[k]);
  return job;
}

function transformJobsForSOLR(payload) {
  const romanianCities = [
    'Bucharest', 'București', 'Cluj-Napoca', 'Cluj Napoca',
    'Timișoara', 'Timisoara', 'Iași', 'Iasi', 'Brașov', 'Brasov',
    'Constanța', 'Constanta', 'Craiova', 'Bacău', 'Sibiu',
    'Târgu Mureș', 'Targu Mures', 'Oradea', 'Baia Mare', 'Satu Mare',
    'Ploiești', 'Ploiesti', 'Pitești', 'Pitesti', 'Arad', 'Galați', 'Galati',
    'Brăila', 'Braila', 'Drobeta-Turnu Severin', 'Râmnicu Vâlcea', 'Ramnicu Valcea',
    'Buzău', 'Buzau', 'Botoșani', 'Botosani', 'Zalău', 'Zalau', 'Hunedoara', 'Deva',
    'Suceava', 'Bistrița', 'Bistrita', 'Tulcea', 'Călărași', 'Calarasi',
    'Giurgiu', 'Alba Iulia', 'Slatina', 'Piatra Neamț', 'Piatra Neamt', 'Roman',
    'Dumbrăvița', 'Dumbravita', 'Voluntari', 'Popești-Leordeni', 'Popesti-Leordeni',
    'Chitila', 'Mogoșoaia', 'Mogosoaia', 'Otopeni'
  ];
  const citySet = new Set(romanianCities.map(c => c.toLowerCase()));

  const normalizeWorkmode = (wm) => {
    if (!wm) return undefined;
    const lower = wm.toLowerCase();
    if (lower.includes('remote')) return 'remote';
    if (lower.includes('office') || lower.includes('on-site') || lower.includes('site')) return 'on-site';
    return 'hybrid';
  };

  const transformed = {
    ...payload,
    company: payload.company?.toUpperCase(),
    jobs: payload.jobs.map(job => {
      const validLocations = (job.location || []).filter(loc => {
        const lower = loc.toLowerCase().trim();
        if (lower === 'romania' || lower === 'românia') return true;
        return citySet.has(lower);
      }).map(loc => loc.toLowerCase() === 'romania' ? 'România' : loc);

      return {
        ...job,
        location: validLocations.length > 0 ? validLocations : ['România'],
        workmode: normalizeWorkmode(job.workmode)
      };
    })
  };

  return transformed;
}

async function main() {
  try {
    console.log("=== Step 1: Get existing jobs count ===");
    const existingResult = await querySOLR(COMPANY_CIF);
    const existingCount = existingResult.numFound;
    console.log(`Found ${existingCount} existing jobs in SOLR`);

    console.log("=== Step 2: Validate company via ANAF ===");
    const { company, cif, address } = await validateAndGetCompany();
    COMPANY_NAME = company;
    const localCif = cif;

    try {
      await upsertCompany({
        id: cif,
        company,
        brand: "Tickbird",
        status: "activ",
        location: address ? [address] : ["București"],
        website: ["https://tickbird.com"],
        career: ["https://tickbird.com/careers"],
        lastScraped: new Date().toISOString().split('T')[0],
        scraperFile: "https://raw.githubusercontent.com/sebiboga/tickbird-srl-nodejs-scraper/main/.github/workflows/scrape.yml"
      });
    } catch (err) {
      console.log(`Note: Could not upsert company to SOLR core: ${err.message}`);
    }

    const rawJobs = await scrapeAllListings();
    const scrapedCount = rawJobs.length;
    console.log(`Jobs scraped from Tickbird: ${scrapedCount}`);

    const jobs = rawJobs.map(job => mapToJobModel(job, localCif));

    const payload = {
      source: "tickbird.com",
      scrapedAt: new Date().toISOString(),
      company: COMPANY_NAME,
      cif: localCif,
      jobs
    };

    console.log("Transforming jobs for SOLR...");
    const transformedPayload = transformJobsForSOLR(payload);
    const validCount = transformedPayload.jobs.filter(j => j.location).length;
    console.log(`Jobs with valid Romanian locations: ${validCount}`);

    fs.mkdirSync("tmp", { recursive: true });
    fs.writeFileSync("tmp/jobs.json", JSON.stringify(transformedPayload, null, 2), "utf-8");
    console.log("Saved tmp/jobs.json");

    console.log("\n=== Step 3: Upsert jobs to SOLR ===");
    await upsertJobs(transformedPayload.jobs);

    const finalResult = await querySOLR(COMPANY_CIF);
    console.log(`\n=== SUMMARY ===`);
    console.log(`Jobs existing in SOLR before scrape: ${existingCount}`);
    console.log(`Jobs scraped from Tickbird: ${scrapedCount}`);
    console.log(`Jobs in SOLR after scrape: ${finalResult.numFound}`);
    console.log(`================`);

    console.log("\n=== DONE ===");
    console.log("Scraper completed successfully!");

  } catch (err) {
    console.error("Scraper failed:", err);
    process.exit(1);
  }
}

export { parseApiJobs, mapToJobModel, transformJobsForSOLR };

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main();
}

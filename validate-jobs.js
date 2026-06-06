#!/usr/bin/env node

import fetch from "node-fetch";
import fs from "fs";

const PEVIITOR_API = "https://api.peviitor.ro/v1/search/";
const TIMEOUT = 10000;
const CIF = "9533457";

async function checkUrl(url) {
  try {
    const res = await fetch(url, {
      method: "HEAD",
      timeout: TIMEOUT,
      headers: { "User-Agent": "job_seeker_ro_spider" }
    });
    return { url, status: res.status, valid: res.ok };
  } catch (err) {
    return { url, status: 0, valid: false, error: err.message };
  }
}

async function getEndavaJobs() {
  const url = `${PEVIITOR_API}?cif=${CIF}`;
  const res = await fetch(url, {
    headers: { "User-Agent": "job_seeker_ro_spider" }
  });
  if (!res.ok) throw new Error(`Peviitor API error: ${res.status}`);
  const data = await res.json();
  return data.jobs || [];
}

async function validateJobs(doDelete = false) {
  console.log("=== Endava Job URL Validator ===\n");
  const jobs = await getEndavaJobs();
  console.log(`Found ${jobs.length} jobs for CIF ${CIF}\n`);

  const invalidUrls = [];
  for (let i = 0; i < jobs.length; i++) {
    const job = jobs[i];
    const result = await checkUrl(job.url);
    const statusStr = result.status > 0 ? result.status.toString() : "ERR";
    console.log(`[${i+1}/${jobs.length}] ${statusStr} - ${job.title} - ${job.url}`);
    if (!result.valid) invalidUrls.push(job);
  }

  if (invalidUrls.length > 0) {
    console.log(`\n Found ${invalidUrls.length} invalid URLs:`);
    invalidUrls.forEach(j => console.log(`  - ${j.title}: ${j.url}`));

    if (doDelete) {
      console.log("\n--delete flag not implemented in this version. Use solr.js for deletion.");
    } else {
      console.log("\nRun with --dry-run to see what would be deleted.");
    }
  } else {
    console.log("\nAll URLs are valid!");
  }
}

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const doDelete = args.includes("--delete");

if (dryRun) {
  console.log("=== DRY RUN MODE ===\n");
  validateJobs(false);
} else if (doDelete) {
  console.log("=== DELETE MODE ===\n");
  validateJobs(true);
} else {
  validateJobs(false);
}

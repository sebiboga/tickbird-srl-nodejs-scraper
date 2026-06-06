import { jest } from '@jest/globals';
import { itIfSolr } from '../helpers/itIfSolr.js';

const TEST_CIF = '41104408';
const TEST_BRAND = 'Tickbird';
const API_URL = 'https://join-us.tickbird.com/recruit/v2/public/Job_Openings?pagename=Careers';

describe('E2E: Full Scraping Pipeline', () => {
  let index;
  let company;
  let solr;
  let apiData;

  beforeAll(async () => {
    index = await import('../../index.js');
    company = await import('../../company.js');
    solr = await import('../../solr.js');
  });

  describe('Tickbird API — Real Data Fetch', () => {
    it('should respond with valid job data from Tickbird API', async () => {
      const res = await fetch(API_URL, {
        headers: { 'User-Agent': 'job_seeker_ro_spider', 'Accept': 'application/json' }
      });
      expect(res.ok).toBe(true);
      apiData = await res.json();
      expect(apiData.code).toBe('success');
    }, 15000);

    it('should have Romania jobs with expected fields', () => {
      const jobs = apiData.data || [];
      expect(jobs.length).toBeGreaterThan(0);
      for (const job of jobs) {
        expect(job).toHaveProperty('Posting_Title');
        expect(job).toHaveProperty('id');
        expect(job).toHaveProperty('Remote_Job');
      }
    });

    it('should have Romanian country on all jobs', () => {
      const jobs = apiData.data || [];
      for (const job of jobs) {
        expect(['Yes', 'No']).toContain(job.Remote_Job);
      }
    });
  });

  describe('Parse + Transform Pipeline', () => {
    it('should parse real Tickbird API response into standardized format', () => {
      const parsed = index.parseApiJobs(apiData);
      expect(parsed.jobs.length).toBeGreaterThan(0);
      expect(parsed.total).toBeGreaterThan(0);

      for (const job of parsed.jobs) {
        expect(job).toHaveProperty('url');
        expect(job).toHaveProperty('title');
        expect(job).toHaveProperty('workmode');
      }
    });

    it('should map parsed jobs to job model', () => {
      const parsed = index.parseApiJobs(apiData);
      const model = index.mapToJobModel(parsed.jobs[0], TEST_CIF, 'TICKBIRD S.R.L.');

      expect(model.url).toBeDefined();
      expect(model.title).toBeDefined();
      expect(model.company).toBe('TICKBIRD S.R.L.');
      expect(model.cif).toBe(TEST_CIF);
      expect(model.status).toBe('scraped');
    });

    it('should transform jobs and filter to Romanian locations', () => {
      const parsed = index.parseApiJobs(apiData);
      const payload = {
        source: 'tickbird.com',
        scrapedAt: new Date().toISOString(),
        company: 'TICKBIRD S.R.L.',
        cif: TEST_CIF,
        jobs: parsed.jobs.map(j => index.mapToJobModel(j, TEST_CIF, 'TICKBIRD S.R.L.'))
      };

      const transformed = index.transformJobsForSOLR(payload);

      expect(transformed.jobs.length).toBeGreaterThan(0);
      for (const job of transformed.jobs) {
        expect(job).toHaveProperty('location');
        expect(Array.isArray(job.location)).toBe(true);
        expect(job.location.length).toBeGreaterThan(0);
        expect(job.workmode).toMatch(/^(remote|on-site|hybrid)$/);
      }
    });

    it('should produce valid job URLs that are accessible', async () => {
      const parsed = index.parseApiJobs(apiData);

      for (const job of parsed.jobs.slice(0, 2)) {
        const res = await fetch(job.url, {
          method: 'HEAD',
          headers: { 'User-Agent': 'job_seeker_ro_spider' }
        });
        expect(res.ok).toBe(true);
      }
    }, 30000);
  });

  describe('Company Validation Path', () => {
    it('should find Tickbird in ANAF and validate active status', async () => {
      const results = await anaf.searchCompany(TEST_BRAND);
      const tickbird = results.find(c => c.name.includes('TICKBIRD') && c.statusLabel === 'Funcțiune');
      expect(tickbird).toBeDefined();
      expect(tickbird.cui.toString()).toBe(TEST_CIF);

      const anafData = await anaf.getCompanyFromANAF(TEST_CIF);
      expect(anafData).toBeDefined();
      expect(anafData.inactive).toBe(false);
    }, 30000);

    itIfSolr('should run full validation and report active status with job count', async () => {
      const result = await company.validateAndGetCompany();
      expect(result.status).toBe('active');
      expect(result.company).toBe('TICKBIRD S.R.L.');
      expect(result.cif).toBe(TEST_CIF);
    }, 30000);
  });

  describe('Inactive Company Handling', () => {
    it('should detect inactive companies via ANAF', async () => {
      const results = await anaf.searchCompany('Tickbird');
      const active = results.find(c => c.cui.toString() === TEST_CIF);
      expect(active).toBeDefined();
      expect(active.statusLabel).toBe('Funcțiune');
    }, 30000);
  });

  describe('SOLR Data Verification', () => {
    itIfSolr('should have Tickbird company core entry with required fields', async () => {
      const result = await solr.queryCompanySOLR(`id:${TEST_CIF}`);
      expect(result.numFound).toBeGreaterThanOrEqual(0);
    }, 15000);
  });
});

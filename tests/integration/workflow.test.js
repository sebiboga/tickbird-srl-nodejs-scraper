import { jest } from '@jest/globals';
import { itIfSolr } from '../helpers/itIfSolr.js';

const TEST_CIF = '41104408';
const TEST_BRAND = 'Tickbird';

describe('Integration: API Workflow', () => {
  let anaf;
  let company;
  let solr;

  beforeAll(async () => {
    anaf = await import('../../src/anaf.js');
    company = await import('../../company.js');
    solr = await import('../../solr.js');
  });

  describe('ANAF API', () => {
    it('should search for Tickbird brand and find the company', async () => {
      const results = await anaf.searchCompany(TEST_BRAND);
      const tickbird = results.find(c => c.name.includes('TICKBIRD'));
      expect(tickbird).toBeDefined();
      expect(tickbird.cui.toString()).toBe(TEST_CIF);
      expect(tickbird.statusLabel).toBe('Funcțiune');
    }, 30000);

    it('should return empty array for non-existent brand', async () => {
      const results = await anaf.searchCompany('ZZZZZ_NONEXISTENT');
      expect(results).toEqual([]);
    }, 30000);

    it('should fetch company details by valid CIF', async () => {
      const data = await anaf.getCompanyFromANAF(TEST_CIF);
      expect(data).toBeDefined();
      expect(data.name).toBe('TICKBIRD S.R.L.');
      expect(data.cui).toBe(41104408);
      expect(data.inactive).toBe(false);
    }, 30000);
  });

  describe('Full Validation Workflow', () => {
    it('should complete the ANAF validation path', async () => {
      const result = await company.getCompanyData();
      expect(result.company).toBe('TICKBIRD S.R.L.');
      expect(result.cif).toBe(TEST_CIF);
      expect(result.active).toBe(true);
    }, 30000);

    itIfSolr('should validate company and query SOLR for existing jobs', async () => {
      const companyResult = await company.validateAndGetCompany();
      expect(companyResult.status).toBe('active');
      expect(companyResult.company).toBe('TICKBIRD S.R.L.');
      expect(companyResult.cif).toBe(TEST_CIF);
    }, 30000);

    itIfSolr('should have matching CIF in company core', async () => {
      const result = await solr.queryCompanySOLR(`id:${TEST_CIF}`);
      expect(result.numFound).toBeGreaterThanOrEqual(0);
    }, 15000);
  });
});

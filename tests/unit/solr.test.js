import { jest } from '@jest/globals';

const MOCK_SOLR_RESPONSE = {
  response: { numFound: 5, docs: [
    { id: '1', url: 'https://tickbird.zohorecruit.eu/jobs/Careers/1/test', company: 'TICKBIRD S.R.L.', cif: '41104408', status: 'scraped' }
  ]}
};

const mockFetch = jest.fn(() =>
  Promise.resolve({ ok: true, json: () => Promise.resolve(MOCK_SOLR_RESPONSE) })
);

jest.unstable_mockModule('node-fetch', () => ({ default: mockFetch }));

describe('solr.js', () => {
  let solr;

  beforeAll(async () => {
    process.env.SOLR_AUTH = 'test:test';
    solr = await import('../../solr.js');
  });

  afterAll(() => {
    delete process.env.SOLR_AUTH;
  });

  describe('getSolrAuth', () => {
    it('should return SOLR_AUTH from environment', () => {
      expect(solr.getSolrAuth()).toBe('test:test');
    });

    it('should return undefined when not set', () => {
      delete process.env.SOLR_AUTH;
      expect(solr.getSolrAuth()).toBeUndefined();
      process.env.SOLR_AUTH = 'test:test';
    });
  });

  describe('querySOLR', () => {
    it('should return response object with docs', async () => {
      const result = await solr.querySOLR('41104408');
      expect(result.numFound).toBe(5);
      expect(result.docs).toHaveLength(1);
    });

    it('should throw when SOLR_AUTH is missing', async () => {
      delete process.env.SOLR_AUTH;
      await expect(solr.querySOLR('41104408')).rejects.toThrow('SOLR_AUTH');
      process.env.SOLR_AUTH = 'test:test';
    });
  });

  describe('upsertJobs', () => {
    it('should accept array of jobs', async () => {
      const jobs = [{ url: 'https://test.com/1', title: 'Test' }];
      await expect(solr.upsertJobs(jobs)).resolves.not.toThrow();
    });
  });
});

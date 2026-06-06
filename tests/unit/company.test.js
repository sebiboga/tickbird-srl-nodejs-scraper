import { jest } from '@jest/globals';

const mockAnafData = {
  cui: 41104408,
  name: 'TICKBIRD S.R.L.',
  inactive: false,
  address: 'VIITORULUI, 21, Municipiul Blaj, Alba',
  caenCode: '6210'
};

const mockFetch = jest.fn((url) => {
  if (url.includes('demoanaf.ro/api/search')) {
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ success: true, data: [{ cui: 41104408, name: 'TICKBIRD S.R.L.', statusLabel: 'Funcțiune' }] })
    });
  }
  if (url.includes('demoanaf.ro/api/company')) {
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ success: true, data: mockAnafData })
    });
  }
  return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
});

jest.unstable_mockModule('node-fetch', () => ({ default: mockFetch }));
jest.unstable_mockModule('../../solr.js', () => ({
  querySOLR: jest.fn(() => Promise.resolve({ numFound: 1, docs: [] })),
  deleteJobsByCIF: jest.fn()
}));

describe('company.js', () => {
  let company;
  let anaf;

  beforeAll(async () => {
    process.env.SOLR_AUTH = 'test:test';
    anaf = await import('../../src/anaf.js');
    company = await import('../../company.js');
  });

  afterAll(() => {
    delete process.env.SOLR_AUTH;
  });

  describe('getCompanyBrand', () => {
    it('should return the company brand', () => {
      expect(company.getCompanyBrand()).toBe('Tickbird');
    });
  });

  describe('getCompanyData (no cache)', () => {
    it('should fetch tickbird via direct CIF lookup and return company data', async () => {
      const result = await company.getCompanyData();
      expect(result.company).toBe('TICKBIRD S.R.L.');
      expect(result.cif).toBe('41104408');
      expect(result.active).toBe(true);
    });
  });
});

import { jest } from '@jest/globals';

const mockAnafSuccess = {
  cui: 41104408,
  name: 'TICKBIRD S.R.L.',
  inactive: false,
  address: 'VIITORULUI, 21, Municipiul Blaj, Alba',
  caenCode: '6210'
};

const mockFetch = jest.fn((url) => {
  if (url.includes('demoanaf.ro/api/search?q=Tickbird')) {
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve({
        success: true,
        data: [{ cui: 41104408, name: 'TICKBIRD S.R.L.', statusLabel: 'Funcțiune' }]
      })
    });
  }
  if (url.includes('demoanaf.ro/api/search?q=Nonexistent')) {
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ success: true, data: [] })
    });
  }
  if (url.includes('demoanaf.ro/api/company/41104408')) {
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ success: true, data: mockAnafSuccess })
    });
  }
  return Promise.resolve({ ok: false, status: 500 });
});

jest.unstable_mockModule('node-fetch', () => ({ default: mockFetch }));

describe('src/anaf.js', () => {
  let anaf;

  beforeAll(async () => {
    anaf = await import('../../src/anaf.js');
  });

  describe('searchCompany', () => {
    it('should return array of companies for valid brand', async () => {
      const results = await anaf.searchCompany('Tickbird');
      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].name).toContain('TICKBIRD');
    });

    it('should return empty array for non-existent brand', async () => {
      const results = await anaf.searchCompany('Nonexistent');
      expect(results).toEqual([]);
    });
  });

  describe('getCompanyFromANAF', () => {
    it('should return company data for valid CIF', async () => {
      const data = await anaf.getCompanyFromANAF('41104408');
      expect(data).toBeDefined();
      expect(data.name).toBe('TICKBIRD S.R.L.');
      expect(data.cui).toBe(41104408);
    });
  });
});

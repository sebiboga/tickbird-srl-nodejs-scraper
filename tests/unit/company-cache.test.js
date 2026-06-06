import { jest } from '@jest/globals';

const CACHE_DATA = {
  validatedAt: new Date().toISOString(),
  source: 'ANAF',
  brand: 'Tickbird',
  anaf: {
    cui: 41104408,
    name: 'TICKBIRD S.R.L.',
    inactive: false,
    address: 'VIITORULUI, 21, Municipiul Blaj, Alba'
  },
  summary: {
    company: 'TICKBIRD S.R.L.',
    cif: '41104408',
    active: true,
    address: 'VIITORULUI, 21, Municipiul Blaj, Alba'
  }
};

jest.unstable_mockModule('node-fetch', () => ({
  default: jest.fn(() => Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ success: true, data: { cui: 41104408, name: 'TICKBIRD S.R.L.', inactive: false } })
  }))
}));

jest.unstable_mockModule('../../solr.js', () => ({
  querySOLR: jest.fn(() => Promise.resolve({ numFound: 1, docs: [] })),
  deleteJobsByCIF: jest.fn()
}));

describe('company.js (with cache)', () => {
  let company;
  let fs;

  beforeAll(async () => {
    fs = await import('fs');
    if (!fs.existsSync('tmp')) fs.mkdirSync('tmp', { recursive: true });
    fs.writeFileSync('tmp/company.json', JSON.stringify(CACHE_DATA));
    process.env.SOLR_AUTH = 'test:test';
    company = await import('../../company.js');
  });

  afterAll(() => {
    delete process.env.SOLR_AUTH;
    if (fs.existsSync('tmp/company.json')) fs.unlinkSync('tmp/company.json');
  });

  describe('getCompanyData (with cache)', () => {
    it('should use cached company data when available', async () => {
      const result = await company.getCompanyData();
      expect(result.company).toBe('TICKBIRD S.R.L.');
      expect(result.cif).toBe('41104408');
      expect(result.active).toBe(true);
    });
  });
});

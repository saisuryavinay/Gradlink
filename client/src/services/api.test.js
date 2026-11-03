import { describe, expect, it } from 'vitest';
import { normalizeApiBaseUrl } from './api';

describe('normalizeApiBaseUrl', () => {
  it('adds the /api suffix to a bare backend URL', () => {
    expect(normalizeApiBaseUrl('https://gradlink-backend-3ade.onrender.com')).toBe(
      'https://gradlink-backend-3ade.onrender.com/api'
    );
  });

  it('leaves a configured API URL unchanged', () => {
    expect(normalizeApiBaseUrl('https://gradlink-backend-3ade.onrender.com/api')).toBe(
      'https://gradlink-backend-3ade.onrender.com/api'
    );
  });

  it('strips trailing slashes before appending /api', () => {
    expect(normalizeApiBaseUrl('http://localhost:5000/')).toBe('http://localhost:5000/api');
  });
});

/**
 * Unit tests for API utilities
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { apiCall, eventApi, spotifyApi } from '../api';
import { mockFetch } from '../../test-utils';

describe('apiCall', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should make a successful API call', async () => {
    const mockData = { success: true, data: { id: '123' } };
    mockFetch(mockData, true, 200);

    const result = await apiCall('/test');

    expect(result.success).toBe(true);
    expect(result.data).toEqual(mockData);
  });

  it('should handle API errors', async () => {
    const mockError = { error: 'Not found' };
    mockFetch(mockError, false, 404);

    const result = await apiCall('/test');

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('should handle network errors', async () => {
    global.fetch = vi.fn(() => Promise.reject(new Error('Network error')));

    const result = await apiCall('/test');

    expect(result.success).toBe(false);
    expect(result.error).toContain('Network error');
  });
});

describe('eventApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should create an event', async () => {
    const eventData = {
      name: 'Test Event',
      theme: 'Party',
    };
    const mockResponse = { success: true, data: { id: '123', ...eventData } };
    mockFetch(mockResponse, true, 200);

    const result = await eventApi.create(eventData);

    expect(result.success).toBe(true);
  });

  it('should get an event by code', async () => {
    const mockEvent = { id: '123', code: 'ABC123' };
    mockFetch(mockEvent, true, 200);

    const result = await eventApi.get('ABC123');

    expect(result.success).toBe(true);
  });
});

describe('spotifyApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should get Spotify auth URL', async () => {
    const mockResponse = { url: 'https://accounts.spotify.com/authorize' };
    mockFetch(mockResponse, true, 200);

    const result = await spotifyApi.getAuthUrl();

    expect(result.success).toBe(true);
  });
});







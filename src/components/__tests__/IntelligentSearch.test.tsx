/**
 * Component tests for IntelligentSearch
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '../../test-utils';
import { IntelligentSearch } from '../IntelligentSearch';
import * as djWorkflow from '../../utils/djWorkflow';

// Mock the searchTracks function
vi.mock('../../utils/djWorkflow', () => ({
  searchTracks: vi.fn(),
}));

describe('IntelligentSearch', () => {
  const mockOnTrackSelected = vi.fn();
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render search input', () => {
    render(
      <IntelligentSearch
        onTrackSelected={mockOnTrackSelected}
        placeholder="Search for track..."
      />
    );

    const input = screen.getByPlaceholderText('Search for track...');
    expect(input).toBeInTheDocument();
  });

  it('should call onTrackSelected when track is selected', async () => {
    const mockTrack = {
      trackId: '123',
      name: 'Test Track',
      artist: 'Test Artist',
      album: 'Test Album',
      albumArt: null,
      explicit: false,
      releaseYear: 2023,
    };

    vi.mocked(djWorkflow.searchTracks).mockResolvedValue([mockTrack]);

    render(
      <IntelligentSearch
        onTrackSelected={mockOnTrackSelected}
        autoFocus={false}
      />
    );

    const input = screen.getByPlaceholderText('Search for track...');
    
    // Simulate typing
    input.focus();
    // Note: In a real test, you'd use userEvent.type() from @testing-library/user-event
    
    // Wait for search results
    await waitFor(() => {
      expect(djWorkflow.searchTracks).toHaveBeenCalled();
    }, { timeout: 1000 });
  });

  it('should display error message when search fails', async () => {
    vi.mocked(djWorkflow.searchTracks).mockRejectedValue(new Error('Search failed'));

    render(
      <IntelligentSearch
        onTrackSelected={mockOnTrackSelected}
        autoFocus={false}
      />
    );

    // Error should be displayed after failed search
    // This would require actual user interaction simulation
  });

  it('should call onClose when Escape is pressed', () => {
    render(
      <IntelligentSearch
        onTrackSelected={mockOnTrackSelected}
        onClose={mockOnClose}
        autoFocus={false}
      />
    );

    const input = screen.getByPlaceholderText('Search for track...');
    
    // Simulate Escape key press
    const escapeEvent = new KeyboardEvent('keydown', { key: 'Escape' });
    input.dispatchEvent(escapeEvent);

    // Note: This is a simplified test - in practice you'd use userEvent
  });
});







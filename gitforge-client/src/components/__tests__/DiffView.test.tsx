import { render, screen, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import DiffView from '../DiffView';
import React from 'react';

// Mock monaco-editor module
vi.mock('monaco-editor', () => ({
  default: {},
  editor: {},
  languages: {}
}));

// Mock @monaco-editor/react
vi.mock('@monaco-editor/react', () => ({
  DiffEditor: vi.fn(({ original, modified }) => <div data-testid="monaco-diff-editor">{modified}</div>),
  loader: {
    config: vi.fn(),
  }
}));

describe('DiffView', () => {
  it('renders loading state initially', () => {
    render(<DiffView original="" modified="" />);
    expect(screen.getByText('Loading diff...')).toBeInTheDocument();
  });

  it('renders merge conflict warning when conflicts detected', async () => {
    const original = 'base content';
    const modified = `<<<<<<< HEAD
my change
=======
their change
>>>>>>> other`;
    
    render(<DiffView original={original} modified={modified} />);
    
    // Wait for the component to finish loading and debounce
    // Using a longer timeout to accommodate slow CI environments
    await waitFor(() => {
      expect(screen.queryByText('Loading diff...')).not.toBeInTheDocument();
    }, { timeout: 10000 });

    expect(screen.getByText(/Merge Conflicts Detected/i)).toBeInTheDocument();
    expect(screen.getByTestId('monaco-diff-editor')).toBeInTheDocument();
  }, 15000); // 15s timeout for the whole test
});

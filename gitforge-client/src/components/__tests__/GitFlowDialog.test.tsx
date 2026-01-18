import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import GitFlowDialog from '../GitFlowDialog';
import React from 'react';

// Mock Electron IPC
vi.mock('@/lib/electron', () => ({
  getConfig: vi.fn().mockResolvedValue(''),
  setConfig: vi.fn().mockResolvedValue(true),
}));

// Mock standard git ops
vi.mock('@/lib/api', () => ({
  createBranch: vi.fn().mockResolvedValue(true),
  checkout: vi.fn().mockResolvedValue(true),
}));

describe('GitFlowDialog', () => {
  const onRefresh = vi.fn();
  const onOpenChange = vi.fn();

  it('renders initialization view when not initialized', async () => {
    const { getConfig } = await import('@/lib/electron');
    (getConfig as any).mockResolvedValue('');

    render(
      <GitFlowDialog 
        open={true} 
        onOpenChange={onOpenChange} 
        repoPath="/path/to/repo" 
        onRefresh={onRefresh} 
      />
    );
    
    await waitFor(() => {
      expect(screen.getByText('Master Branch')).toBeInTheDocument();
      expect(screen.getByText('Initialize Git Flow')).toBeInTheDocument();
    });
  });

  it('calls handleInit and initializes gitflow', async () => {
    const { setConfig } = await import('@/lib/electron');
    const { createBranch } = await import('@/lib/api');

    render(
      <GitFlowDialog 
        open={true} 
        onOpenChange={onOpenChange} 
        repoPath="/path/to/repo" 
        onRefresh={onRefresh} 
      />
    );
    
    const initButton = await screen.findByText('Initialize Git Flow');
    fireEvent.click(initButton);
    
    await waitFor(() => {
      expect(setConfig).toHaveBeenCalledWith('/path/to/repo', 'gitflow.branch.master', 'master');
      expect(createBranch).toHaveBeenCalled();
      expect(onRefresh).toHaveBeenCalled();
    });
  });
});

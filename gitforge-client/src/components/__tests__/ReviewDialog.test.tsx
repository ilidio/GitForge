import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import ReviewDialog from '@/components/ReviewDialog';
import React from 'react';

describe('ReviewDialog', () => {
  it('renders loading state', () => {
    render(<ReviewDialog open={true} onOpenChange={vi.fn()} review="" loading={true} error="" />);
    expect(screen.getByText(/Analyzing staged changes/i)).toBeInTheDocument();
  });

  it('renders error state', () => {
    render(<ReviewDialog open={true} onOpenChange={vi.fn()} review="" loading={false} error="API Error" />);
    expect(screen.getByText(/API Error/i)).toBeInTheDocument();
  });

  it('renders review content with bullet points', () => {
    const review = "Summary:\n- Fix null check in user.ts\n- Update dependencies";
    render(<ReviewDialog open={true} onOpenChange={vi.fn()} review={review} loading={false} error="" />);
    
    expect(screen.getByText(/Summary:/i)).toBeInTheDocument();
    expect(screen.getByText(/Fix null check in user.ts/i)).toBeInTheDocument();
    expect(screen.getByText(/Update dependencies/i)).toBeInTheDocument();
  });

  it('handles copy to clipboard', () => {
    const review = "Review content";
    const writeText = vi.fn();
    Object.assign(navigator, { clipboard: { writeText } });

    render(<ReviewDialog open={true} onOpenChange={vi.fn()} review={review} loading={false} error="" />);
    
    const copyButton = screen.getByText(/Copy/i);
    fireEvent.click(copyButton);

    expect(writeText).toHaveBeenCalledWith(review);
    expect(screen.getByText(/Copied/i)).toBeInTheDocument();
  });
});

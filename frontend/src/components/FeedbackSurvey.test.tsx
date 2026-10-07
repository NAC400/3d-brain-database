import React from 'react';
import { act, fireEvent, render, screen, cleanup } from '@testing-library/react';
import FeedbackSurvey from './FeedbackSurvey';

beforeEach(() => {
  jest.useFakeTimers();
  sessionStorage.clear();
  HTMLDialogElement.prototype.showModal = function () { this.setAttribute('open', ''); };
  HTMLDialogElement.prototype.close = function () {
    this.removeAttribute('open');
    this.dispatchEvent(new Event('close'));
  };
});
afterEach(() => { cleanup(); jest.useRealTimers(); });

test('delays the invitation, keeps the launcher after dismissal, and does not prompt again on remount', () => {
  const view = render(<FeedbackSurvey />);
  act(() => { jest.advanceTimersByTime(179999); });
  expect(screen.queryByText('Help shape Mapped Brain')).not.toBeInTheDocument();
  act(() => { jest.advanceTimersByTime(1); });
  expect(screen.getByText('Help shape Mapped Brain')).toBeInTheDocument();
  fireEvent.click(screen.getByLabelText('Dismiss feedback invitation'));
  expect(screen.getByRole('button', { name: 'Feedback' })).toBeInTheDocument();
  view.unmount();
  render(<FeedbackSurvey />);
  act(() => { jest.advanceTimersByTime(180000); });
  expect(screen.queryByText('Help shape Mapped Brain')).not.toBeInTheDocument();
});

test('loads the embedded form only on request and releases it on close', () => {
  render(<FeedbackSurvey />);
  expect(screen.queryByTitle('Mapped Brain feedback survey')).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Feedback' }));
  expect(screen.getByRole('dialog')).toBeInTheDocument();
  expect(screen.getByTitle('Mapped Brain feedback survey')).toHaveAttribute('src', expect.stringContaining('?embedded=true'));
  fireEvent.click(screen.getByLabelText('Close feedback survey'));
  expect(screen.queryByTitle('Mapped Brain feedback survey')).not.toBeInTheDocument();
  act(() => { jest.advanceTimersByTime(180000); });
  expect(screen.queryByText('Help shape Mapped Brain')).not.toBeInTheDocument();
});

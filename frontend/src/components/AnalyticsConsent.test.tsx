import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import AnalyticsConsent from './AnalyticsConsent';
import { setAnalyticsConsent } from '../lib/analytics';

jest.mock('../lib/analytics', () => ({ getAnalyticsConsent: () => null, setAnalyticsConsent: jest.fn() }));

test('visitors can reject, reopen preferences, and accept without losing access to the app', () => {
  HTMLDialogElement.prototype.showModal = function () { this.setAttribute('open', ''); };
  HTMLDialogElement.prototype.close = function () { this.removeAttribute('open'); };
  render(<><main>Research workspace</main><AnalyticsConsent /></>);
  const banner = screen.getByRole('region', { name: 'Optional analytics' });
  fireEvent.click(banner.querySelectorAll('button')[1]);
  expect(setAnalyticsConsent).toHaveBeenLastCalledWith('rejected');
  expect(screen.queryByRole('region', { name: 'Optional analytics' })).not.toBeInTheDocument();
  expect(screen.getByText('Research workspace')).toBeVisible();
  fireEvent.click(screen.getByRole('button', { name: 'Analytics preferences' }));
  expect(screen.getByRole('dialog', { name: 'Analytics preferences' })).toBeVisible();
  fireEvent.click(screen.getByRole('button', { name: 'Accept analytics' }));
  expect(setAnalyticsConsent).toHaveBeenLastCalledWith('accepted');
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'Privacy' })).toHaveAttribute('href', '/privacy.html');
});

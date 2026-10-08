import posthog from 'posthog-js';
import { captureEvent, initAnalytics, setAnalyticsConsent, getAnalyticsConsent } from './analytics';
import { useBrainStore } from '../store/brainStore';

jest.mock('posthog-js', () => ({ __esModule: true, default: { init: jest.fn(), capture: jest.fn(), opt_in_capturing: jest.fn(), opt_out_capturing: jest.fn() } }));

test('analytics stays optional and tracks state navigation without sending private content', () => {
  const originalEnv = process.env;
  process.env = { ...originalEnv, NODE_ENV: 'production', REACT_APP_POSTHOG_KEY: '', REACT_APP_POSTHOG_HOST: '' };
  try {
    initAnalytics();
    captureEvent('signup_submitted');
    expect(posthog.init).not.toHaveBeenCalled();
    expect(posthog.capture).not.toHaveBeenCalled();

    process.env.REACT_APP_POSTHOG_KEY = 'phc_test';
    process.env.REACT_APP_POSTHOG_HOST = 'https://eu.i.posthog.com';
    initAnalytics();
    expect(posthog.init).not.toHaveBeenCalled();
    setAnalyticsConsent('rejected');
    initAnalytics();
    captureEvent('signup_submitted');
    expect(posthog.init).not.toHaveBeenCalled();
    expect(posthog.capture).not.toHaveBeenCalled();
    setAnalyticsConsent('accepted');
    initAnalytics();
    expect(posthog.init).toHaveBeenCalledTimes(1);
    expect(posthog.init).toHaveBeenCalledWith('phc_test', expect.objectContaining({
      autocapture: false, disable_session_recording: true, capture_pageview: false, person_profiles: 'never',
      property_denylist: expect.arrayContaining(['$current_url', '$referrer', '$search']),
    }));

    useBrainStore.getState().setAppPage('explorer');
    useBrainStore.getState().setAppPage('explorer');
    expect((posthog.capture as jest.Mock).mock.calls.filter(([event, properties]) =>
      event === '$pageview' && properties.screen === 'explorer')).toHaveLength(1);
    useBrainStore.getState().addProject({ id: 'private-id', name: 'PRIVATE PROJECT', mode: 'private', color: '#fff', createdAt: '' });
    useBrainStore.getState().addStructureNote('hippocampus', { id: 'note-id', content: 'PRIVATE NOTE', createdAt: '', updatedAt: '', versions: [] });
    expect(posthog.capture).toHaveBeenCalledWith('project_created', undefined);
    expect(posthog.capture).toHaveBeenCalledWith('note_saved', undefined);
    expect(JSON.stringify((posthog.capture as jest.Mock).mock.calls)).not.toMatch(/PRIVATE|private-id|note-id/);
    (posthog.capture as jest.Mock).mockImplementationOnce(() => { throw new Error('blocked'); });
    expect(() => useBrainStore.getState().setSelectedRegion('hippocampus')).not.toThrow();
    const callsBeforeWithdrawal = (posthog.capture as jest.Mock).mock.calls.length;
    setAnalyticsConsent('rejected');
    expect(getAnalyticsConsent()).toBe('rejected');
    expect(posthog.opt_out_capturing).toHaveBeenCalledTimes(1);
    useBrainStore.getState().setAppPage('library');
    captureEvent('signup_submitted');
    expect((posthog.capture as jest.Mock).mock.calls).toHaveLength(callsBeforeWithdrawal);
    setAnalyticsConsent('accepted');
    expect(posthog.opt_in_capturing).toHaveBeenCalledTimes(2);
    useBrainStore.getState().setAppPage('community');
    expect(posthog.capture).toHaveBeenLastCalledWith('$pageview', { screen: 'community' });
  } finally {
    setAnalyticsConsent('rejected');
    localStorage.removeItem('mapped-analytics-consent-v1');
    process.env = originalEnv;
  }
});

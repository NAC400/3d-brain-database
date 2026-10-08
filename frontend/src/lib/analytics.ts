import posthog from 'posthog-js';
import { useBrainStore } from '../store/brainStore';

let started = false;
let unsubscribe: (() => void) | undefined;
export type AnalyticsConsent = 'accepted' | 'rejected';
const consentKey = 'mapped-analytics-consent-v1';

export function getAnalyticsConsent(): AnalyticsConsent | null {
  try {
    const value = localStorage.getItem(consentKey);
    return value === 'accepted' || value === 'rejected' ? value : null;
  } catch { return null; }
}

export function setAnalyticsConsent(consent: AnalyticsConsent) {
  try { localStorage.setItem(consentKey, consent); } catch { /* Storage may be unavailable. */ }
  if (consent === 'accepted') initAnalytics(true);
  else {
    unsubscribe?.();
    unsubscribe = undefined;
    if (started) {
      started = false;
      try { posthog.opt_out_capturing(); } catch { /* Fail closed even if the SDK fails. */ }
    }
  }
}

export function captureEvent(event: string, properties?: Record<string, string | number | boolean>) {
  if (!started) return;
  try { posthog.capture(event, properties); } catch { /* Analytics must not interrupt the app. */ }
}

export function initAnalytics(accepted = getAnalyticsConsent() === 'accepted') {
  const key = process.env.REACT_APP_POSTHOG_KEY;
  const host = process.env.REACT_APP_POSTHOG_HOST;
  if (!accepted || started || process.env.NODE_ENV !== 'production' || !key || !host) return;
  try {
    posthog.init(key, {
      api_host: host,
      autocapture: false,
      capture_pageview: false,
      capture_pageleave: false,
      capture_performance: false,
      disable_session_recording: true,
      disable_surveys: true,
      disable_external_dependency_loading: true,
      advanced_disable_flags: true,
      save_referrer: false,
      save_campaign_params: false,
      person_profiles: 'never',
      persistence: 'localStorage',
      opt_out_capturing_by_default: true,
      opt_out_persistence_by_default: true,
      opt_out_capturing_persistence_type: 'localStorage',
      // Auth recovery URLs can contain tokens; never send URLs or query strings.
      property_denylist: [
        '$current_url', '$referrer', '$initial_current_url', '$initial_referrer',
        '$pathname', '$initial_pathname', '$search', '$initial_search',
        '$session_entry_url', '$session_entry_referrer', '$session_entry_pathname', '$session_entry_search',
      ],
    });
    // Consent is already granted; do not emit the SDK's automatic opt-in event.
    posthog.opt_in_capturing({ captureEventName: false });
    started = true;
    captureEvent('$pageview', { screen: useBrainStore.getState().appPage });
    unsubscribe = useBrainStore.subscribe((state, previous) => {
      if (state.appPage !== previous.appPage) captureEvent('$pageview', { screen: state.appPage });
      if (state.selectedRegion && state.selectedRegion !== previous.selectedRegion) {
        captureEvent('region_selected', { region: state.selectedRegion, atlas: state.brainAtlas });
      }
      if (state.projects.length > previous.projects.length) captureEvent('project_created');
      if (state.sources.length > previous.sources.length) captureEvent('source_saved');
      if (state.structureNotes !== previous.structureNotes || state.sources !== previous.sources) {
        const countNotes = (s: typeof state) => Object.values(s.structureNotes).reduce((n, notes) => n + notes.length, 0)
          + s.sources.reduce((n, source) => n + source.notes.length, 0);
        if (countNotes(state) > countNotes(previous)) captureEvent('note_saved');
      }
    });
  } catch { /* Missing or blocked analytics must not prevent rendering. */ }
}

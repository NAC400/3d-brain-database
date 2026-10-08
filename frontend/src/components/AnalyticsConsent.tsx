import React, { useRef, useState } from 'react';
import { getAnalyticsConsent, setAnalyticsConsent, type AnalyticsConsent as Choice } from '../lib/analytics';
import './AnalyticsConsent.css';

export default function AnalyticsConsent() {
  const [choice, setChoice] = useState(getAnalyticsConsent);
  const dialog = useRef<HTMLDialogElement>(null);
  const choose = (value: Choice) => {
    setAnalyticsConsent(value);
    setChoice(value);
    dialog.current?.close();
  };
  const controls = <div className="analytics-actions">
    <button type="button" onClick={() => choose('accepted')}>Accept analytics</button>
    <button type="button" onClick={() => choose('rejected')}>Reject analytics</button>
  </div>;
  const message = <p>We use optional PostHog analytics to understand which MAPPED features people use and improve the app. It uses a browser identifier. We don’t record sessions or send private notes or project text. You can use MAPPED without accepting analytics. <a href="/privacy.html">Privacy notice</a></p>;
  return <>
    {!choice && <section className="analytics-banner" aria-label="Optional analytics">
      <strong>Help us improve MAPPED</strong>{message}{controls}
    </section>}
    <div className="analytics-links"><a href="/privacy.html">Privacy</a><button type="button" onClick={() => dialog.current?.showModal()}>Analytics preferences</button></div>
    <dialog ref={dialog} className="analytics-dialog" aria-labelledby="analytics-title">
      <h2 id="analytics-title">Analytics preferences</h2>{message}
      <p>Current choice: {choice === 'accepted' ? 'analytics accepted' : choice === 'rejected' ? 'analytics rejected' : 'no choice yet'}. Rejecting stops future PostHog collection and clears its browser identifier. It does not delete events already sent.</p>
      {controls}<button type="button" className="analytics-close" onClick={() => dialog.current?.close()}>Close</button>
    </dialog>
  </>;
}

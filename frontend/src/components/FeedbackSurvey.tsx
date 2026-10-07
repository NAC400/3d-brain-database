import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import './FeedbackSurvey.css';

const SURVEY_URL = 'https://docs.google.com/forms/d/e/1FAIpQLSc4VX0dxA-xZhUUVoH1s-FljoeU8Rat_K_M-3VHCSoQdfY-nQ/viewform';
const SESSION_KEY = 'mapped-feedback-prompt-seen';

export default function FeedbackSurvey() {
  const [promptOpen, setPromptOpen] = useState(false);
  const [surveyOpen, setSurveyOpen] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const prompted = useRef(false);

  const rememberPrompt = () => {
    prompted.current = true;
    try { sessionStorage.setItem(SESSION_KEY, 'true'); } catch { /* Storage may be disabled. */ }
  };

  useEffect(() => {
    try { if (sessionStorage.getItem(SESSION_KEY)) return; } catch { /* Still allow feedback. */ }
    const timer = window.setTimeout(() => {
      if (prompted.current) return;
      rememberPrompt();
      setPromptOpen(true);
    }, 3 * 60 * 1000);
    return () => window.clearTimeout(timer);
  }, []);

  const openSurvey = () => {
    rememberPrompt();
    setPromptOpen(false);
    setSurveyOpen(true);
    dialog.current?.showModal();
  };

  return createPortal(<>
    <aside className="feedback-widget" aria-label="Website feedback">
      {promptOpen && <section className="feedback-prompt" aria-labelledby="feedback-prompt-title">
        <button className="feedback-close" aria-label="Dismiss feedback invitation" onClick={() => setPromptOpen(false)}>×</button>
        <h2 id="feedback-prompt-title">Help shape Mapped Brain</h2>
        <p>How has it been so far? Share your thoughts in our optional 10-question survey.</p>
        <button className="feedback-action" onClick={openSurvey}>Take the quick survey</button>
        <p className="feedback-note">Not now? Close this invitation and use Feedback whenever you’re ready.</p>
      </section>}
      <button className="feedback-launch" onClick={openSurvey} aria-haspopup="dialog">Feedback</button>
    </aside>
    <dialog ref={dialog} className="feedback-dialog" aria-labelledby="feedback-survey-title" onClose={() => setSurveyOpen(false)}>
      <div className="feedback-heading">
        <h2 id="feedback-survey-title">Share your feedback</h2>
        <button className="feedback-close" aria-label="Close feedback survey" onClick={() => dialog.current?.close()}>×</button>
      </div>
      <p className="feedback-note">Optional · 10 questions · Hosted by Google Forms</p>
      <a href={SURVEY_URL} target="_blank" rel="noopener noreferrer">Open survey in a new tab</a>
      {surveyOpen && <iframe title="Mapped Brain feedback survey" src={`${SURVEY_URL}?embedded=true`} />}
    </dialog>
  </>, document.body);
}

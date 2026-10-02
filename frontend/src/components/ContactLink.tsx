import React, { useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import './ContactLink.css';

// Replace this placeholder with the project's public contact address.
const CONTACT_EMAIL = 'hello@example.com';

const SUBJECTS = ['Give feedback', 'Report an issue', 'Careers / join the team', 'Business / partnership'];

const ContactLink: React.FC = () => {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  const prepareEmail = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const fields = new FormData(event.currentTarget);
    const subject = `MAPPED — ${fields.get('subject')}`;
    const body = `Name: ${fields.get('name') || 'Not provided'}\nReply email: ${fields.get('email') || 'Not provided'}\n\n${fields.get('message')}`;

    // No delivery service is configured yet: prepare a draft rather than claiming
    // the message was sent. Encode user input so it cannot alter mailto parameters.
    window.location.href = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  return (
    <div className="mapped-contact">
      <button type="button" className="mapped-contact-button" onClick={() => dialogRef.current?.showModal()}>Contact</button>
      <span className="mapped-contact-email">{CONTACT_EMAIL}</span>
      {/* A native modal handles keyboard focus and Escape. The portal keeps it
          outside the app's clipped panels and the homepage's fixed layout. */}
      {createPortal(
        <dialog ref={dialogRef} className="mapped-contact-dialog" aria-labelledby={titleId}>
          <div className="mapped-contact-heading">
            <h2 id={titleId}>Get in touch</h2>
            <button type="button" className="mapped-contact-close" aria-label="Close contact form" onClick={() => dialogRef.current?.close()}>×</button>
          </div>
          <p>Share feedback, report a problem, or connect with the MAPPED team.</p>
          <form onSubmit={prepareEmail}>
            <label>Subject<select name="subject">{SUBJECTS.map(subject => <option key={subject}>{subject}</option>)}</select></label>
            <label>Name (optional)<input name="name" autoComplete="name" maxLength={100} /></label>
            <label>Reply email (optional)<input name="email" type="email" autoComplete="email" maxLength={254} /></label>
            <label>Message<textarea name="message" required maxLength={2000} rows={5} placeholder="What would you like us to know? For an issue, include what happened and how to reproduce it." /></label>
            <p className="mapped-contact-note">This opens a draft in your email app; you send it from there. The contact address is currently a placeholder: {CONTACT_EMAIL}.</p>
            <button className="mapped-contact-button" type="submit">Prepare email</button>
          </form>
        </dialog>, document.body
      )}
    </div>
  );
};

export default ContactLink;

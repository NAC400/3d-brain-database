import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import FeedbackSurvey from './components/FeedbackSurvey';
import AnalyticsConsent from './components/AnalyticsConsent';
import reportWebVitals from './reportWebVitals';
import { initAnalytics } from './lib/analytics';

initAnalytics();

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <React.StrictMode>
    <App />
    <FeedbackSurvey />
    <AnalyticsConsent />
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();

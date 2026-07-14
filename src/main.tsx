import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./styles.css";
import { readCookieConsent } from "./lib/cookieConsent";
import { initializeConsentMode } from "./lib/consentMode";
import { initializeGoogleTagManager } from "./lib/googleTagManager";

initializeConsentMode(readCookieConsent());
initializeGoogleTagManager();

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

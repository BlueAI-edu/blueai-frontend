import React from "react";
import ReactDOM from "react-dom/client";
import "@/index.css";
import App from "@/App";
import { MsalProvider } from '@azure/msal-react';
import { msalInstance } from './msalConfig';

// Expose MSAL instance globally for the login handler
window.msalInstance = { instance: msalInstance };

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <MsalProvider instance={msalInstance}>
      <App />
    </MsalProvider>
  </React.StrictMode>,
);

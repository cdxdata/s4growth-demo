import React from "react";
import ReactDOM from "react-dom/client";
import { App } from "@/App";
import { AppProviders } from "@/app/providers";
import { bindSubmissionsPersistLifecycle } from "@/lib/submissionsPersist";
import "@/styles/index.css";

bindSubmissionsPersistLifecycle();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AppProviders>
      <App />
    </AppProviders>
  </React.StrictMode>,
);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AppProviders>
      <App />
    </AppProviders>
  </React.StrictMode>,
);

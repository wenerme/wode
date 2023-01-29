import React from 'react';
import ReactDOM from 'react-dom/client';
import 'common/src/styles/globals.css';
import { ModuleApp } from './components/ModuleApp';

ReactDOM.createRoot(document.getElementById('__next') as HTMLElement).render(
  <React.StrictMode>
    <ModuleApp />
  </React.StrictMode>,
);

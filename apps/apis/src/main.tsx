import React from 'react';
import ReactDOM from 'react-dom/client';
import 'common/src/styles/globals.css';
import { RootApp } from './components/RootApp';

ReactDOM.createRoot(document.getElementById('__next') as HTMLElement).render(
  <React.StrictMode>
    <RootApp />
  </React.StrictMode>,
);

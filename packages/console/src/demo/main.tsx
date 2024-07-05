import React from 'react';
import ReactDOM from 'react-dom/client';
import './globals.css';
import { UpdateNotification } from '@/web';
import { WebVitals } from '@/web/components/WebVitals';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <UpdateNotification
      getVersion={async () => {
        // yyyy-MM-dd
        return new Date().toISOString().substring(0, 10);
      }}
    />
    <WebVitals />
  </React.StrictMode>,
);

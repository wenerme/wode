import React from 'react';
import ReactDOM from 'react-dom/client';
import '@wener/console/console/globals.css';
import { ConsoleApp } from '@/demo/ConsoleApp';
import { UpdateNotification } from '@/web';
import { WebVitals } from '@/web/components/WebVitals';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ConsoleApp />
    <UpdateNotification
      getVersion={async () => {
        // yyyy-MM-dd
        return new Date().toISOString().substring(0, 10);
      }}
    />
    <WebVitals />
  </React.StrictMode>,
);

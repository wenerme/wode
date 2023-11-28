import { ReactNode } from 'react';

export interface SitePreferences {
  site: {
    title: string;
    logo: ReactNode;
    author: {
      name: string;
      link: string;
    };
  };
}

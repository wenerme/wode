import { DynamicModule, SitePreferences } from '@wener/console/console';
import { WenerLogo } from './WenerLogo';

export default {
  onModuleInit: (ctx) => {
    ctx.as<SitePreferences>().set(
      'site',
      {
        title: '控制台',
        logo: <WenerLogo />,
        author: {
          name: 'Wener',
          link: 'https://wener.me',
        },
      },
      { merge: true },
    );
  },
} satisfies DynamicModule;

import { type PropsWithChildren } from 'react';
import { I18nClientProvider } from '@/i18n/LinguiClientProvider';
import { I18N } from './I18N';

export async function Provider({ children }: PropsWithChildren) {
  const { i18n } = await I18N.load();
  return (
    <I18nClientProvider
      initial={{
        locale: i18n.locale,
        messages: {
          [i18n.locale]: i18n.messages,
        },
      }}
    >
      {children}
    </I18nClientProvider>
  );
  // const { i18n } = getI18nStore().getState();
  // const [ready, setReady] = useState(false);
  // useAsyncEffect(async () => {
  //   await I18N.load();
  //   setReady(true);
  // }, []);
  //
  // if (!ready) {
  //   return null;
  // }
  //
  // return <I18nProvider i18n={i18n}>{children}</I18nProvider>;
}

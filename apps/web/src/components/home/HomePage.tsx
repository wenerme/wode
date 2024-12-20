import type React from 'react';
import type { ReactNode } from 'react';
import { Trans } from '@lingui/macro';
import { useLingui } from '@lingui/react';
import { cn } from '@wener/console';
import { flexRender } from '@wener/reaction/universal';
import Link from 'next/link';
import { getHomeEntryItems } from '@/data/const';
import { getEntryTags } from '@/data/defineEntry';
import { FootNoteLink } from '../FootNoteLink';

export const HomePage: React.FC<{ tags?: string[] }> = ({ tags = [] }) => {
  let all = getHomeEntryItems();
  if (tags.length) {
    all = all.filter((v) => {
      return tags.every((tag) => v.tags.includes(tag));
    });
  }
  return (
    <>
      <Hero />

      <div className={'container mx-auto py-8'}>
        <header className={'pb-4'}>
          <h3 className={'py-2 text-2xl'}>
            <Trans comment={'Entrypoint'} id={'home.entrypoint.title'}>
              入口
            </Trans>
          </h3>
          <div className={'flex gap-2'}>
            <Link
              href={{
                query: { tags: null },
              }}
              className={cn('badge', !tags.length && 'badge-primary')}
            >
              <Trans id={'home.tag.all'}>所有</Trans>
            </Link>
            {getEntryTags().map(({ name, title, icon }) => {
              const active = tags.includes(name);
              let next = active ? tags.filter((v) => v !== name) : [name];
              return (
                <Link
                  key={name}
                  href={{
                    query: { tags: next?.length ? next : null },
                  }}
                  className={cn('badge', active && 'badge-primary')}
                >
                  {flexRender(
                    icon,
                    {
                      className: cn('size-4'),
                    },
                    true,
                  )}{' '}
                  {title}
                </Link>
              );
            })}
          </div>
        </header>
        <ModuleListCard items={all} />
      </div>
    </>
  );
};

const ModuleListCard: React.FC<{
  items: Array<{ icon: ReactNode; title: ReactNode; href: string }>;
  figure?: ReactNode;
  action?: ReactNode;
  title?: ReactNode;
}> = ({ items, title, figure, action }) => {
  return (
    <div className='card card-side border bg-base-100 shadow-xl'>
      {figure && <figure>{figure}</figure>}
      <div className='card-body'>
        {title && <h2 className='card-title'>{title}</h2>}
        <div className={'flex flex-wrap gap-6 py-2'}>
          {items.map(({ title, icon, href }) => {
            return (
              <Link className='group relative inline-block focus:outline-none focus:ring' key={href} href={href}>
                <span className='absolute inset-0 translate-x-1.5 translate-y-1.5 bg-blue-300 transition-transform group-hover:translate-x-0 group-hover:translate-y-0'></span>

                <div className='relative inline-block border-2 border-current px-8 py-3 text-sm font-bold uppercase tracking-widest text-black group-active:text-opacity-75'>
                  {flexRender(
                    icon,
                    {
                      className: 'size-20',
                    },
                    true,
                  )}
                  <span className={'normal-case'}>{title}</span>
                </div>
              </Link>
            );
          })}
        </div>
        {action && <div className='card-actions justify-end'>{action}</div>}
      </div>
    </div>
  );
};

const Hero = () => {
  let { i18n } = useLingui();
  return (
    <div className='hero min-h-96 flex-1 bg-base-200'>
      <div className='hero-content text-center'>
        <div className='max-w-md'>
          <h1 className='text-5xl font-bold'>Wener APIs</h1>
          <p className='py-6'>
            <Trans id={'home.hero.intro'}>
              我喜欢编写代码和探索新技术。这是
              <a
                target={'_blank'}
                rel={'noreferrer noopener'}
                href='https://github.com/wenerme/wode'
                className={'link'}
              >
                wenerme/wode
              </a>
              的游乐场。
            </Trans>
          </p>
          <FootNoteLink href={'https://wener.me'} className='btn btn-primary px-4'>
            <Trans id={'home.hero.more'}>了解更多</Trans>
          </FootNoteLink>
        </div>
      </div>
    </div>
  );
};

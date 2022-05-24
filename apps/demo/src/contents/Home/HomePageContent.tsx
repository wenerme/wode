import { NavLinks } from '@src/components/page/const';
import { MaybeLink } from '@src/components/MaybeLink';

export const HomePageContent = () => {
  return (
    <div className={'container mx-auto flex flex-col'}>
      <div className={'inline-flex gap-12 self-center pt-12'}>
        {NavLinks.map((v, i) => (
          <div key={i}>
            <MaybeLink href={v.href} className={'font-semibold text-2xl'}>
              {v.label}
            </MaybeLink>
            {Boolean(v.children?.length) && (
              <div className={'flex flex-col gap-2 text-lg'}>
                {v.children.map((vv, i) => (
                  <MaybeLink className={'hover:text-primary'} href={vv.href}>
                    {vv.label}
                  </MaybeLink>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

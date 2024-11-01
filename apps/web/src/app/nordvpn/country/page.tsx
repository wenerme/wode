import { PiHardDrive } from 'react-icons/pi';
import type { NextPageProps } from '@wener/reaction/next';
import { NordVPNActions } from '../data';

export default async function (props: NextPageProps) {
  const all = await NordVPNActions.listCountry();
  return (
    <div>
      <div className={'flex flex-col'}>
        {all.map((item) => {
          const { id, name, code, serverCount, cities } = item;

          return (
            <div key={id} className={'border-b p-2'}>
              <div className={'flex gap-2 text-lg font-medium'}>
                <span>{name}</span>
                {serverCount !== 1 && (
                  <span className={'flex items-center gap-1 text-sm text-info'}>
                    <PiHardDrive />
                    {serverCount}
                  </span>
                )}
              </div>
              <div className={'flex gap-2 text-sm opacity-50'}>
                <span>#{id}</span>
                <span>{code}</span>
              </div>

              <div className={'flex flex-col gap-2'}>
                {cities.map((city) => {
                  const { id, name, dns_name, serverCount, hub_score } = city;
                  return (
                    <div key={id} className={'flex items-center gap-2 border-t py-2 pl-5'}>
                      {serverCount !== 1 && <span>{serverCount}</span>}
                      {name} <small>DNS: {dns_name}</small> {hub_score !== 0 && <span>Score: {hub_score}</span>}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

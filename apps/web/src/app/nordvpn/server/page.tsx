import { NordVPNActions } from '@/app/nordvpn/data';

export default async function () {
  let all = await NordVPNActions.listServer();

  let sortBy = 'name' as const;
  all = all.toSorted((a, b) => {
    if (a[sortBy] > b[sortBy]) return 1;
    if (a[sortBy] < b[sortBy]) return -1;
    return 0;
  });
  return (
    <div>
      <header className={'border-b p-2'}>Total: {all.length}</header>
      <div className={'flex flex-col'}>
        {all.map((item) => {
          const { id, name, load, hostname, station, ipv6_station, ips, technologies, services } = item;
          return (
            <div key={id} className={'border-b p-2'}>
              <div className={'flex gap-2'}>
                <span>{name}</span>
                <small>
                  Load: <span className={'text-info'}>{load}</span>
                </small>
              </div>
              <div className={'flex gap-2'}>
                {technologies.map((v) => {
                  return <div key={v.identifier}>{v.identifier}</div>;
                })}
                {services.map((v) => {
                  return <div key={v.identifier}>{v.identifier}</div>;
                })}
              </div>
              <div className={'flex gap-2 text-sm opacity-50'}>
                <span>#{id}</span>
                <span>Hostname: {hostname}</span>
                <span>
                  Station: {station} {ipv6_station && <span>IPv6: {ipv6_station}</span>}
                </span>
                {ips?.length && ips[0]?.ip.ip !== station && (
                  <span>
                    IPs:{' '}
                    {ips.map((v) => {
                      return <span>{v.ip.ip}</span>;
                    })}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

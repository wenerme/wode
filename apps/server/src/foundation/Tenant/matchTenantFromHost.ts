export function matchTenantFromHost(host: string | undefined) {
  host = host?.split(':').at(0);
  if (!host) {
    return undefined;
  }

  if (host.startsWith('127.') || host === 'localhost') {
    return {
      local: true,
    };
  }

  const hosts = ['wener.me'];

  for (const base of hosts) {
    if (host === base) {
      return {
        domain: base,
        root: true,
      };
    }

    if (host.endsWith(`.${base}`)) {
      const tenant = host.slice(0, -`.${base}`.length);
      switch (tenant) {
        case 'apis':
        case 'api':
        case 'file':
        case 'files': {
          return {
            api: true,
          };
        }
      }

      return {
        tenant: true,
        base,
        domain: host,
        name: tenant,
      };
    }
  }

  return {
    tenant: true,
    domain: host,
  };
}

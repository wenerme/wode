import { cache } from 'react';

export const getNordVPNCountry = cache(() => fetch('https://api.nordvpn.com/v1/servers/countries'));

export namespace NordVPNActions {
  export const listCountry: () => Promise<Country[]> = cache(() =>
    fetch('https://api.nordvpn.com/v1/servers/countries', {
      cache: 'force-cache',
      next: {
        revalidate: Infinity,
      },
    }).then((v) => v.json()),
  );

  export const listServer: () => Promise<Server[]> = cache(() =>
    fetch('https://api.nordvpn.com/v1/servers?limit=9999999', {
      cache: 'force-cache',
      next: {
        revalidate: 10 * 60 * 1000, // 10min
      },
    }).then((v) => v.json()),
  );
}

interface Country {
  id: number;
  name: string;
  code: string;
  serverCount: number;
  cities: CountryCity[];
}

interface CountryCity {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  dns_name: string;
  hub_score: number;
  serverCount: number;
}

interface Server {
  id: number;
  created_at: string;
  updated_at: string;
  name: string;
  station: string;
  ipv6_station: string;
  hostname: string;
  load: number;
  status: string;
  locations: Location[];
  services: Service[];
  technologies: Technology[];
  groups: Group[];
  specifications: Specification[];
  ips: Ip[];
}

interface Location {
  id: number;
  created_at: string;
  updated_at: string;
  latitude: number;
  longitude: number;
  country: LocationCountry;
}

interface LocationCountry {
  id: number;
  name: string;
  code: string;
  city: LocationCountryCity;
}

interface LocationCountryCity {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  dns_name: string;
  hub_score: number;
}

export interface Service {
  id: number;
  name: string;
  identifier: string;
  created_at: string;
  updated_at: string;
}

export interface Technology {
  id: number;
  name: string;
  identifier: string;
  created_at: string;
  updated_at: string;
  metadata: Metadaum[];
  pivot: Pivot;
}

interface Metadaum {
  name: string;
  value: string;
}

interface Pivot {
  technology_id: number;
  server_id: number;
  status: string;
}

interface Group {
  id: number;
  created_at: string;
  updated_at: string;
  title: string;
  identifier: string;
  type: Type;
}

interface Type {
  id: number;
  created_at: string;
  updated_at: string;
  title: string;
  identifier: string;
}

interface Specification {
  id: number;
  title: string;
  identifier: string;
  values: Value[];
}

interface Value {
  id: number;
  value: string;
}

interface Ip {
  id: number;
  created_at: string;
  updated_at: string;
  server_id: number;
  ip_id: number;
  type: string;
  ip: Ip2;
}

interface Ip2 {
  id: number;
  ip: string;
  version: number;
}

export interface ServerCountry {
  id: number;
  name: string;
  code: string;
  serverCount: number;
  cities: ServerCountryCity[];
}

export interface ServerCountryCity extends City {
  serverCount: number;
}

export interface Server {
  id: number
  created_at: string
  updated_at: string
  name: string
  station: string
  ipv6_station: string
  hostname: string
  load: number
  status: string
  type: string
  locations: Location[]
  services: Service[]
  technologies: Technology[]
  groups: Group[]
  specifications: Specification[]
  ips: Ip[]
}

export interface Location {
  id: number;
  created_at: string;
  updated_at: string;
  latitude: number;
  longitude: number;
  country: Country;
}

export interface Country {
  id: number;
  name: string;
  code: string;
  city: City;
}

export interface City {
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
  metadata: NameValuePair[];
  pivot: Pivot;
}

export interface NameValuePair {
  name: string;
  value: string;
}

export interface Pivot {
  technology_id: number;
  server_id: number;
  status: string;
}

export interface Group {
  id: number;
  created_at: string;
  updated_at: string;
  title: string;
  identifier: string;
  type: GroupType;
}

export interface GroupType {
  id: number;
  created_at: string;
  updated_at: string;
  title: string;
  identifier: string;
}

export interface Specification {
  id: number;
  title: string;
  identifier: string;
  values: SpecificationValue[];
}

export interface SpecificationValue {
  id: number;
  value: string;
}

export interface Ip {
  id: number;
  created_at: string;
  updated_at: string;
  server_id: number;
  ip_id: number;
  type: string;
  ip: IpAddress;
}

export interface IpAddress {
  id: number;
  ip: string;
  version: number;
}

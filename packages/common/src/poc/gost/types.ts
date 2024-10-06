// https://gost.run/en/reference/configuration/file/

export interface GostConfig {
  services: Service[];
  chains: Chain[];
  authers: Auther[];
  admissions: Admission[];
  bypasses: Bypass[];
  resolvers: Resolver[];
  hosts: Host[];
  tls: Tls;
  log: Log;
  profiling: Profiling;
  api: Api;
  metrics: Metrics;
}

export interface Service {
  name: string;
  addr: string;
  interface: string;
  admission: string;
  bypass: string;
  resolver: string;
  hosts: string;
  handler: Handler;
  listener: Listener;
  forwarder: Forwarder;
}

export interface Handler {
  type: string;
  auth: Auth;
  auther: string;
  retries: number;
  chain: string;
  metadata: Metadata;
}

export interface Auth {
  username?: string;
  password?: string;
}

export interface Listener {
  type: string;
  auth: Auth;
  auther: string;
  chain: string;
  tls: Tls;
  metadata: Metadata;
}

export interface Tls {
  certFile: string;
  keyFile: string;
  caFile: string;
}

export interface Forwarder {
  nodes: Node[];
  selector: Selector;
}

export interface Node {
  name: string;
  addr: string;
}

export interface Selector {
  strategy: string;
  maxFails: number;
  failTimeout: number;
}

export interface Chain {
  name: string;
  selector: Selector;
  hops: Hop[];
}

export interface Hop {
  name: string;
  interface: string;
  selector: Selector;
  bypass: string;
  nodes: HopNode[];
}

export interface HopNode {
  name: string;
  addr: string;
  interface: string;
  bypass: string;
  connector?: Connector;
  dialer: Dialer;
}

export interface Connector {
  type: string;
  auth?: Auth;
  metadata: Metadata;
}

export interface Dialer {
  type: string;
  auth: Auth;
  tls: DialerTls;
  metadata: Metadata;
}

export interface DialerTls {
  caFile: string;
  secure: boolean;
  serverName: string;
}

export type Metadata = Record<string, any>;

export interface Auther {
  name: string;
  auths: Auth[];
}

export interface Admission {
  name: string;
  whitelist: boolean;
  matchers: string[];
}

export interface Bypass {
  name: string;
  whitelist: boolean;
  matchers: string[];
}

export interface Resolver {
  name: string;
  nameservers: Nameserver[];
}

export interface Nameserver {
  addr: string;
  chain?: string;
  prefer?: string;
  clientIP?: string;
  ttl?: number;
  timeout?: number;
  hostname?: string;
}

export interface Host {
  name: string;
  mappings: Mapping[];
}

export interface Mapping {
  ip: string;
  hostname: string;
  aliases?: string[];
}

export interface Log {
  output: string;
  level: string;
  format: string;
  rotation: Rotation;
}

export interface Rotation {
  maxSize: number;
  maxAge: number;
  maxBackups: number;
  localTime: boolean;
  compress: boolean;
}

export interface Profiling {
  addr: string;
  enabled: boolean;
}

export interface Api {
  addr: string;
  pathPrefix: string;
  accesslog: boolean;
  auth: Auth;
  auther: string;
}

export interface Metrics {
  addr: string;
  path: string;
}

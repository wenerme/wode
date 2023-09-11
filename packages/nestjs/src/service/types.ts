export interface KnownServiceMessageHeaders {
  'x-request-id'?: string;
  'x-instance-id'?: string;
  'x-tenant-id'?: string;
  'x-user-id'?: string;
  'x-session-id'?: string;
  'x-timestamp'?: string;
}

// export interface ServiceLocation {
//   namespace?: string;
//   service?: string;
//   method?: string;
//   version?: string;
//   instance?: string;
// }

// export interface ServiceMethodSchema {
//   name: string;
//   input?: any;
//   output?: any;
//   metadata?: Record<string, any>;
// }
//
// export interface ServiceSchema {
//   name: string;
//   methods: ServiceMethodSchema[];
//   metadata?: Record<string, any>;
// }

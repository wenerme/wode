export interface KnownServiceMessageHeaders {
  'x-request-id'?: string;
  'x-instance-id'?: string;
  'x-tenant-id'?: string;
  'x-user-id'?: string;
  'x-session-id'?: string;
  'x-client-id'?: string;
  // 'x-client-send-at'?: string;
  // 'x-client-recv-at'?: string;
  // 'x-server-send-at'?: string;
  // 'x-server-recv-at'?: string;
  // 'x-execution-time'?: string;
  // 'x-target-instance-id'?: string;
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

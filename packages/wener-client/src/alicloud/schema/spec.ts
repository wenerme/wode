export interface ApiDoc {
  version: string;
  info: Info;
  directories: Directory[];
  components: Components;
  apis: Record<string, ApiEntry>;
}

export interface Info {
  style: string;
  product: string;
  version: string;
}

export interface Directory {
  id: number;
  title: string;
  type: string;
  children: string[];
}

export interface Components {
  schemas: Schemas;
}

export interface Schemas {}

export interface ApiEntry {
  summary: string;
  methods: Array<'get' | 'post'>;
  schemes: Array<'http' | 'https'>;
  security: Security[];
  operationType: 'read' | 'readAndWrite';
  deprecated: boolean;
  parameters: Parameter[];
  responses: Responses;
  staticInfo: StaticInfo;
  responseDemo: string;
  title: string;
  description: string;
  responseParamsDescription: string;
  extraInfo: string;
}

export interface Security {
  AK: any[];
}

export interface Parameter {
  name: string;
  in: 'query' | 'body';
  schema: TypeSchema;
}

export interface TypeSchema {
  title: string;
  description: string;
  type: string;
  required: boolean;
  example: string;
  maxLength?: number;
  format?: string;
  items?: TypeSchema;
  properties?: Record<string, TypeSchema>;
}

export interface Responses {
  '200': N200;
}

export interface N200 {
  schema: TypeSchema;
}

export interface Schema2 {
  title: string;
  description: string;
  type: string;
  properties: Record<string, Schema2>;
}

export interface Properties {
  RequestId: RequestId;
  Data: Data;
  Code: Code;
  Message: Message;
}

export interface RequestId {
  title: string;
  description: string;
  type: string;
  example: string;
}

export interface Data {
  title: string;
  description: string;
  type: string;
  example: string;
}

export interface Code {
  title: string;
  description: string;
  type: string;
  example: string;
}

export interface Message {
  title: string;
  description: string;
  type: string;
  example: string;
}

export interface StaticInfo {}

export interface ErrorCodes4 {
  '503': N5032[];
}

export interface N5032 {
  errorCode: string;
  errorMessage: string;
}

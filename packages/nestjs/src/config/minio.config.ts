import process from 'node:process';
import { parseBoolean } from '@wener/utils';
import { z } from 'zod';

export const MinioConfig = z.object({
  endpoint: z.coerce.string().nonempty(),
  port: z.coerce.number().optional(),
  useSsl: z.coerce.boolean().optional(),
  bucket: z.coerce.string().optional(),
  accessKey: z.coerce.string(),
  secretKey: z.coerce.string(),
});
export type MinioConfig = z.infer<typeof MinioConfig>;

export function getMinioConfig(env = process.env) {
  let { S3_ENDPOINT, S3_PORT, S3_USE_SSL, S3_BUCKET, S3_ACCESS_KEY, S3_SECRET_KEY } = env;
  if (/^https?:/.test(S3_ENDPOINT || '')) {
    const u = new URL(S3_ENDPOINT || '');
    S3_ENDPOINT = u.hostname;
    S3_PORT ||= u.port || (u.protocol === 'https:' ? '443' : '80');
    S3_USE_SSL ||= String(u.protocol === 'https:');
    S3_ACCESS_KEY ||= u.username;
    S3_SECRET_KEY ||= u.password;
  }

  return MinioConfig.parse({
    endpoint: S3_ENDPOINT,
    port: S3_PORT,
    useSsl: parseBoolean(S3_USE_SSL),
    bucket: S3_BUCKET,
    accessKey: S3_ACCESS_KEY,
    secretKey: S3_SECRET_KEY,
  });
}

export function getMinioOptions() {
  const { endpoint, useSsl, port, accessKey, secretKey } = getMinioConfig();
  return {
    endPoint: endpoint,
    port,
    useSSL: useSsl,
    accessKey,
    secretKey,
  };
}

/*
export interface ClientOptions {
  endPoint: string
  accessKey: string
  secretKey: string
  useSSL?: boolean
  port?: number
  region?: Region
  transport?: Transport
  sessionToken?: string
  partSize?: number
  pathStyle?: boolean
  credentialsProvider?: CredentialProvider
  s3AccelerateEndpoint?: string
  transportAgent?: http.Agent
}
 */

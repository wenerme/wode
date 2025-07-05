import type { Readable, Writable } from 'node:stream';
import { type ContractRouterClient, oc } from '@orpc/contract';
import { z } from 'zod/v4';
import type {
  CopyOptions,
  CreateReadStreamOptions,
  CreateWriteStreamOptions,
  IFileSystem,
  MkdirOptions,
  ReaddirOptions,
  ReadFileOptions,
  RenameOptions,
  RmOptions,
  StatOptions,
  WriteFileOptions,
} from './IFileSystem';
import { FileKindSchema } from './types';

export type FileStat = z.infer<typeof FileStatSchema>;
export const FileStatSchema = z.object({
  directory: z.string(),
  path: z.string(),
  name: z.string(),
  kind: FileKindSchema,
  mtime: z.coerce.date(),
  size: z.coerce.number().nonnegative().default(0),
  meta: z.record(z.string(), z.any()),
});
export type ReadDirectoryInput = z.infer<typeof ReadDirectoryInputSchema>;
export const ReadDirectoryInputSchema = z.object({
  dir: z.string().nonempty(),
  glob: z.string().optional(),
  recursive: z.boolean().default(false),
  depth: z.number().min(0).optional(),
  kind: FileKindSchema.optional(),
  cursor: z.string().optional(),
  hidden: z.boolean().default(false),
});
const ReaddirOutputSchema = z.object({
  data: FileStatSchema.array(),
});
const StatInputSchema = z.object({
  path: z.string(),
});
const StatOutputSchema = z.object({
  data: FileStatSchema,
});
const CreateDirectoryInputSchema = z.object({
  path: z.string(),
  recursive: z.boolean().nullish(),
});
const CreateDirectoryOutputSchema = z.object({}).default({});
const RenameInputSchema = z.object({
  oldPath: z.string(),
  newPath: z.string(),
  overwrite: z.boolean().nullish(),
});
const RenameOutputSchema = z.object({}).default({});
const ExistsInputSchema = z.object({
  path: z.string(),
});
const ExistsOutputSchema = z.object({
  data: z.boolean(),
});
const CopyInputSchema = z.object({
  src: z.string(),
  dest: z.string(),
  overwrite: z.boolean().nullish(),
  shallow: z.boolean().nullish(),
});
const CopyOutputSchema = z.object({}).default({});
const ReadFileInputSchema = z.object({
  path: z.string(),
});
const ReadFileOutputSchema = z.object({
  data: z.any(),
});
const WriteFileInputSchema = z.object({
  path: z.string(),
  data: z.any(),
});
const WriteFileOutputSchema = z.object({});
const RemoveInputSchema = z.object({
  path: z.string(),
  recursive: z.boolean().nullish(),
});
const RemoveOutputSchema = z.object({}).default({});
export const FileSystemContract = {
  readdir: oc.input(ReadDirectoryInputSchema).output(ReaddirOutputSchema),
  stat: oc.input(StatInputSchema).output(StatOutputSchema),
  mkdir: oc.input(CreateDirectoryInputSchema).output(CreateDirectoryOutputSchema),
  readFile: oc.input(ReadFileInputSchema).output(ReadFileOutputSchema),
  writeFile: oc.input(WriteFileInputSchema).output(WriteFileOutputSchema),
  rename: oc.input(RenameInputSchema).output(RenameOutputSchema),
  exists: oc.input(ExistsInputSchema).output(ExistsOutputSchema),
  copy: oc.input(CopyInputSchema).output(CopyOutputSchema),
  rm: oc.input(RemoveInputSchema).output(RemoveOutputSchema),
};

type Client = ContractRouterClient<typeof FileSystemContract>;

export function createContractClientFileSystem(client: Client): IFileSystem & {
  client: Client;
} {
  return new ContractFS(client);
}

class ContractFS implements IFileSystem {
  client: Client;

  constructor(client: Client) {
    this.client = client;
  }

  async readdir(dir: string, options: ReaddirOptions = {}) {
    const { data } = await this.client.readdir({ dir, ...options });
    return data.map((stat) => ({
      ...stat,
      mtime: stat.mtime.getTime(),
    }));
  }

  async stat(entry: string, options?: StatOptions) {
    const { data } = await this.client.stat({ path: entry });
    return {
      ...data,
      mtime: data.mtime.getTime(),
    };
  }

  async mkdir(path: string, options?: MkdirOptions) {
    await this.client.mkdir({
      path,
      recursive: options?.recursive,
    });
  }

  async readFile(path: string, options?: ReadFileOptions) {
    // Note: The contract doesn't currently support encoding options.
    const { data } = await this.client.readFile({ path });
    return data;
  }

  async writeFile(path: string, data: any, options?: WriteFileOptions) {
    await this.client.writeFile({ path, data, ...options });
  }

  async rename(oldPath: string, newPath: string, options?: RenameOptions) {
    await this.client.rename({
      oldPath,
      newPath,
      overwrite: options?.overwrite,
    });
  }

  async exists(path: string) {
    const { data } = await this.client.exists({ path });
    return data;
  }

  async copy(src: string, dest: string, options?: CopyOptions) {
    await this.client.copy({
      src,
      dest,
      overwrite: options?.overwrite,
      shallow: options?.shallow,
    });
  }

  async rm(path: string, options?: RmOptions) {
    await this.client.rm({
      path,
      recursive: options?.recursive,
    });
  }

  createReadStream(path: string, options?: CreateReadStreamOptions): Readable {
    throw new Error('createReadStream is not implemented in ContractFS');
  }

  createWriteStream(path: string, options?: CreateWriteStreamOptions): Writable {
    throw new Error('createWriteStream is not implemented in ContractFS');
  }
}

import { randomUUID } from 'node:crypto';
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { LabError } from '../errors.js';
import type { StoredFile } from '../types.js';
import { inspectImage } from '../validation/images.js';

export class FileStore {
  private readonly files = new Map<string, StoredFile>();
  private readonly bytes = new Map<string, Buffer>();

  constructor(private readonly directory: string) {}

  async init(): Promise<void> {
    await mkdir(this.directory, { recursive: true });
  }

  async save(contents: Buffer): Promise<StoredFile> {
    const facts = inspectImage(contents);
    const id = randomUUID();
    const record: StoredFile = { id, createdAt: new Date().toISOString(), ...facts };
    await mkdir(this.directory, { recursive: true });
    await writeFile(this.pathFor(id), contents);
    this.files.set(id, record);
    this.bytes.set(id, contents);
    return record;
  }

  get(id: string): StoredFile | undefined {
    return this.files.get(id);
  }

  async read(id: string): Promise<Buffer> {
    const cached = this.bytes.get(id);
    if (cached) return cached;
    const record = this.files.get(id);
    if (!record) throw new LabError('missing_file', 'That image is no longer stored.', 404);
    const contents = await readFile(this.pathFor(id));
    this.bytes.set(id, contents);
    return contents;
  }

  async delete(id: string): Promise<void> {
    this.files.delete(id);
    this.bytes.delete(id);
    await rm(this.pathFor(id), { force: true });
  }

  private pathFor(id: string): string {
    if (!/^[0-9a-f-]{36}$/i.test(id)) {
      throw new LabError('missing_file', 'The image id is not valid.', 400);
    }
    return path.join(this.directory, `${id}.img`);
  }
}

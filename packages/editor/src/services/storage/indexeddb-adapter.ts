import type { StorageAdapter } from "./types";
/** Each operation closes its connection and waits for transaction commit, including writes. */
export class IndexedDBAdapter<T> implements StorageAdapter<T> {
  constructor(
    private options: { dbName: string; storeName: string; version?: number },
  ) {}
  private async run<R>(
    mode: IDBTransactionMode,
    operation: (store: IDBObjectStore) => IDBRequest<R>,
  ): Promise<R> {
    const { dbName, storeName, version = 1 } = this.options;
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      let abandoned=false;
      const open = indexedDB.open(dbName, version);
      open.onupgradeneeded = () => {
        if (!open.result.objectStoreNames.contains(storeName))
          open.result.createObjectStore(storeName, { keyPath: "id" });
      };
      open.onerror = () => reject(open.error);
      open.onblocked = () => {abandoned=true;reject(new Error(`Storage ${dbName} is blocked by another tab`));};
      open.onsuccess = () => {if(abandoned)open.result.close();else resolve(open.result);};
    });
    try {
      return await new Promise<R>((resolve, reject) => {
        const tx = db.transaction(storeName, mode);
        let result: R;
        tx.oncomplete = () => resolve(result);
        tx.onerror = () => reject(tx.error);
        tx.onabort = () =>
          reject(tx.error || new Error("Storage transaction aborted"));
        const request = operation(tx.objectStore(storeName));
        request.onsuccess = () => {
          result = request.result;
        };
        request.onerror = () => reject(request.error);
      });
    } finally {
      db.close();
    }
  }
  async get(key: string): Promise<T | null> {
    const record = await this.run<{ id: string; value: T } | undefined>(
      "readonly",
      (s) => s.get(key),
    );
    return record?.value ?? null;
  }
  async set({ key, value }: { key: string; value: T }) {
    await this.run("readwrite", (s) => s.put({ id: key, value }));
  }
  async remove(key: string) {
    await this.run("readwrite", (s) => s.delete(key));
  }
  async list() {
    return (await this.run("readonly", (s) => s.getAllKeys())).map(String);
  }
  async clear() {
    await this.run("readwrite", (s) => s.clear());
  }
  async getAll(): Promise<T[]> {
    return (
      await this.run<Array<{ id: string; value: T }>>("readonly", (s) =>
        s.getAll(),
      )
    ).map((row) => row.value);
  }
}

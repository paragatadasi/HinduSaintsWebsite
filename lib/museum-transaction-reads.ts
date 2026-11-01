// Opt in only for read models that a transaction does not change itself.
const scopes = new WeakMap<object, Map<string, Promise<unknown>>>();

export async function withMuseumTransactionReads<T>(transaction: object, work: () => Promise<T>): Promise<T> {
  if (scopes.has(transaction)) return work();
  scopes.set(transaction, new Map());
  try { return await work(); }
  finally { scopes.delete(transaction); }
}

export function readInMuseumTransaction<T>(transaction: object, key: string, load: () => Promise<T>): Promise<T> {
  const scope = scopes.get(transaction);
  if (!scope) return load();
  let result = scope.get(key);
  if (!result) {
    result = load();
    scope.set(key, result);
  }
  return result as Promise<T>;
}

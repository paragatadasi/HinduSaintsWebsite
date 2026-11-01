type Entry = { value?: unknown; etag?: string; expires: number; generation: number; pending?: Promise<unknown> };

/** Page-scoped read cache. Mutations always use their own uncached requests. */
export function createMuseumReadCache(fetcher: typeof fetch = fetch, now = Date.now) {
  const entries = new Map<string, Entry>();
  function invalidate(prefix = "") {
    for (const [url, entry] of entries) if (url.startsWith(prefix)) {
      entry.expires = 0;
      entry.generation++;
    }
  }
  function read<T>(url: string, force = false): Promise<T> {
    let entry = entries.get(url);
    if (!entry) { entry = { expires: 0, generation: 0 }; entries.set(url, entry); }
    if (entry.pending) return entry.pending as Promise<T>;
    if (!force && entry.value !== undefined && entry.expires > now()) return Promise.resolve(entry.value as T);
    const current = entry;
    const request = (async () => {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 20000);
      try {
        // A write during a read invalidates its result for every subscriber.
        for (;;) {
          const generation = current.generation;
          const response = await fetcher(url, { cache: "no-store", signal: controller.signal,
            headers: current.etag ? { "If-None-Match": current.etag } : {} });
          let value: unknown;
          if (response.status === 304 && current.value !== undefined) value = current.value;
          else {
            const body = await response.json();
            if (!response.ok) throw new Error(body.error || "Could not refresh museum data.");
            value = body;
          }
          if (generation !== current.generation) continue;
          current.value = value;
          current.etag = response.headers.get("ETag") ?? (response.status === 304 ? current.etag : undefined);
          current.expires = now() + 10000;
          return value as T;
        }
      } finally { clearTimeout(timeout); }
    })();
    current.pending = request;
    const release = () => { if (current.pending === request) current.pending = undefined; };
    void request.then(release, release);
    return request;
  }
  return { read, invalidate };
}

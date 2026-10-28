// A write can read its source snapshot twice, but must reread the mutable location ledger.
export function memoizePhysicalSnapshot<TTransaction extends object, TSnapshot>(loader: (tx: TTransaction) => Promise<TSnapshot>) {
  const snapshots = new WeakMap<TTransaction, Promise<TSnapshot>>();
  return (tx: TTransaction) => {
    let snapshot = snapshots.get(tx);
    if (!snapshot) { snapshot = loader(tx); snapshots.set(tx, snapshot); }
    return snapshot;
  };
}

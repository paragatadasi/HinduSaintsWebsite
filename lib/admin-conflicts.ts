import { redirect } from "next/navigation";
import type { Route } from "next";
import type { AdminEntityType, Prisma } from "@/lib/generated/prisma/client";
import { assertCapability } from "@/lib/admin-access";
import { db } from "@/lib/db";

export function expectedVersion(formData: FormData) {
  const value = Number(formData.get("version"));
  if (!Number.isInteger(value) || value < 1) throw new Error("This edit is missing its record version. Reload and try again.");
  return value;
}

export function versionedMutation(version: number, data: object) {
  return { where: { version }, data: { ...data, version: { increment: 1 } } };
}

export async function guardedSaintUpdate(id: string, version: number, data: Prisma.SaintUpdateManyMutationInput, attempted: unknown, returnTo: string) {
  return guarded("saint", id, version, data, attempted, returnTo);
}
export async function guardedTraditionUpdate(id: string, version: number, data: Prisma.TraditionUpdateManyMutationInput, attempted: unknown, returnTo: string) {
  return guarded("tradition", id, version, data, attempted, returnTo);
}
export async function guardedPlaceUpdate(id: string, version: number, data: Prisma.PlaceUpdateManyMutationInput, attempted: unknown, returnTo: string) {
  return guarded("place", id, version, data, attempted, returnTo);
}
export async function guardedInstagramUpdate(id: string, version: number, data: Prisma.InstagramItemUpdateManyMutationInput, attempted: unknown, returnTo: string) {
  return guarded("instagram_item", id, version, data, attempted, returnTo);
}

export async function guardedSaintTransaction<T>(
  id: string,
  version: number,
  attempted: unknown,
  returnTo: string,
  mutation: (tx: Prisma.TransactionClient) => Promise<T>
) {
  return guardedTransaction("saint", id, version, attempted, returnTo, mutation);
}

export async function guardedTraditionTransaction<T>(
  id: string,
  version: number,
  attempted: unknown,
  returnTo: string,
  mutation: (tx: Prisma.TransactionClient) => Promise<T>
) {
  return guardedTransaction("tradition", id, version, attempted, returnTo, mutation);
}

export async function guardedPlaceTransaction<T>(
  id: string,
  version: number,
  attempted: unknown,
  returnTo: string,
  mutation: (tx: Prisma.TransactionClient) => Promise<T>
) {
  return guardedTransaction("place", id, version, attempted, returnTo, mutation);
}

async function guarded(type: AdminEntityType, id: string, version: number, data: object, attempted: unknown, returnTo: string) {
  const model = type === "saint" ? db.saint : type === "tradition" ? db.tradition : type === "place" ? db.place : db.instagramItem;
  const mutation = versionedMutation(version, data);
  const result = await (model.updateMany as Function)({ where: { id, ...mutation.where }, data: mutation.data });
  if (result.count) return (model.findUnique as Function)({ where: { id } });
  return redirectToConflict(type, id, version, attempted, returnTo);
}

async function guardedTransaction<T>(
  type: Exclude<AdminEntityType, "instagram_item">,
  id: string,
  version: number,
  attempted: unknown,
  returnTo: string,
  mutation: (tx: Prisma.TransactionClient) => Promise<T>
) {
  const outcome = await db.$transaction(async (tx) => {
    const model = type === "saint" ? tx.saint : type === "tradition" ? tx.tradition : tx.place;
    const reserved = await (model.updateMany as Function)({
      where: { id, version },
      data: { version: { increment: 1 } }
    });
    if (!reserved.count) return { saved: false as const };
    return { saved: true as const, value: await mutation(tx) };
  });

  if (outcome.saved) return outcome.value;
  return redirectToConflict(type, id, version, attempted, returnTo);
}

async function redirectToConflict(type: AdminEntityType, id: string, version: number, attempted: unknown, returnTo: string): Promise<never> {
  const model = type === "saint" ? db.saint : type === "tradition" ? db.tradition : type === "place" ? db.place : db.instagramItem;
  const current = await (model.findUnique as Function)({ where: { id } });
  if (!current) redirect(returnTo as Route);
  const actor = await assertCapability("edit_content");
  const conflict = await db.adminEditConflict.create({ data: {
    entityType: type, entityId: id, expectedVersion: version, currentVersion: current.version,
    currentValue: json(current), attemptedValue: json(attempted), userId: actor.id
  } });
  redirect(`${returnTo}${returnTo.includes("?") ? "&" : "?"}conflict=${conflict.id}` as Route);
}

function json(value: unknown): Prisma.InputJsonValue { return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue; }

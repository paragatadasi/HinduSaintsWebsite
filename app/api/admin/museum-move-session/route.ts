import { museumMoveSessionHttp } from "@/lib/museum-move-session-http";
import { readMuseumMoveSessionSource } from "@/lib/museum-move-session-source";
export const runtime = "nodejs";
export const GET = (request: Request) => museumMoveSessionHttp(request, readMuseumMoveSessionSource);
export const POST = (request: Request) => museumMoveSessionHttp(request, readMuseumMoveSessionSource);
export const PATCH = (request: Request) => museumMoveSessionHttp(request, readMuseumMoveSessionSource);

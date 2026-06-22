"use client";

function uuid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return "id-" + Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export function getClientId(): string {
  if (typeof window === "undefined") return "";
  let id = localStorage.getItem("pato:clientId");
  if (!id) {
    id = uuid();
    localStorage.setItem("pato:clientId", id);
  }
  return id;
}

export function getNick(): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem("pato:nick") ?? "";
}

export function setNick(nick: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem("pato:nick", nick.trim().slice(0, 16));
}

/** Marca este cliente como host da sala `code` (usado ao criar a sala). */
export function markHost(code: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(`pato:host:${code.toUpperCase()}`, getClientId());
}

export function isHostOf(code: string): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(`pato:host:${code.toUpperCase()}`) === getClientId();
}

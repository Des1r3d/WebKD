import type { Socket } from 'socket.io-client';
import { getSocketUrl, tokenStore } from './api';

let s: Promise<Socket> | undefined;

/** Lazy: socket.io-client is only loaded on first call. */
export function getSocket(): Promise<Socket> {
  return (s ??= import('socket.io-client').then(({ io }) => io(getSocketUrl(), { auth: { token: tokenStore.get() } })));
}

export async function closeSocket() {
  const p = s;
  s = undefined;
  (await p)?.disconnect();
}

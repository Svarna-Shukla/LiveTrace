"use client";

import { io, type Socket } from "socket.io-client";
import { SOCKET_PATH } from "./types";

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    socket = io({ path: SOCKET_PATH });
  }
  return socket;
}

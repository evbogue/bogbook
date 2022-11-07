// has broadcastChannel API disabled so that we do not _have_ to depend on Deno Deploy to test things

import { listenAndServe } from "https://deno.land/std/http/server.ts"
import { serveDir } from "https://deno.land/std@0.144.0/http/file_server.ts"
import { addSocket, rmSocket, gossipMsg } from './gossip.js'

await listenAndServe(":8080", (r) => {
  try {
    const { socket, response } = Deno.upgradeWebSocket(r)
    addSocket(socket)
    socket.onmessage = e => {
      gossipMsg(e.data)
    }
    socket.onclose = _ => rmSocket(socket)
    return response
  } catch {
    return serveDir(r, {fsRoot: '', showDirListing: true, quiet: true})
  }
})

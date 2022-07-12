// has broadcastChannel API disabled so that we do not _have_ to depend on Deno Deploy to test things

import { listenAndServe } from "https://deno.land/std/http/server.ts"
import { serveDir } from "https://deno.land/std@0.144.0/http/file_server.ts"

const sockets = new Set()

let blastcache = []

//keep things from repeating all over the place
setInterval(function () {
  blastcache = []
}, 10000)

await listenAndServe(":8080", (r) => {
  try {
    const { socket, response } = Deno.upgradeWebSocket(r)
    sockets.add(socket)
    socket.onmessage = e => {
      if (!blastcache.includes(e.data)) {
        blastcache.push(e.data)
        sockets.forEach(s => s.send(e.data))
      }
    }
    socket.onclose = _ => sockets.delete(socket)
    return response
  } catch {
    return serveDir(r, {fsRoot: '', showDirListing: true, quiet: true})
  }
})


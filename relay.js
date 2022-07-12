import { listenAndServe } from "https://deno.land/std/http/server.ts"
import { serveDir } from "https://deno.land/std@0.144.0/http/file_server.ts"

const sockets = new Set()

let blastcache = []

//keep things from repeating all over the place
setInterval(function () {
  blastcache = []
}, 10000)

const channel = new BroadcastChannel("")

channel.onmessage = e => {
  if (!blastcache.includes(e.data)) {
    (e.target != channel) && channel.postMessage(e.data)
    sockets.forEach(s => s.send(e.data))
    blastcache.push(e.data)
  }
  //console.log(e.data)
}

await listenAndServe(":8080", (r) => {
  try {
    const { socket, response } = Deno.upgradeWebSocket(r)
    sockets.add(socket)
    socket.onmessage = channel.onmessage
    socket.onclose = _ => sockets.delete(socket)
    return response
  } catch {
    return serveDir(r, {fsRoot: '', showDirListing: true, quiet: true})
  }
})


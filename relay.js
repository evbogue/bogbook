import { listenAndServe } from "https://deno.land/std@0.144.0/http/server.ts"
import { serveDir } from "https://deno.land/std@0.144.0/http/file_server.ts"
import { addSocket, rmSocket, gossipMsg } from './gossip.js'

const channel = new BroadcastChannel("")

channel.onmessage = e => {
  (e.target != channel) && channel.postMessage(e.data)
  gossipMsg(e.data)
}

await listenAndServe(":8080", (r) => {
  try {
    const { socket, response } = Deno.upgradeWebSocket(r)
    addSocket(socket)
    socket.onmessage = channel.onmessage
    socket.onclose = _ => rmSocket(socket)
    return response
  } catch {
    return serveDir(r, {fsRoot: '', showDirListing: true, quiet: true})
  }
})


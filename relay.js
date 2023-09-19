import { serveDir } from 'https://deno.land/std@0.196.0/http/file_server.ts'
import { addSocket, rmSocket, gossipMsg } from './gossip.js'

const channel = new BroadcastChannel("")

channel.onmessage = e => {
  (e.target != channel) && channel.postMessage(e.data)
  gossipMsg(e.data)
}

Deno.serve((req) => {
  try {
    const { socket, response } = Deno.upgradeWebSocket(req)
    addSocket(socket)
    socket.onmessage = channel.onmessage
    socket.onclose = _ => rmSocket(socket)
    return response
  } catch {
    return serveDir(req, {quiet: true})
  }
})


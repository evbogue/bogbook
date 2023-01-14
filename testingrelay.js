import { serve } from 'https://deno.land/std@0.172.0/http/server.ts'
import { serveDir } from 'https://deno.land/std@0.172.0/http/file_server.ts'
import { addSocket, rmSocket, gossipMsg } from './gossip.js'

serve((req) => {
  try {
    const { socket, response } = Deno.upgradeWebSocket(req)
    addSocket(socket)
    socket.onmessage = ev => gossipMsg(ev.data) 
    socket.onclose = _ => rmSocket(socket) 
    return response
  } catch {
    return serveDir(req, {fsRoot: '', showDirListing: true, quiet: true})
  }
}, { port: 8080 })

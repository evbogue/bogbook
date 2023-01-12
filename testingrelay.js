import { serveDir } from "https://deno.land/std@0.170.0/http/file_server.ts"
import { addSocket, rmSocket, gossipMsg } from './gossip.js'

const port = 8080

const server = Deno.listen({ port })

console.log('Listening at http://localhost:' + port + '/')

for await (const conn of server) {
  handleHttp(conn).catch(console.error)
}

async function handleHttp(conn) {
  const httpConn = Deno.serveHttp(conn)
  for await (const e of httpConn) {
    try {
      const { socket, response } = Deno.upgradeWebSocket(e.request)
      addSocket(socket)
      socket.onmessage = ev => { gossipMsg(ev.data) }
      socket.onclose = _ => rmSocket(socket)
      e.respondWith(response)
    } catch {
      e.respondWith(serveDir(e.request, {fsRoot: '', showDirListing: true, quiet: true}))
    }
  }
}


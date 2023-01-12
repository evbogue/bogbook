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


//import { serveDir } from "https://deno.land/std@0.170.0/http/file_server.ts"
//import { addSocket, rmSocket, gossipMsg } from './gossip.js'
//
//const server = Deno.listen({ port: 8080 })
//
//for await (const conn of server) {
//  handleHttp(conn).catch(console.error)
//}
//
//const channel = new BroadcastChannel("")
//
//channel.onmessage = e => {
//  (e.target != channel) && channel.postMessage(e.data)
//  gossipMsg(e.data)
//}
//
//async function handleHttp(conn) {
//  const httpConn = Deno.serveHttp(conn)
//  for await (const e of httpConn) {
//    try {
//      const { socket, response } = Deno.upgradeWebSocket(e.request)
//      addSocket(socket)
//      socket.onmessage = channel.onmessage
//      socket.onclose = _ => rmSocket(socket)
//      e.respondWith(response)
//    } catch {
//      e.respondWith(serveDir(e.request, {fsRoot: '', showDirListing: true, quiet: true}))
//    }
//  }
//}


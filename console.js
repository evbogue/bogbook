import { processReq } from './pub.js'
import { keys} from './keys.js'

const sockets = new Set()

export function connect (server) {
  console.log('Connecting to ' + server) 

  const ws = new WebSocket(server)
  ws.binaryType = 'arraybuffer'

  ws.onopen = () => {
    sockets.add(ws)
    ws.send('connect:' + keys.pubkey())
  }

  ws.onmessage = (msg) => {
    console.log(msg.data)
    //processReq(msg.data, ws)
  }

  Deno.addSignalListener("SIGINT", () => {
    ws.send('disconnect:' + keys.pubkey())
    Deno.exit()
  })

  ws.onclose = (e) => {
    sockets.delete(ws)
    setTimeout(function () {
      connect(server)
    }, 1000)
  }

  let retryCount = 1

  ws.onerror = (err) => {
    setTimeout(function () {
      ws.close()
      sockets.delete(ws)
      retryCount++
    }, 10000 * retryCount)
  }
}

connect('ws://localhost:8080/ws')

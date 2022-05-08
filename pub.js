import { keys } from './keys.js'
import { open } from './denobog.js'

const sockets = new Set()

const log = []

function processReq (req, ws) {
  if (req.length === 44) { 
    if (log[0]) {
      let got = false
      for (let i = log.length; i >= 0; i--) {
        if (log[i].raw.includes(req)) {
          console.log('SEND THIS TO PEER')
          got = true
          console.log(log[i].raw)
          ws.send(log[i].raw)
        }
        if (i === 0 && !got) {
          console.log('WE DO NOT HAVE IT')
          ws.send(req)
        }
      }
    } else {
      console.log('WE HAVE NO DATA AT ALL')
      ws.send(req)    
    }
  }
  if (req.length > 44) {
    open(req).then(opened => {
      console.log(opened)
    })
  }
}

export async function servePub (e) {
  const { socket, response } = Deno.upgradeWebSocket(e.request)
  const ws = socket
  sockets.add(ws)

  ws.onopen = () => {
  }

  ws.onmessage = (e) => {
    console.log(e.data)
    processReq(e.data, ws)
  }

  ws.onclose = function () {
    sockets.delete(socket)
  }

  ws.onerror = (e) => console.error(e)

  e.respondWith(response)
}

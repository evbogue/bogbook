import { keys } from './keys.js'
import { open } from './denobog.js'

const sockets = new Set()

const store = new Map()

const log = []

let newData = false

function processReq (req, ws) {
  console.log(req)
  if (req.length === 44) {
    if (!log[0]) { 
      ws.send(req)
    }
  } 
  if (req.length > 44) {
    open(req).then(opened => {
      if (opened && !store.has(opened.hash)) {
        log.unshift(req)
        store.set(opened.hash, opened)
        console.log(store)
        console.log(log)
      }
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
    processReq(e.data, ws)
  }

  ws.onclose = function () {
    sockets.delete(socket)
  }

  ws.onerror = (e) => console.error(e)

  e.respondWith(response)
}

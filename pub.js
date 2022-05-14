import { keys } from './keys.js'
import { open } from './denobog.js'

const sockets = new Set()

const log = []

let newData = false

function processReq (req, ws) {
  console.log(req)
  console.log(log.length)
  let got = false
  if (req.length === 44) { 
    if (log[0]) {
      for (let i = log.length -1; i >= 0; i--) {
        if ((log[i].raw.substring(44, 88) === req) && !got) {
          console.log('WE HAVE IT, SEND LATEST TO PEER')
          ws.send(log[i].raw)
          got = true
        }
        if (log[i].raw.substring(0, 44) === req) {
          console.log('WE HAVE IT, SEND POST TO PEER')
          got = true
          ws.send(log[i].raw)
        }
        if (i === 0 && !got) {
          console.log('WE DO NOT HAVE IT, REQ FROM PEER')
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
      if (opened) {
        if (log[0]) {
          for (let i = log.length -1; i >= 0; i--) {
            if (log[i].raw.substring(0, 44) === opened.raw.substring(0, 44)) {
              console.log('WE HAVE IT, DO NOT ADD TO LOG')
              got = true
            }
            if (i === 0 && !got) {
              log.unshift(opened)
              newData = true
              console.log('WE DO NOT HAVE IT, ADD TO LOG')
              ws.send(opened.previous)
              console.log('ASK PEER FOR ' + opened.previous)
            }
          }
        } else {
          console.log('NO LOG YET, JUST SAVE IT')
          log.push(opened)
          newData = true
          if (opened.raw.substring(0, 44) != opened.previous) {
            ws.send(opened.previous)
            console.log('ASK PEER FOR ' + opened.previous)
          }
        }
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

import { keys} from './keys.js'
import { encode, decode } from './lib/base64.js'
import { open } from './denobog.js'
import { addSocket, rmSocket, gossipMsg, queue } from './gossip.js'

const msgstore = new Map() 
const blobstore = new Map()
const log = []

async function getLatest (query) {
  if (log[0]) {
    const querylog = log.filter(msg => msg.author == query)
    if (querylog[0]) {
      querylog.sort((a,b) => a.timestamp - b.timestamp)
      return querylog[querylog.length - 1]
    }
  }
}

function processReq (req, ws) {
  if (req.length === 44) {
    //console.log('REQ:' + req)
    let got = false
    if (msgstore.has(req)) {
      const msg = msgstore.get(req)
      gossipMsg(msg.raw)
      if (blobstore.has(msg.data)) {
        const data = blobstore.get(msg.data)
        gossipMsg('blob:' + req + data)
      } else {
        gossipMsg(msg.data)
      }
      got = true
    }
    if (blobstore.has(req)) {
      const data = blobstore.get(req)
      gossipMsg('blob:' + req + data)
      got = true
    } 
    if (!got) {
      getLatest(req).then(msg => {
        if (msg) {
          gossipMsg(msg.raw)
          if (blobstore.has(msg.data)) {
            const data = blobstore.get(msg.data)
            gossipMsg('blob:' + req + data)
          } else {
            gossipMsg(msg.data)
          }
        }
      })
    }
  } 
  if (req.length > 44) {
    if (req.startsWith('connect:') || req.startsWith('disconnect:')) {
      console.log(req)
    } else if (req.startsWith('blob')) {
      const hash = req.substring(5, 49)
      if (!blobstore.has(hash)) {
        const file = req.substring(49)
        crypto.subtle.digest("SHA-256", new TextEncoder().encode(file)).then(digest => {
          const verify = encode(digest)
          if (hash === verify) {
            //console.log('Added blob: ' + hash)
            blobstore.set(hash, file)
          }
        })
      }
    } else {
      open(req).then(opened => {
        if (!blobstore.has(opened.data)) {
          gossipMsg(opened.data)
        }
        //console.log(opened)
        if (!msgstore.has(opened.hash)) {
          console.log('Added post: ' + opened.hash)
          msgstore.set(opened.hash, opened)
          log.push(opened)
        }
        if (!msgstore.has(opened.previous)) {
          gossipMsg(opened.previous)
        }
      })
    }
  }
}

const sockets = new Set()

export function connect (server) {
  console.log('Connecting to ' + server) 

  const ws = new WebSocket(server)
  ws.binaryType = 'arraybuffer'

  ws.onopen = () => {
    addSocket(ws)
    ws.send('connect:' + keys.pubkey())
  }

  ws.onmessage = (msg) => {
    //console.log(msg.data)
    if (!queue.includes(msg.data)) {
      processReq(msg.data, ws)
    }
  }

  Deno.addSignalListener("SIGINT", () => {
    ws.send('disconnect:' + keys.pubkey())
    Deno.exit()
  })

  ws.onclose = (e) => {
    rmSocket(ws)
    setTimeout(function () {
      connect(server)
    }, 1000)
  }

  let retryCount = 1

  ws.onerror = (err) => {
    setTimeout(function () {
      ws.close()
      rmSocket(ws)
      retryCount++
    }, 10000 * retryCount)
  }
}

//connect('wss://denobook.com/ws')
connect('ws://localhost:8080/ws')

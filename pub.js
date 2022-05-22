import { keys } from './keys.js'
import { open } from './denobog.js'
import { encode } from './lib/base64.js'


const sockets = new Set()

const store = new Map()

var log = []

var blastcache = []

setTimeout(function () {
  blastcache = []
  log.sort((a,b) => a.substring(0, 13) - b.substring(0, 13))
}, 10000)

let newData = false

async function getLatest (author) {
  if (log[0]) {
    for (let i = log.length -1; i >= 0 ; i--) {
      if (log[i].substring(13, 57) === author) {
        return log[i].substring(57, 101)
      }
      if (i === 0) {
        return undefined
      }
    }
  } else { return undefined }
}

function processReq (req, ws) {
  console.log(req)
  if (req.length === 44) {
    if (!log[0]) { 
      console.log('no log yet, sending req back hoping for a message')
      ws.send(req)
    } else if (store.has(req)) {
      const file = store.get(req)
      if (!(typeof(file) === 'object') && file.substring(0, 5) === 'blob:') {
        console.log('this is a blob')
        ws.send('blob:' + req + file.substring(5))
      } else {
        console.log('we have the post ' + req + ' sending it')
        ws.send(file.raw)
      }
    } else if (!store.has(req)) {
      console.log('checking if ' + req + ' is an author pubkey')
      getLatest(req).then(latest => {
        if (latest) {
          console.log('yes it is a pubkey, sending: ' + latest)
          const msg = store.get(latest)
          ws.send(msg.raw)
        } if (!latest) {
          console.log('we do not have it asking for' + req )
          ws.send(req)
          blastcache.push(req)
        }
      })
    }
  } 
  if (req.length > 44) {
    if (req.startsWith('blob:')) {
      console.log('this is a blob')
      const hash = req.substring(5, 49)
      console.log(hash)
      const file = req.substring(49)
      console.log(file)
      crypto.subtle.digest("SHA-256", new TextEncoder().encode(file)).then(digest => {
        const verify = encode(digest)
        console.log('VERIFY:' + verify)
        if (hash === verify) {
          console.log('saving blob as ' + hash + ' blob:' + file)
          store.set(hash, 'blob:' + file)
        }
      })
    } else {
      open(req).then(opened => {
        if (opened && !store.has(opened.hash)) {
          log.push(req)
          store.set(opened.hash, opened)
          console.log('added ' + opened.hash + ' by ' + opened.author)
          // then we need to make sure we have the data associated with the post
          if (!store.has(opened.data)) {
            ws.send(opened.data)
          }
          if (!store.has(opened.previous)) { 
            console.log('requesting ' + opened.previous)
            ws.send(opened.previous)
          }
        }
        if (!opened && !store.has(opened.hash)) {
          console.log('maybe this is a data blob?')
          console.log(req) 
        }
      })
    }
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

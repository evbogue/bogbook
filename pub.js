import { keys } from './keys.js'
import { open } from './denobog.js'

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
        console.log('we have it, sending it')
        ws.send(store.get(req).raw)
    } else if (!store.has(req)) {
      console.log('checking if this is an author feed')
      getLatest(req).then(latest => {
        if (latest) {
          console.log('THIS IS A FEED, latest message: ' + latest)
          const msg = store.get(latest)
          console.log(msg)
          console.log(msg.raw)
          ws.send(msg.raw)
        } if (!latest) {
          console.log('we do not have it')
          ws.send(req)
          blastcache.push(req)
        }
      })
    }
  } 
  if (req.length > 44) {
    open(req).then(opened => {
      if (opened && !store.has(opened.hash)) {
        log.push(req)
        store.set(opened.hash, opened)
        console.log('added ' + opened.hash + ' by ' + opened.author)
        // then we need to make sure we have the data associated with the post
        if (!store.has(opened.data)) {
          //ws.send(opened.data)
        }
        if (!store.has(opened.previous)) { 
          console.log('requesting ' + opened.previous)
          ws.send(opened.previous)
        }
      }
      if (!opened && !store.has(opened.hash)) {
        console.log('maybe this is a data blob?') 
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

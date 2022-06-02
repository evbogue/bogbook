import { keys } from './keys.js'
import { open } from './denobog.js'
import { encode } from './lib/base64.js'

const sockets = new Set()

const blobstore = new Map()

const arraystore = []

var blastcache = []

setTimeout(function () {
  blastcache = []
  arraystore.sort((a,b) => a.timestamp - b.timestamp)  
}, 10000)

//let newData = false

async function getLatest (author) {
  if (arraystore[0]) {
    const querylog = arraystore.filter(msg => msg.author == author)
    if (querylog[0]) {
      return querylog[querylog.length -1]
    } else { return undefined }
  } else { return undefined}
}
//async function getLatest (author) {
//  if (log[0]) {
//    for (let i = log.length -1; i >= 0 ; i--) {
//      if (log[i].substring(13, 57) === author) {
//        return log[i].substring(57, 101)
//      }
//      if (i === 0) {
//        return undefined
//      }
//    }
//  } else { return undefined }
//}

function processReq (req, ws) {
  //console.log(req)
  if (req.length === 44) {
    if (!arraystore[0]) { 
      //console.log('no log yet, sending req back hoping for a message')
      ws.send(req)
    } else if (blobstore.has(req)) {
      const file = blobstore.get(req)
      if (!(typeof(file) === 'object') && file.substring(0, 5) === 'blob:') {
        //console.log('this is a blob')
        ws.send('blob:' + req + file.substring(5))
      } //else {
        //console.log('we have the post ' + req + ' sending it')
        //ws.send(file.raw)
      //}
    } else if (!blobstore.has(req)) {
      // first check for the post
      const msgarray = arraystore.filter(msg => msg.hash == req)
      if (msgarray[0]) {
        //console.log('we have the post ' + req + ' sending it')
        ws.send(msgarray[0].raw)
      } else {
        // then check to see if it is an author
      }
      //console.log('checking if ' + req + ' is an author pubkey')
      getLatest(req).then(latest => {
        if (latest) {
          //console.log('yes it is a pubkey, sending: ' + latest.hash)
          ws.send(latest.raw)
        } if (!latest) {
          //console.log('we do not have it asking for' + req )
          ws.send(req)
          blastcache.push(req)
        }
      })
    }
  } 
  if (req.length > 44) {
    if (req.startsWith('blob:')) {
      //console.log('this is a blob')
      const hash = req.substring(5, 49)
      //console.log(hash)
      const file = req.substring(49)
      //console.log(file)
      crypto.subtle.digest("SHA-256", new TextEncoder().encode(file)).then(digest => {
        const verify = encode(digest)
        //console.log('VERIFY:' + verify)
        if (hash === verify) {
          console.log('saving blob as ' + hash /*+ ' blob:' + file*/)
          blobstore.set(hash, 'blob:' + file)
          if (file.startsWith('image:')) { 
            ws.send(file.substring(6, 50))
          }
          if (file.startsWith('name:')) {
            ws.send(file.substring(5, 49))
          }
        }
      })
    } else {
      open(req).then(opened => {
        const dupe = arraystore.filter(msg => msg.hash === opened.hash)
        if (opened && !dupe[0]) {
          //log.push(req)
          arraystore.push(opened)
          //store.set(opened.hash, opened)
          console.log('added ' + opened.hash + ' by ' + opened.author)
          // then we need to make sure we have the data associated with the post
          if (!blobstore.has(opened.data)) {
            ws.send(opened.data)
          }
          const data = blobstore.get(opened.data) 
          const previous = arraystore.filter(msg => msg.hash === opened.previous)
          if (!dupe[0]) { 
            //console.log('requesting ' + opened.previous)
            ws.send(opened.previous)
          }
        }
        if (!opened && !blobstore.has(opened.hash)) {
          //console.log('maybe this is a data blob?')
          //console.log(req) 
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

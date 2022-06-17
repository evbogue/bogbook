import { keys } from './keys.js'
import { open } from './denobog.js'
import { encode } from './lib/base64.js'
import { logs } from './log.js'
import { path } from './path.js'

const sockets = new Set()

const blobstore = new Map()

var blastcache = []

let newData = false

setInterval(function () {
  blastcache = []
}, 10000)

function processReq (req, ws) {
  //console.log(req)
  if (req.startsWith('update:')) {
    //console.log(req)
    const feedID = req.substring(7, 51)
    const latestMsg = req.substring(51)
    //console.log(feedID)
    //console.log(latestMsg)
    logs.getFeeds().then(feeds => {
      //console.log(feeds)
      feeds.map(feed => {
        if (feed === feedID) {
          logs.getLatest(feedID).then(latest => {
            //console.log(feedID + ' is at ' + latest.hash)
            if (latest.hash != latestMsg) {
              console.log('Sending latest of ' + latest.author + ' to ' + ws.pubkey)
              ws.send(latest.raw)
            }
          })
        }
      })
    })
  } else if (req.length === 44) {
    let sent = false
    logs.getLog(req).then(log => {
      if (!log[0]) {
        //console.log('NO LOG') 
        ws.send(req)
        sent = true
      }
    })
    Deno.stat(path.blobs() + req.replaceAll('/', ':'))
      .then(exists => {
        //console.log('WE DO NOT HAVE THE BLOB')
        const file = Deno.readTextFileSync(path.blobs() + req.replaceAll('/', ':'))
        blobstore.set(file)
        ws.send('blob:' + req + file)
        sent = true
      })
      .catch(err => {
        if (blobstore.get(req)) {
          //console.log('WE HAVE THE BLOB IN MEMORY')
          ws.send('blob:' + req + file)
          sent = true
        } 
      })
    logs.get(req).then(msg => {
      if (msg && !sent) {
        //console.log('WE HAVE THE MESSAGE ' + req)
        ws.send(msg.raw)
        sent = true
      }
    })
    logs.getLatest(req).then(latest => {
      if (latest && !sent) {
        ws.send(latest.hash)
        sent = true
      } 
    })
    setTimeout(function () {
      if (!sent) {
        //console.log('sending:' + req)
        ws.send(req)
        blastcache.push(req)
      }
    }, 100)
  } else if (req.length > 44) {
    if (req.startsWith('blob:')) {
      const hash = req.substring(5, 49)
      const file = req.substring(49)
      crypto.subtle.digest("SHA-256", new TextEncoder().encode(file)).then(digest => {
        const verify = encode(digest)
        if (hash === verify) {
          Deno.stat(path.blobs() + hash.replaceAll('/', ':'))
          .then(exists => {
          })
          .catch(err => {
            Deno.writeTextFile(path.blobs() + hash.replaceAll('/', ':'), file)
            blobstore.set(hash, file)
            if (file.startsWith('image:')) {
              ws.send(file.substring(6, 50))
            }
            if (file.startsWith('name:')) {
              ws.send(file.substring(5, 49))
            }
          })
        }
      })
    } else {
      open(req).then(opened => {
        if (opened) {
          logs.add(req)
          if (!blobstore.has(opened.data)) {
            ws.send(opened.data)
          }
          const data = blobstore.get(opened.data)
          if (opened.hash != opened.previous) { 
            logs.get(opened.previous).then(next => {
              //console.log(next)
              if (!next) {
                //console.log('ASKING FOR NEXT :' + opened.previous)
                ws.send(opened.previous)
              } 
            })
          }
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
    if (e.data.startsWith('connect:')) {
      console.log(e.data)
      ws.pubkey = e.data.substring(8)
    } else {
      processReq(e.data, ws)
    }
  }

  ws.onclose = function () {
    sockets.delete(socket)
  }

  ws.onerror = (e) => console.error(e)
  try {
    await e.respondWith(response)
  } catch (err) {}
}

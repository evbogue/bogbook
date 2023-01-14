import { keys } from './keys.js'
import { encode, decode } from './lib/base64.js'
import { open } from './sbog.js'
import { addSocket, rmSocket, gossipMsg, queue } from './gossip.js'
import { logs } from './log.js'
import { find, make } from './blob.js' 

const server = 'ws://localhost:8080/ws' 

let blastcache = []

function processReq (req, ws) {
  if (req.length === 44) {
    let gotit = false
    if (req === keys.pubkey()) {
      gotit = true
    }
    logs.getFeeds().then(feeds => {
      if (feeds.includes(req)) {
        gotit = true
      }
    })
    //console.log('check to see if '+ req + ' is a feed')
    logs.getLatest(req).then(latest => {
      if (latest) {
        //console.log(req  + ' is a feed we have, sending')
        logs.get(latest.hash).then(got => {
          if (got) {
            gotit = true
            gossipMsg(got.hash, keys.pubkey())
            //gossipMsg(got.data, keys.pubkey())
          }
        })
      } else {
        logs.get(req).then(post => {
          if (post) {
            gotit = true
            //console.log(req + ' is a post, sending')
            gossipMsg(post.raw, keys.pubkey())
            //gossipMsg(post.data, keys.pubkey())
          }
        })
      }
    })
    setTimeout(function () {
      if (!gotit) {
        find(req).then(file => {
          if (file) {
            gotit = true
            //console.log(req + ' is a blob, sending')
            //console.log(file)
            gossipMsg('blob:' + req + file, keys.pubkey())
            setTimeout(function () {
              if (!gotit) {
                //console.log('WE do not have '+ req +', blasting for it ')
                gossipMsg(req, keys.pubkey())
              }
            }, 500)
          }
        })
      }
    }, 500)
  }
  if (req.length > 44) {
    if (req.startsWith('connect:')) {
      console.log(req)
    } else if (req.startsWith('disconnect:')) {
      console.log(req)
    } else if (req.startsWith('blob:')) {
      //console.log('THIS IS A BLOB')
      const hash = req.substring(5, 49)
      find(hash).then(found => {
        if (!found) {
          const file = req.substring(49)
          blastcache.push(hash)
          make(file)
        }
      })
    } else {
      open(req).then(opened => {
        if (opened) {
          logs.get(opened.hash).then(got => {
            if (!got) {
              logs.add(req)
              logs.get(req.previous).then(gotit => {
                if (!gotit) {
                  gossipMsg(opened.data, keys.pubkey())
                  gossipMsg(opened.previous, keys.pubkey())
                }
              })
              console.log('New post from ' + opened.author + ' ' + opened.hash)
            }
          })
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

  setInterval(function () {
    ws.send(keys.pubkey())
  }, 100000)

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

function start () {
  if (keys) {
    console.log(keys.pubkey())
    connect(server)
  } else {
    setTimeout(function () {
      start()
    }, 5000)
  }
}

start()

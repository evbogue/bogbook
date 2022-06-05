import { keys } from './browserkeys.js'
import { logs } from './browserlog.js'
import { render } from './render.js'
import { open } from './sbog.js'
import { make, find } from './inpfs.js'
import { encode } from './lib/base64.js'

const peers = new Map()

let blastcache = []
let times = 0

setTimeout(function () {
  blastcache.forEach(value => {
    blast(value)
  })
  times++
  if (times > 5) {
    blastcache = []
    times = 0
  }
}, 10000)

export function blast (msg) {
  //console.log('BLAST:' + msg)
  //console.log(peers)
  for (const peer of peers.values()) {
    if (!blastcache.includes(msg)) {
      //console.log(msg)
      blastcache.push(msg)
      peer.send(msg)
    } 
  }
}

function replicate (ws) {
  // first check for my feed
  logs.getLatest(keys.pubkey()).then(latest => {
    if (latest) {
      ws.send(keys.pubkey())
    } else if (!blastcache.includes(keys.pubkey())) {
      blastcache.push(keys.pubkey())
      ws.send(keys.pubkey())
    }
  })

  // next check for the route feed
  var src = window.location.hash.substring(1)
  if (src.length === 44) {
    //console.log(src)
    logs.query(src).then(query => {
      if (!query && !blastcache.includes(src)) {
        //console.log('we do not have it')
        blastcache.push(src)
        ws.send(src)  
      }
    })
  } 

  let timer

  function start () {
    timer = setInterval(function () {
      const feeds = []
      logs.getLog().then(log => {
        for (let i = log.length - 1; i >= 0 ; i--) {
          if (!feeds.includes(log[i].author)) {
            feeds.push(log[i].author)
          }
          //if (!feeds.includes(log[i].substring(13, 57))) {
          //  feeds.push(log[i].substring(13, 57))
          //}
          if (i === 0 && feeds[0]) {
            feeds.forEach(feed => {
              //console.log(feed)
              ws.send(feed)
            })
          }
        }
      })
    }, 10000)
  }

  start()

  // if connection closes we clear the timer and try to reconnect
  ws.onclose = (e) => {
    //clearInterval(timer)
    setTimeout(function () {
      console.log('connection to ' + ws.url + ' closed, reconnecting')
      connect(ws.url, keys)
    }, 1000)
  }
}

let serverId = 0

function processReq (req, ws) {
  if (req.length === 44) {
    let gotit = false
    //console.log('check to see if '+ req + ' is a feed')
    logs.getLatest(req).then(latest => {
      if (latest) {
        //console.log(req  + ' is a feed we have, sending')
        logs.get(latest).then(got => {
          if (got) {
            gotit = true
            ws.send(got.raw)
          }
        })
      } else {
        logs.get(req).then(post => {
          if (post) {
            gotit = true
            //console.log(req + ' is a post, sending')
            ws.send(post.raw)
          } 
        })
      }
    }) 

    find(req).then(file => {
      if (file) {
        gotit = true
        //console.log(req + ' is a blob, sending')
        //console.log(file)
        ws.send('blob:' + req + file)
      }
    })
    setTimeout(function () {
      if (!gotit) {
        //console.log('WE do not have '+ req +', blasting for it ')
        blast(req)
      }
    }, 1000)
  } 
  if (req.length > 44) {
    if (req.startsWith('blob')) {
      //console.log('THIS IS A BLOB')
      const hash = req.substring(5, 49)
      const file = req.substring(49)
      const verify = encode(sha256(new TextEncoder().encode(file)))
      if (hash == verify) {
        make(file)
      }
    } else {
      open(req).then(opened => {
        if (opened) {
          logs.get(opened.hash).then(got => {
            if (got) {
              //console.log(opened.hash)
              //console.log('we already have this message')
              //console.log(opened)
            } if (!got) {
              //console.log('we do not have it, add to db')
              logs.add(req)
              if (opened.previous != opened.hash) { 
                ws.send(opened.previous)
              }
              const scroller = document.getElementById('scroller')
              render(opened).then(rendered => {
                scroller.insertBefore(rendered, scroller.childNodes[1])
                //scroller.appendChild(rendered)
              })           
            }
          })
        }
      })
    }
      //if (opened && !store.has(opened.hash)) {
      //  log.unshift(req)
      //  store.set(opened.hash, opened)
      //  console.log('added ' + opened.hash + ' by ' + opened.author)
      //  // then we need to make sure we have the data associated with the post
      //  if (!store.has(opened.data)) {
      //    //ws.send(opened.data)
      //  }
      //  if (!store.has(opened.previous)) {
      //    console.log('requesting ' + opened.previous)
      //    ws.send(opened.previous)
      //  }
      //}
      //if (!opened && !store.has(opened.hash)) {
      //  console.log('maybe this is a data blob?')
      //}
  }
}

export function connect (server) {
  const id = ++serverId

  console.log('Connecting to ' + server)
  const ws = new WebSocket(server)
  ws.binaryType = 'arraybuffer'

  ws.onopen = () => {
    //ws.send(keys.pubkey())
    peers.set(id, ws)
    //setTimeout(function () {
      replicate(ws)
    //}, 1000)
  }
  
  ws.onmessage = (msg) => {
    processReq(msg.data, ws)
  }

  ws.onclose = (e) => {
    peers.delete(id)
    setTimeout(function () {
      connect(server)
    }, 1000)
  }

  let retryCount = 1

  ws.onerror = (err) => {
    setTimeout(function () {
      ws.close()
      peers.delete(id)
      retryCount++
    }, 10000 * retryCount)
  }
}

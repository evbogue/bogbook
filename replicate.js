import { keys } from './browserkeys.js'
import { logs } from './browserlog.js'

const peers = new Map()

export function blast (msg) {
  for (const peer of peers.values()) {
    console.log(msg)
    peer.send(msg)
  }
}

function replicate (ws) {
  // first check for my feed
  logs.query(keys.pubkey()).then(log => {
    if (!log) {
      ws.send(JSON.stringify({req: keys.pubkey(), seq: -1}))
    } else {
      ws.send(JSON.stringify({req: keys.pubkey(), seq: log.length}))
    }
  })

  // next check for the route feed

  const feeds = logs.getFeeds()

  var src = window.location.hash.substring(1)
  if (src && !feeds[src]) {
    console.log(src)
    logs.query(src).then(query => {
      if (!query.length) {
        ws.send(JSON.stringify({req: src, seq: -1}))  
      }
    })
  } 

  // next check for updates to existing feeds on repeat
  var timer

  function start () {
    timer = setInterval(function () {
      //console.log('timer')
      const feeds = logs.getFeeds()
      //console.log(feeds)
      Object.keys(feeds).forEach(function (key, index) {
        ws.send(JSON.stringify({req: key, seq: feeds[key].length}))
      })
    }, 10000)
  }

  start()

  // if connection closes we clear the timer and try to reconnect
  ws.onclose = (e) => {
    clearInterval(timer)
    setTimeout(function () {
      console.log('connection to ' + ws.url + ' closed, reconnecting')
      connect(ws.url, keys)
    }, 1000)
  }
}

export function connect (server) {
  console.log('Connecting to ' + server)
  const ws = new WebSocket(server)
  ws.binaryType = 'arraybuffer'

  ws.onopen = () => {
    //ws.send(keys.pubkey())
    replicate(ws)
  }
  
  ws.onmessage = (msg) => {
    console.log(msg.data)
  }

  ws.onclose = (e) => {
    setTimeout(function () {
      connect(server)
    }, 1000)
  }

  let retryCount = 1

  ws.onerror = (err) => {
    setTimeout(function () {
      ws.close()
      retryCount++
    }, 10000 * retryCount)
  }
}

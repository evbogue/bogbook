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
    ws.send(keys.pubkey())
  })

  // next check for the route feed

  var src = window.location.hash.substring(1)
  if (src.length === 44) {
    console.log(src)
    logs.query(src).then(query => {
      if (!query.length) {
        ws.send(src)  
      }
    })
  } 

  // next check for updates to existing feeds on repeat
  var timer

  function start () {
    timer = setInterval(function () {
      //console.log('timer')
      const feeds = logs.getFeeds()
      console.log(feeds)
      feeds.forEach(function (feed) {
        logs.getLatest(feed).then(latest => {
          ws.send(latest.raw.substring(0, 44))
        })
        ws.send(feed)
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

let serverId = 0

export function connect (server) {
  const id = ++serverId

  console.log('Connecting to ' + server)
  const ws = new WebSocket(server)
  ws.binaryType = 'arraybuffer'

  ws.onopen = () => {
    //ws.send(keys.pubkey())
    peers.set(id, ws)
    replicate(ws)
  }
  
  ws.onmessage = (msg) => {
    console.log(msg.data)
    if (msg.data.length === 44) {
      logs.get(msg.data).then(got => {
        if (got) {
          ws.send(got.raw)
        }
      })
    }
    if (msg.data.length > 44) {
      logs.add(msg.data)
    }
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

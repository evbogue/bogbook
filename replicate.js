import { keys } from './keys.js'
import { logs } from './log.js'
import { render } from './render.js'
import { open } from './sbog.js'
import { make, find } from './blob.js'
import { encode } from './lib/base64.js'
import { getBoth } from './avatar.js'
import { h } from './lib/misc.js'
import { addSocket, rmSocket, gossipMsg, queue } from './gossip.js'

let blastcache = []

export function blast (msg) {
  if (!blastcache.includes(msg)) {
    gossipMsg(msg)
    blastcache.push(msg)
  }
}

function replicate (ws) {
  // rec our latest
  gossipMsg(keys.pubkey())

  logs.getFeeds().then(feedList => {
    //console.log(feedList)
    feedList.forEach(feed => {
      gossipMsg(feed)
      logs.getLatest(feed).then(latest => {
        gossipMsg(latest.raw)
      })
    })
  })
 
  // next check for the route feed
  var src = window.location.hash.substring(1)

  if (src.length === 44) {
    //console.log('checking for route feed' + src)
    logs.query(src).then(query => {
      if (!query[0]) {
        gossipMsg(src)
      }
    })
  }

  ws.onclose = (e) => {
    setTimeout(function () {
      console.log('connection to ' + ws.url + ' closed, reconnecting')
      connect(ws.url, keys)
    }, 10000)
  }
}

//let serverId = 0

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
            gossipMsg(got.hash)
          }
        })
      } else {
        logs.get(req).then(post => {
          if (post) {
            gotit = true
            //console.log(req + ' is a post, sending')
            gossipMsg(post.raw)
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
            gossipMsg('blob:' + req + file)
            setTimeout(function () {
              if (!gotit) {
                //console.log('WE do not have '+ req +', blasting for it ')
                blast(req)
              }
            }, 500)
          }
        })
      }
    }, 500)
  } 
  if (req.length > 44) {
    if (req.startsWith('connect:')) {
      const disgot = document.getElementById('disconnect:' + req.substring(8))
      if (disgot) { got.parentNode.removeChild(disgot) }
      const got = document.getElementById(req)
      if (got) { got.parentNode.removeChild(got) }
      const connect = h('div', {classList: 'message', id: req}, [
        getBoth(req.substring(8)),
        ' connected.'
      ])
      scroller.insertBefore(connect, scroller.childNodes[1])
      logs.getFeeds().then(feedList => {
        feedList.forEach(feed => {
          gossipMsg(feed)
          logs.getLatest(feed).then(latest => {
            gossipMsg(latest.raw)
          })
        })
      })
    } else if (req.startsWith('disconnect:')) {
      console.log(req)
      const disgot = document.getElementById(req)
      if (disgot) { got.parentNode.removeChild(disgot) }
      const got = document.getElementById('connect:' + req.substring(11))
      if (got) { got.parentNode.removeChild(got) }
      const disconnect = h('div', {classList: 'message', id: 'connect:' + req.substring(11)}, [
        getBoth(req.substring(11)),
        ' disconnected.'
      ])
      scroller.insertBefore(disconnect, scroller.childNodes[1])
    } else if (req.startsWith('blob')) {
      console.log('THIS IS A BLOB')
      const hash = req.substring(5, 49)
      find(hash).then(found => {
        if (!found) {
          console.log('WE DO NOT HAVE THE BLOB')
          const file = req.substring(49)
          const verify = encode(
            Array.from(
              new Uint8Array(
                await crypto.subtle.digest("SHA-256", new TextEncoder().encode(file))
              )
            )
          )
          if (hash == verify) {
            console.log('blob is valid')
            blastcache.push(hash)
            make(file)
          } else {
            console.log('the blob is not valid')
          }
        }
      })
    } else {
      open(req).then(opened => {
        if (opened) {
          logs.get(opened.hash).then(got => {
            if (!got) {
              logs.add(req)
              const src = window.location.hash.substring(1) 
              const getMsg = document.getElementById(opened.hash)
              if (!getMsg && src == '' || src == opened.hash || src == opened.author) {
                const scroller = document.getElementById('scroller')
                render(opened).then(rendered => {
                  logs.getNext(opened.hash).then(next => {
                    if (!next) {
                      scroller.insertBefore(rendered, scroller.childNodes[1])
                    } else {
                      const getNext = document.getElementById(opened.hash)
                      if (!getNext) {
                        scroller.appendChild(rendered)
                      } 
                      if (getNext) {
                        getNext.appendChild(rendered)
                      }
                    }
                  })
                })
              }           
            }
          })
        }
      })
    }
  }
}

export function connect (server) {
  console.log('Connecting to ' + server)
  const ws = new WebSocket(server)
  ws.binaryType = 'arraybuffer'

  ws.onopen = () => {
    ws.send('connect:' + keys.pubkey())
    addSocket(ws)
    replicate(ws)
  }
  
  ws.onmessage = (msg) => {
    if (!queue.includes(msg.data)) {
      processReq(msg.data, ws)
    }
  }

  addEventListener('beforeunload', event => { 
    ws.send('disconnect:' + keys.pubkey())
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

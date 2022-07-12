import { keys } from './browserkeys.js'
import { logs } from './browserlog.js'
import { render } from './render.js'
import { open } from './sbog.js'
import { make, find } from './inpfs.js'
import { encode } from './lib/base64.js'
import { getBoth } from './avatar.js'
import { h } from './lib/misc.js'

let notifyqueue = false

setInterval(function () {
  if (notifyqueue) {
    if (Notification.permission === "granted") {
      const notification = new Notification(notifyqueue)
      notifyqueue = false
    }
  }
}, 10000)

const peers = new Map()

export function blast (msg) {
  for (const peer of peers.values()) {
    peer.send(msg)
  }
}

function replicate (ws) {
  // rec our latest
  ws.send(keys.pubkey())

  logs.getFeeds().then(feedList => {
    //console.log(feedList)
    feedList.forEach(feed => {
      ws.send(feed)
      logs.getLatest(feed).then(latest => {
        ws.send(latest.raw)
      })
    })
  })
 
  // next check for the route feed
  var src = window.location.hash.substring(1)

  if (src.length === 44) {
    //console.log('checking for route feed' + src)
    logs.query(src).then(query => {
      if (!query[0]) {
        ws.send(src)
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

let serverId = 0

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
            ws.send(got.hash)
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
    setTimeout(function () {
      if (!gotit) {
        find(req).then(file => {
          if (file) {
            gotit = true
            //console.log(req + ' is a blob, sending')
            //console.log(file)
            ws.send('blob:' + req + file)
            setTimeout(function () {
              if (!gotit) {
                //console.log('WE do not have '+ req +', blasting for it ')
                blast(req)
              }
            }, 1000)
          }
        })
      }
    }, 1000)
  } 
  if (req.length > 44) {
    if (req.startsWith('connect:')) {
      const disgot = document.getElementById('disconnect:' + req.substring(8))
      if (disgot) { got.parentNode.removeChild(disgot) }
      const got = document.getElementById(req)
      if (got) { got.parentNode.removeChild(got) }
      const connect = h('div', {classList: 'message', id: req}, [
        h('a', {href: '#' + req.substring(8)}, [getBoth(req.substring(8))]),
        ' connected.'
      ])
      scroller.insertBefore(connect, scroller.childNodes[1])
      if (req.substring(8) != keys.pubkey()) {
        if (Notification.permission === "granted") {
          const notification = new Notification(req.substring(8, 13) + ' connected.')
        }
      }
      logs.getFeeds().then(feedList => {
        feedList.forEach(feed => {
          ws.send(feed)
          logs.getLatest(feed).then(latest => {
            ws.send(latest.raw)
          })
        })
      })

    }
    else if (req.startsWith('disconnect:')) {
      console.log(req)
      const disgot = document.getElementById(req)
      if (disgot) { got.parentNode.removeChild(disgot) }
      const got = document.getElementById('connect:' + req.substring(11))
      if (got) { got.parentNode.removeChild(got) }
      const disconnect = h('div', {classList: 'message', id: 'connect:' + req.substring(11)}, [
        h('a', {href: '#' + req.substring(11)}, [getBoth(req.substring(11))]),
        ' disconnected.'
      ])
      scroller.insertBefore(disconnect, scroller.childNodes[1])
      if (req.substring(11) != keys.pubkey()) {
        if (Notification.permission === "granted") {
          const notification = new Notification(req.substring(11, 18) + ' disconnected.')
        }
      }

    //}
    //else if (req.startsWith('update')) {
    //  //console.log(req)
    //  const feedID = req.substring(7, 51)
    //  const latestMsg = req.substring(51)
    //  //console.log(feedID)
    //  //console.log(latestMsg)
    //  logs.getFeeds().then(feeds => {
    //    //console.log(feeds)
    //    feeds.map(feed => {
    //      if (feed === feedID) {
    //        logs.getLatest(feedID).then(latest => {
    //          //console.log(feedID + ' is at ' + latest.hash)
    //          if (latest.hash != latestMsg) {
    //            //console.log('Sending latest of ' + latest.author + ' to ' + ws.pubkey)
    //            ws.send(latest.raw)
    //          }
    //        })
    //      }
    //    })
    //  })
    } else if (req.startsWith('blob')) {
      console.log('THIS IS A BLOB')
      const hash = req.substring(5, 49)
      find(hash).then(found => {
        if (!found) {
          console.log('WE DO NOT HAVE THE BLOB')
          const file = req.substring(49)
          const verify = encode(sha256(new TextEncoder().encode(file)))
          if (hash == verify) {
            make(file)
          }
        }
      })
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
              //if (opened.previous != opened.hash) { 
              //  ws.send(opened.previous)
              //}
              const getMsg = document.getElementById(opened.hash)
              if (!getMsg) {
                const scroller = document.getElementById('scroller')
                render(opened).then(rendered => {
                    if (opened.text) {
                      notifyqueue = opened.author.substring(0, 5) + ': ' + opened.text
                    } else {
                      setTimeout(function () {
                        notifyqueue = opened.author.substring(0, 5) + ': ' + opened.text
                      }, 1000)
                    }

                  // check if a message already has this as previous, then see if we can find that message on the screen and insert the message underneath it. If we cannot find the message on the screen, then append at the bottom of the scroller. If we do not have a message that contains the previous then we put it at the top because it should be new.
                  logs.getNext(opened.hash).then(next => {
                    console.log('NEXT: ' + next)
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
  const id = ++serverId

  console.log('Connecting to ' + server)
  const ws = new WebSocket(server)
  ws.binaryType = 'arraybuffer'

  ws.onopen = () => {
    ws.send('connect:' + keys.pubkey())
    peers.set(id, ws)
    //setTimeout(function () {
      replicate(ws)
    //}, 1000)
  }
  
  ws.onmessage = (msg) => {
    processReq(msg.data, ws)
  }

  addEventListener('beforeunload', event => { 
    ws.send('disconnect:' + keys.pubkey())
  })

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

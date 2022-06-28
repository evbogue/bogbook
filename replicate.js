import { keys } from './browserkeys.js'
import { logs } from './browserlog.js'
import { render } from './render.js'
import { open } from './sbog.js'
import { make, find } from './inpfs.js'
import { encode } from './lib/base64.js'
import { getBoth } from './avatar.js'
import { h } from './lib/misc.js'

const peers = new Map()

const kv = new IdbKvStore('drafts')

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
  //console.log('BLASTING')
  //console.log(msg)
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
  ws.send(keys.pubkey())
  logs.getLatest(keys.pubkey()).then(latest => {
    if (latest) {
      logs.get(latest.hash).then(msg => {
        ws.send(msg.raw)
      })
    }
  })
  //logs.getLatest(keys.pubkey()).then(latest => {
  //  if (latest) {
  //    ws.send(keys.pubkey())
  //  } else if (!blastcache.includes(keys.pubkey())) {
  //    blastcache.push(keys.pubkey())
  //    ws.send(keys.pubkey())
  //  }
  //})

  // next check for the route feed
  var src = window.location.hash.substring(1)
  if (src.length === 44) {
    //console.log('checking for route feed' + src)
    logs.query(src).then(query => {
      if (!query && !blastcache.includes(src)) {
        //console.log('we do not have ' + query)
        blastcache.push(src)
        ws.send(src)  
      }
    })
  } 

  let timer

  function start () {
    timer = setInterval(function () {
      logs.getFeeds().then(feeds => {
        //console.log(feeds)
        if (feeds[0]) {
          feeds.map(feed => {
            logs.getLatest(feed).then(latest => {
              //console.log(feed + latest)
              ws.send('update:' + feed + latest.hash)
            })
          })
        }
      }) 
      //const feeds = []
      //logs.getLog().then(log => {
      //  for (let i = log.length - 1; i >= 0 ; i--) {
      //    if (!feeds.includes(log[i].author)) {
      //      feeds.push(log[i].author)
      //    }
      //    if (i === 0 && feeds[0]) {
      //      feeds.forEach(feed => {
      //        logs.getLatest(feed).then(latest => {
      //          console.log(latest)
      //          ws.send(latest)
      //          //console.log('make sure server has latest: ' + latest)
      //        })
      //        //console.log('asking for latest: ' + feed)
      //        console.log(feed)
      //        ws.send(feed)
      //      })
      //    }
      //  }
      //})
    }, 10000)
  }

  start()

  // if connection closes we clear the timer and try to reconnect
  ws.onclose = (e) => {
    clearInterval(timer)
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
    if (!gotit) {
      find(req).then(file => {
        if (file) {
          gotit = true
          //console.log(req + ' is a blob, sending')
          //console.log(file)
          ws.send('blob:' + req + file)
        }
      })
    }
    setTimeout(function () {
      if (!gotit) {
        //console.log('WE do not have '+ req +', blasting for it ')
        blast(req)
      }
    }, 1000)
  } 
  if (req.length > 44) {
    if (req.startsWith('connect:')) {
      const got = document.getElementById(req)
      if (got) {
        got.parentNode.removeChild(got)
      }
      const connect = h('div', {classList: 'message'}, [
        h('a', {href: '#' + req.substring(8), id: req}, [getBoth(req.substring(8))]),
        ' connected.'
      ])
      scroller.insertBefore(connect, scroller.childNodes[1])
      if (req.substring(8) != keys.pubkey()) {
        if (Notification.permission === "granted") {
          const notification = new Notification(req.substring(8, 13) + ' connected.')
        }
      }
    }
    else if (req.startsWith('update')) {
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
                //console.log('Sending latest of ' + latest.author + ' to ' + ws.pubkey)
                ws.send(latest.raw)
              }
            })
          }
        })
      })
    } else if (req.startsWith('blob')) {
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
              //if (opened.previous != opened.hash) { 
              //  ws.send(opened.previous)
              //}
              const getMsg = document.getElementById(opened.hash)
              if (!getMsg) {
                const scroller = document.getElementById('scroller')
                render(opened).then(rendered => {
                  if (Notification.permission === "granted") {
                    const notification = new Notification(opened.author.substring(0, 5) + ': ' + opened.text)
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

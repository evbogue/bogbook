const sockets = new Set()
const outbox = new Map()

export let queue = []
let blastcache = []


export function gossipMsg (m, sender) {
  if (!queue.includes(m) && !blastcache.includes(m)) {
    queue.unshift(sender + m)
    blastcache.unshift(m)
    //console.log(m)
  } else {
    //console.log('caught in the blastcache!')
  }  
}

setInterval(function () {
  if (queue.length) {
    const m = queue.pop()
    sockets.forEach(s => {
      const sender = m.substring(0, 44)
      const msg = m.substring(44)
      if (s.pubkey != sender) { 
        s.send(msg) 
        console.log('send: ' + msg)
      } else {
        console.log('do not send to sender ' + sender)
      }
    })
    //console.log(queue.length)
  }
}, 25)

setInterval(function () {
  blastcache = []
}, 10000)

export function addSocket (s) {
  sockets.add(s)
  //console.log('Added')
}

export function rmSocket (s) {
  sockets.delete(s)
  //console.log('Removed')
}

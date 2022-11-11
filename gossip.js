const sockets = new Set()
const outbox = new Map()

export let queue = []
let blastcache = []

export function gossipMsg (m, pubkey) {
  // we do not use the pubkey yet, but we want to send it to the relay so the relay can have a better idea of who wants what messages
  if (!queue.includes(m) && !blastcache.includes(m)) {
    queue.unshift(m)
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
      s.send(m) 
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

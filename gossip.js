const sockets = new Set()

export let queue = []
let blastcache = []

export function gossipMsg (m, pubkey) {
  if (!queue.includes(m) && !blastcache.includes(m)) {
    queue.unshift(m)
    blastcache.unshift(m)
  } 
}

setInterval(function () {
  if (queue.length && sockets.size) {
    const m = queue.pop()
    sockets.forEach(s => {
      s.send(m) 
    })
  }
}, 25)

setInterval(function () {
  blastcache = []
}, 10000)

export function addSocket (s) {
  sockets.add(s)
}

export function rmSocket (s) {
  sockets.delete(s)
}

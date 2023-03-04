const sockets = new Set()

let blastcache = []

export function gossipMsg (m, pubkey) {
  if (!blastcache.includes(m)) {
    blastcache.unshift(m)
    sockets.forEach(s => {
      s.send(m) 
    })
  } 
}

setInterval(function () {
  blastcache = []
}, 10000)

export function addSocket (s) {
  sockets.add(s)
}

export function rmSocket (s) {
  sockets.delete(s)
}

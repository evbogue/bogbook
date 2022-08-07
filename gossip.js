const sockets = new Set()
const outbox = new Map()

export let queue = []

export function gossipMsg (m) {
  if (!queue.includes(m)) {
    queue.unshift(m)
    console.log(m)
  } else {
    //console.log('caught in the blastcache!')
  }  
}

setInterval(function () {
  if (queue.length) {
    const m = queue.pop()
    //console.log('SENDING: ' + m)
    sockets.forEach(s => s.send(m))
    //console.log(queue.length)
  }
}, 500)

export function addSocket (s) {
  sockets.add(s)
  //console.log('Added')
}

export function rmSocket (s) {
  sockets.delete(s)
  //console.log('Removed')
}

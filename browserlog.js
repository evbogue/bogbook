import { open } from './sbog.js'

const kv = new IdbKvStore('ssboat')

var log = []
var feeds = []

kv.get('log', function (err, file) {
  if (file) { 
    log = file
    log.sort((a,b) => a.timestamp - b.timestamp)
    kv.set('log', log)
  }
})

kv.get('feeds', function ( err, file) {
  if (file) { feeds = file }
  console.log(feeds)
})

let newData = false

export function save () {
  kv.set('log', log)
  kv.set('feeds', feeds)
}

setInterval(function () {
  if (newData) {
    kv.set('log', log)
    kv.set('feeds', feeds)
  } 
}, 10000)

export const logs = function logs (query) {
  return {
    getLog: async function () {
      return log
    },
    getFeed: function (query) {
      if (feeds[query]) {
        return feeds[query]
      }
    },
    query: async function (query) {
      if (query) {
        let querylog = []
        if (log.length) {
          for (let i = log.length -1; i >= 0; i--) {
            
            if ((log[i].raw.substring(0, 44) === query) || (log[i].raw.substring(44,88) == query)) {
              console.log(log[i])
              querylog.unshift(log[i])
            }
            if (query.startsWith('?')) {
              const search = query.substring(1).replace(/%20/g, ' ').toUpperCase()
              if (log[i].text.toUpperCase().includes(search)) {
                querylog.unshift(log[i])
              }
            }
            if (i === 0) {
              return querylog
            }
          }
        }
      } 
    },
    addMsg: function (msg) {
      open(msg).then(opened => {
        if (opened) {  
          if (msg.substring(0, 44) === msg.substring(88, 132)) {
            feeds[msg.substring(44,88)] = [msg]
            log.push(opened)
            newData = true
          } else {
            feeds[msg.substring(44,88)].unshift(msg)
            log.push(opened)
            newData = true
          }
        }
      })
    }
  }
}()



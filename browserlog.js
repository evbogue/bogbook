import { open } from './sbog.js'

const kv = new IdbKvStore('ssboat')

var log = []
var feeds = []

kv.get('log', function (err, file) {
  if (file) { log = file}
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
      } else {
        return undefined
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



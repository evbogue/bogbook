import { open } from './sbog.js'
import { blast } from './replicate.js'

const kv = new IdbKvStore('merklebog')

const store = new Map()

var log = []

export function save () {
  kv.set('log', log)
}

kv.get('log', function (err, file) {
  if (file) {
    log.sort((a,b) => a.substring(0, 13) - b.substring(0, 13))
    log = file
    log.forEach(msg => {
      open(msg).then(opened => {
        if (opened) {
          console.log(opened)
          store.set(opened.raw.substring(57, 101), opened)
        }
      })
    })
  }
})

let newData = false

setInterval(function () {
  if (newData) {
    log.sort((a,b) => a.substring(0, 13) - b.substring(0, 13))
    kv.set(log, log)
  }
}, 10000)

export const logs = function logs (query) {
  return {
    getLatest: async function (author) {
      if (log[0]) {
        for (let i = 0; i <= log.length; i++) {
          if (log[i].substring(13, 57) === author) {
            return log[i].substring(57, 101)
          }
        }
      } else { return undefined }
    },
    getLog: async function () {
      return log
    },
    get: async function (hash) {
      let msg
      msg = store.get(hash)
      if (msg) {
        return msg
      } else {
        msg = await kv.get(hash)
        if (msg) {
          store.set(msg.hash, msg)
          return msg
        } else {
          blast(hash)
        }
      }
    }, 
    add: function (msg) {
      open(msg).then(opened => {
        if (opened && !store.has(opened.hash)) {
          log.unshift(msg)
          store.set(opened.raw.substring(57, 101), opened)
          kv.set(opened.raw.substring(57, 101), opened)
          console.log(log)
          console.log(store)
          newData = true
        }
      })
    }
  }
}()

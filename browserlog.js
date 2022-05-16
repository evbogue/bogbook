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
        for (let i = log.length -1; i >= 0 ; i--) {
          if (log[i].substring(13, 57) === author) {
            return log[i].substring(57, 101)
          }
        }
      } else { return undefined }
    },
    getLog: async function () {
      return log
    },
    query: async function (query) {
      console.log('LOOKING FOR MATCHES TO ' + query)
      if (log[0]) {
        const querylog = []
        for (let i = log.length -1; i >= 0 ; i--) {
          if (log[i].substring(13, 57) === query) {
            querylog.unshift(log[i])
          }
          if (log[i].substring(57, 101) === query) {
            querylog.unshift(log[i])
          }
          if (query.startsWith('?')) {
            const msg = store.get(log[i].substring(57, 101))
            const search = query.substring(1).replace(/%20/g, ' ').toUpperCase()
            if (msg.text && msg.text.toUpperCase().includes(search)) {
              querylog.unshift(msg.raw)
            }
          }
          if (i === 0) {
            console.log(querylog)
            return querylog
          }
        }
      }
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
          log.push(msg)
          store.set(opened.raw.substring(57, 101), opened)
          kv.set(opened.raw.substring(57, 101), opened)
          newData = true
        }
      })
    }
  }
}()

import { open } from './sbog.js'
import { blast } from './replicate.js'

const kv = new IdbKvStore('merklebog')

const arraystore = []

var log = []

export function save () {
  kv.set('log', log)
}

kv.get('log', function (err, file) {
  if (file) {
    log = file
    log.map(msg => {
      open(msg).then(opened => {
        if (opened) {
          arraystore.push(opened)
        }
      })
    })
    arraystore.sort((a,b) => a.timestamp - b.timestamp)
  }
})

let newData = true

setInterval(function () {
  if (newData) {
    arraystore.sort((a,b) => a.timestamp - b.timestamp)
    kv.set(log, log)
    newData = false
  }
}, 10000)

export const logs = function logs (query) {
  return {
    getLatest: async function (author) {
      if (arraystore[0]) {
        const querylog = arraystore.filter(msg => msg.author == author)
        if (querylog[0]) {
          return querylog[querylog.length -1].hash
        } else {
          return undefined
        }
      } else { return undefined }
    },
    getLog: async function () {
      return arraystore
    },
    query: async function (query) {
      if (arraystore[0]) {
        if (query.startsWith('?')) {
          const querylog = arraystore.filter(msg => msg.text && msg.text.includes(query.substring(1)))
          return querylog 
        } else {
          const querylog = arraystore.filter(msg => msg.author == query || msg.hash == query)
          return querylog 
        }
      }
    },
    getNext: async function (hash) {
      if (arraystore[0]) {
        const findNext = arraystore.filter(msg => msg.previous == hash)
        if (findNext[0]) {
          return findNext[0].hash
        } else return undefined
      }
    },
    get: async function (hash) {
      const msgarray = arraystore.filter(msg => msg.hash == hash)
      if (msgarray[0]) {
        return msgarray[0]
      } else {
        blast(hash)
      }
    }, 
    add: function (msg) {
      open(msg).then(opened => {
        const dupe = arraystore.filter(msg => msg.hash === opened.hash)
        if (opened && !dupe[0]) {
          log.push(msg)
          arraystore.push(opened)
          newData = true
          save()
          blast(opened.hash)
        }
      })
    }
  }
}()

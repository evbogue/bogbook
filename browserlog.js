import { open } from './sbog.js'
import { blast } from './replicate.js'

const kv = new IdbKvStore('merklebog')

//const store = new Map()

const arraystore = []

var log = []

export function save () {
  kv.set('log', log)
}

kv.get('log', function (err, file) {
  if (file) {
    //log.sort((a,b) => new Date(new Number(a.substring(0, 13))) - new Date(new Number(b.substring(0, 13))))
    log = file
    log.map(msg => {
      open(msg).then(opened => {
        if (opened) {
          //console.log(opened)
          arraystore.push(opened)
          //store.set(opened.hash, opened)
        }
      })
    })
    arraystore.sort((a,b) => a.timestamp - b.timestamp)
    //log.forEach(msg => {
    //  open(msg).then(opened => {
    //    if (opened) {
    //      store.set(opened.raw.substring(57, 101), opened)
    //    }
    //  })
    //})
  }
})

let newData = true

setInterval(function () {
  if (newData) {
    //log.sort((a,b) => new Date(new Number(a.substring(0, 13))) - new Date(new Number(b.substring(0, 13))))
    arraystore.sort((a,b) => a.timestamp - b.timestamp)
    kv.set(log, log)
    newData = false
    //console.log('log should be sorted now')
  }
}, 10000)

export const logs = function logs (query) {
  return {
    getLatest: async function (author) {
      if (log[0]) {
        const querylog = arraystore.filter(msg => msg.author == author)
        if (querylog[0]) {
          //console.log(querylog[querylog.length -1])
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
      if (log[0]) {
        if (query.startsWith('?')) {
          const querylog = arraystore.filter(msg => msg.text.includes(query.substring(1)))
          return querylog 
        } else {
          const querylog = arraystore.filter(msg => msg.author == query || msg.hash == query)
          return querylog 
        }
        //const querylog = []
        //for (let i = log.length -1; i >= 0 ; i--) {
        //  if (log[i].substring(13, 57) === query) {
        //    querylog.unshift(log[i])
        //  }
        //  if (log[i].substring(57, 101) === query) {
        //    querylog.unshift(log[i])
        //  }
        //  if (query.startsWith('?')) {
        //    const msg = store.get(log[i].substring(57, 101))
        //    const search = query.substring(1).replace(/%20/g, ' ').toUpperCase()
        //    if (msg.text && msg.text.toUpperCase().includes(search)) {
        //      querylog.unshift(msg.raw)
        //    }
        //  }
        //  if (i === 0) {
        //    return querylog
        //  }
        //}
      }
    },
    thread: async function (query) {
      return querylog 
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
          //store.set(opened.hash, opened)
          //kv.set(opened.hash, opened)
          save()
          blast(opened.hash)
        }
      })
    }
  }
}()

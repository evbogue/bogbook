import { open } from './sbog.js'
import { blast } from './replicate.js'

const kv = new IdbKvStore('bogbook3')

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
    //arraystore.sort((a,b) => a.timestamp - b.timestamp)
  }
})

let newData = true

setInterval(function () {
  if (newData) {
    //arraystore.sort((a,b) => a.timestamp - b.timestamp)
    kv.set('log', log)
    newData = false
  }
}, 10000)

export const logs = function logs (query) {
  return {
    getLatest: async function (query) {
      if (arraystore[0]) {
        const querylog = arraystore.filter(msg => msg.author == query)
        if (querylog[0]) {
          querylog.sort((a,b) => a.timestamp - b.timestamp)
          return querylog[querylog.length - 1].hash
        }
      } 
    },
    getFeeds: async function () {
      const feeds = []
      
      arraystore.map(msg => {
        if (!feeds.includes(msg.author)) {
          feeds.push(msg.author)
        }
      })
      console.log(feeds)
      return feeds
    },
    getLog: async function () {
      arraystore.sort((a,b) => a.timestamp - b.timestamp)
      return arraystore
    },
    query: async function (query) {
      if (arraystore[0]) {
        if (query.startsWith('?')) {
          const querylog = arraystore.filter(msg => msg.text && msg.text.includes(query.substring(1)))
          querylog.sort((a,b) => a.timestamp - b.timestamp)
          return querylog 
        } else {
          const querylog = arraystore.filter(msg => msg.author == query || msg.hash == query)
          querylog.sort((a,b) => a.timestamp - b.timestamp)
          return querylog 
        }
      }
    },
    getNext: async function (hash) {
      if (arraystore[0]) {
        const findNext = arraystore.filter(msg => msg.previous == hash)
        if (findNext[0] && findNext[0].hash != hash) {
          //console.log(hash + '\'s next message is ' + findNext[0].hash)
          return findNext[0].hash
        }
      }
    },
    get: async function (hash) {
      const msgarray = arraystore.filter(msg => msg.hash == hash)
      if (msgarray[0]) {
        //console.log('we have ' + hash)
        return msgarray[0]
      } else {
        //console.log('we do not have ' + hash)
      }
    }, 
    add: function (msg) {
      open(msg).then(opened => {
        const dupe = arraystore.filter(message => message.hash === opened.hash)
        if (dupe[0]) {
          //console.log('we already have ' + opened.hash + ' not adding')
        }
        if (opened && !dupe[0]) {
          //console.log('we do not have ' + opened.hash + ' adding')
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

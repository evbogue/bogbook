import { open } from './sbog.js'
import { blast } from './replicate.js'

const kv = new IdbKvStore('ssboat')

var log = []
//var feeds = []
var feedlist = []

kv.get('log', function (err, file) {
  if (file) { 
    log = file
    log.sort((a,b) => a.timestamp - b.timestamp)
    kv.set('log', log)
    if (log[0]) {
      for (let i = log.length -1; i >= 0; i--) {
        if (!feedlist.includes(log[i].author)) {
          feedlist.push(log[i].author)
        }
      }
    }
  }
})

//kv.get('feeds', function ( err, file) {
//  if (file) { feeds = file }
//})

let newData = false

export function save () {
  kv.set('log', log)
//  kv.set('feeds', feeds)
}

setInterval(function () {
  if (newData && log[0]) {
    kv.set('log', log)
    log.sort((a,b) => a.timestamp - b.timestamp)
    for (let i = log.length -1; i >= 0; i--) {
      if (!feedlist.includes(log[i].author)) {
        feedlist.push(log[i].author)
      }
    }

  //  kv.set('feeds', feeds)
  } 
}, 10000)

export const logs = function logs (query) {
  return {
    getLog: async function () {
      return log
    },
    getFeeds: function () {
      return feedlist
    },
    //getFeed: function (query) {
    //  if (feeds[query]) {
    //    return feeds[query]
    //  }
    //},
    getLatest: async function (pubkey) {
      if (log[0]) {
        for (let i = log.length -1; i >= 0; i--) {
          if (log[i].raw.substring(44, 88) === pubkey) {
            console.log(log[i])
            return log[i]
          }
        }
      }
    },
    get: async function (hash) {
      if (log.length) {
        for (let i = log.length -1; i >= 0; i--) {
          if (log[i].raw.includes(hash)) {
            return log[i]
          }
        }
      }
    }, 
    query: async function (query) {
      if (query) {
        let querylog = []
        if (log[0]) {
          for (let i = log.length -1; i >= 0; i--) {
            
            if ((log[i].raw.substring(0, 44) === query) || (log[i].raw.substring(44,88) == query)) {
              querylog.unshift(log[i])
            }
            if (query.startsWith('?')) {
              const search = query.substring(1).replace(/%20/g, ' ').toUpperCase()
              if (log[i].text && log[i].text.toUpperCase().includes(search)) {
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
    add: function (msg) {
      open(msg).then(opened => {
        if (opened) {
          log.push(opened)
          newData = true
        } else {
          log.push(opened)
          newData = true
        }
      })
    }
    //addMsg: function (msg) {
    //  open(msg).then(opened => {
    //    if (opened) {  
    //      if (msg.substring(0, 44) === msg.substring(88, 132)) {
    //        feeds[msg.substring(44,88)] = [msg]
    //        log.push(opened)
    //        newData = true
    //      } else {
    //        feeds[msg.substring(44,88)].unshift(msg)
    //        log.push(opened)
    //        newData = true
    //      }
    //    }
    //  })
    //}
  }
}()

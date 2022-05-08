import { open } from './sbog.js'
import { ensureDir, exists } from 'https://deno.land/std@0.129.0/fs/mod.ts'

if (await exists(path + 'log')) {
  log = JSON.parse(await Deno.readTextFile(path + 'log'))
  log.sort((a,b) => a.timestamp - b.timestamp)
}

let newData = false

setInterval(function () {
  if (newData) {
    Deno.writeTextFile(path + 'log', JSON.stringify(log))
    Deno.writeTextFile(path + 'config.json', JSON.stringify(config))
    for (var key in feeds) {
      var value = feeds[key]
      Deno.writeTextFile(path + 'bogs/' + key, JSON.stringify(value))
    }
    newData = false
  } else {
    //console.log('No new data')
  }
}, 10000)

export const logs = function logs (query) {
  return {
    getLog: async function () {
      return log
    },
    //getFeeds: function () {
    //  return feeds
    //},
    //getFeed: function (query) {
    //  if (feeds[query]) {
    //    return feeds[query]
    //  }
    //},
    query: async function (query) {
      if (query) {
        let querylog = []
        if (log.length) {
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

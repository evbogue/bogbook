import { open } from './denobog.js'
import { ensureDir, exists } from 'https://deno.land/std@0.143.0/fs/mod.ts'
import { path } from './path.js'

const arraystore = []

var log = []

if (await exists(path.root() + 'log')) {
  var file = JSON.parse(await Deno.readTextFile(path.root() + 'log'))
  if (file) {
    log = file
    log.map(msg => {
      open(msg).then(opened => {
        if (opened) {
          arraystore.push(opened)
        }
      })
    })
  }
}

let newData = false

setInterval(function () {
  if (newData) {
    Deno.writeTextFile(path.root() + 'log', JSON.stringify(log))
    newData = false
  }
}, 10000)

export const logs = function logs (query) {
  return {
    getLatest: async function (author) {
      if (arraystore[0]) {
        const querylog = arraystore.filter(msg => msg.author == author)
        querylog.sort((a,b) => a.timestamp - b.timestamp)
        if (querylog[0]) {
          return querylog[querylog.length -1]
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
      return feeds
    },
    getLog: async function () {
      arraystore.sort((a,b) => a.timestamp - b.timestamp)
      return arraystore
    },
    get: async function (hash) {
      const msgarray = arraystore.filter(msg => msg.hash == hash)
      if (msgarray[0]) {
        return msgarray[0]
      }
    },
    add: function (msg) {
      open(msg).then(opened => {
        if (opened) {
          const dupe = arraystore.filter(msg => msg.hash === opened.hash)
          if (opened && !dupe[0]) {
            console.log('added ' + opened.hash + ' by ' + opened.author)
            log.push(msg)
            arraystore.push(opened)
            newData = true
          }
        }
      })
    }
  }
}()

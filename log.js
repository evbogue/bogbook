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
        } else { return undefined }
      } else { return undefined}
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
    getNext: async function (hash) {
      if (arraystore[0]) {
        const findNext = arraystore.filter(msg => msg.previous == hash)
        if (findNext[0]) {
          //console.log('NEXT: ' + findNext[0].hash)
          return findNext[0].hash
        } if (!findNext[0]) {
          //console.log('we do not have NEXT')
        }
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

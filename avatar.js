import { h, vb } from './lib/misc.js'
import { decode } from './lib/base64.js'
import { keys } from './browserkeys.js'
import { publish, open } from './sbog.js'
import { render } from './render.js'
import { logs, save } from './browserlog.js'
import { cache } from './cache.js'
import { make, find } from './inpfs.js'

const kv = new IdbKvStore('merklebog')

export function getImage (id) {
  let img = vb(decode(id), 256)
  img.classList = 'avatar'

  logs.getLog().then(log => {
    if (log[0]) {
      for (let i = 0; i < log.length; i++) {
        if (log[i].imaged === id) {
          const file = cache.get(log[i].image)
          if (file) {
            img.src = file
          } else {
            setTimeout(function () {
              const retry = cache.get(log[i].image)
              if (retry) {
                img.src = retry
              }
            }, 1000)
          }
        }
      }
    }
  })

  return img
}

export function getName (id) {
  const nameDiv = h('span')
  nameDiv.textContent = id.substring(0, 10) + '...'
  logs.getLog().then(log => {
    if (log[0]) {
      for (let i = 0; i < log.length; i++) {
        logs.get(log[i].substring(57, 101)).then(msg => {
          console.log(msg)
          find(msg.data).then(data => {
            if (data.startsWith('name:')) {
              find(data.substring(5, 49)).then(name => {
                if (name) {
                  nameDiv.textContent = name
                  kv.set('name:' + id, name) 
                }
              })
            }
          })
        })
      }
    }
  })
  return nameDiv
}

export function getBoth (id) {
  const both = h('a', {href: '#' + id}, [
    getImage(id),
    ' ',
    getName(id)
  ])
  return both
}

export function newName (id, div) {
  const input = h('input', {placeholder: 'Give a name to ' + id.substring(0, 10)})

  if (id === keys.pubkey()) {
    input.placeholder = 'Give yourself a name.'
  }

  const nameDiv = h('div', [
    input,
    h('button', {onclick: function () {
      if (input.value.length === keys.keypair().length) {
        alert('Error: Names cannot be the same length as your keypair!')
      }
      if (input.value) {
        make(input.value).then(made => {
          publish('name:' + made + id).then(msg => {
            open(msg).then(opened => {
              render(opened).then(rendered => {
                div.appendChild(rendered)
              })
              save()
            })
          })
        })
      } 
    }},['Publish'])
  ])

  return nameDiv
}

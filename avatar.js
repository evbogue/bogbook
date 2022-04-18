import { h, vb } from './lib/misc.js'
import { decode } from './lib/base64.js'
import { keys } from './browserkeys.js'
import { publish, open } from './sbog.js'
import { render } from './render.js'
import { logs } from './browserlog.js'

const kv = new IdbKvStore('ssboat')

export function getImage (id) {
  let img = vb(decode(id), 256)
  img.classList = 'avatar'  
  return img
}

export function getName (id) {
  const nameDiv = h('span')
  nameDiv.textContent = id.substring(0, 10) + '...'
  logs.getLog().then(log => {
    for (let i = 0; i < log.length; i++) {
      if (log[i].named === id) {
        nameDiv.textContent = log[i].name
        kv.set('name:' + id, log[i].name)
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
        const obj = {name: input.value, named: id}
        publish(obj).then(msg => {
          open(msg).then(opened => {
            render(opened).then(rendered => {
              div.appendChild(rendered)
            })
          })
        })
      } 
    }},['Publish'])
  ])

  return nameDiv
}

import { h, vb } from './lib/misc.js'
import { decode } from './lib/base64.js'
import { keys } from './browserkeys.js'
import { publish, open } from './sbog.js'
import { render } from './render.js'
import { logs, save } from './browserlog.js'
import { make, find } from './inpfs.js'

let imagecache = new Map()

let namecache = new Map()

setInterval(function () {
  imagecache.clear() 
  namecache.clear() 
}, 10000)

export function plainTextName (id) {
  const got = namecache.get(id)
  if (got) {
    return got
  } else {
    return id.substring(0, 10) + '...'
  }
}

export function getImage (id) {
  let img = vb(decode(id), 256)
  img.classList = 'avatar img-rounded'

  if (imagecache.has(id)) {
    const got = imagecache.get(id)
    img.src = got
  } else {
    logs.query(id).then(querylog => {
      if (querylog && querylog[0]) {
        querylog.forEach(msg => {
          if (!imagecache.has(id)) {

            if (msg.text && msg.text.startsWith('image:') && msg.text.substring(50) === id) {
              const query = msg.text.substring(6,50)
              find(query).then(image => {
                if (image) {
                  imagecache.set(id, image)
                  img.src = image
                }
              })
            }
          }
        })
      }
    })
  }
  return img
}

export function getName (id) {
  const nameDiv = h('span')
  nameDiv.textContent = id.substring(0, 10) + '...'
  if (namecache.has(id)) {
    const got = namecache.get(id)
    nameDiv.textContent = got
  } else {
    logs.query(id).then(querylog => {
      if (querylog && querylog[0]) {
        querylog.forEach(msg => {
          if (!namecache.has(id)) {
            if (msg.text && msg.text.startsWith('name:') && msg.text.substring(49) === id) {
              const query = msg.text.substring(5, 49)
              find(query).then(name => {
                namecache.set(id, name)
                nameDiv.textContent = name 
              })
            }
          }
        })
      }
    })
  }
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
    h('button', {classList: 'btn', onclick: function () {
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

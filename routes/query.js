import { h } from './../lib/misc.js'
import { getBoth, newName } from './../avatar.js'
import { logs } from './../browserlog.js'
import { keys } from './../browserkeys.js'
import { adder } from './../adder.js'
import { make } from './../inpfs.js'
import { publish, open } from './../sbog.js'
import { render } from './../render.js'
import { blast } from './../replicate.js'
import { composer } from './../composer.js'

function photoAdder (src, div) {
  const uploadButton = h('button', {title: 'New photo', classList: 'btn', onclick: function () {
    input.click()
  }}, ['📸  '])

  const buttonsDiv = h('span', [
    uploadButton
  ])

  const input = h('input', { type: 'file', style: 'display: none;', onchange: function (e) {
    const file = e.srcElement.files[0]
    const img = h('img', {classList: 'thumb'})
    const reader = new FileReader()
    reader.onloadend = function () {
      img.src = reader.result
      make(img.src).then(hash => {
        const imgDiv = h('div', [
          img,
          h('button', {classList: 'btn', onclick: function () {
            publish('image:' + hash + src).then(msg => {
              open(msg).then(opened => {
                render(opened).then(rendered => {
                  div.appendChild(rendered)
                  imgDiv.parentNode.removeChild(imgDiv)
                })
              })
            })
          }}, ['Publish'])
        ])
        buttonsDiv.appendChild(imgDiv)
      })
    }
    
    reader.readAsDataURL(file)
  }})

  return buttonsDiv
}

export function query (scroller, src) {
  const messageDiv = h('div')
  scroller.appendChild(messageDiv)
  const header = h('div', {classList: 'message'})
  messageDiv.appendChild(header)

  const nameDiv = h('span', [
    h('button', {title: 'New name', classList: 'btn',  onclick: function () {
      header.appendChild(newName(src, messageDiv))
      nameDiv.parentNode.removeChild(nameDiv)
    }}, ['🏷️'])
  ])

  const composeDiv = h('span', [
    h('button', {title: 'New reply', classList: 'btn',  onclick: function () {
      header.appendChild(composer({author: src, hash: src}))
      composeDiv.parentNode.removeChild(composeDiv)
    }}, ['📝'])
  ])

  if (src.length === 44) {
    if (src === keys.pubkey()) {
      header.appendChild(h('span', {classList: 'right'}, ['This is you.']))
    }
    header.appendChild(h('span', [getBoth(src), ' ']))
    header.appendChild(composeDiv)
    header.appendChild(nameDiv)
    header.appendChild(photoAdder(src, messageDiv))
  } else if (src.startsWith('?')) {
    header.appendChild(h('span', ['Search: ' + src.substring(1)]))
  }
  logs.query(src).then(log => {
    if (log && log[0]) {
      adder(log, src, scroller)
    } else {
      blast(src)
    }
  })
}

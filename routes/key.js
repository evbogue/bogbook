import { h } from './../lib/misc.js'
import { keys } from './../keys.js'
import { cachekv } from './../cachekv.js'

export function keyroute (scroller) {
  const textarea = h('textarea')
  if (keys === 'welcome') {
    textarea.placeholder = 'Import an existing keypair...'
  } else {
    textarea.value = keys.keypair()
  }
  const div = h('div', {classList: 'message'}, [
    //h('span', ['Import a keypair:']),
    textarea,
    h('button', {classList: 'btn btn-success', onclick: function () {
      if (textarea.value && (textarea.value.length === 132)) {
        cachekv.put('keypair', textarea.value).then(function () {
          location.hash = ''
          location.reload()
        })
      } if (textarea.value.length != keys.keypair().length) {
        alert('Invalid Keypair')
        textarea.value = keys.keypair()
      }
    }}, ['Import']),
    h('button', {classList: 'btn btn-danger', onclick: function () {
      cachekv.rm('keypair').then(function () {
        location.hash = ''
        location.reload()
      })
    }}, ['Delete Keypair']),
    h('button', {classList: 'btn btn-warning', onclick: function () {
      cachekv.clear().then(function () {
        location.hash = ''
        location.reload()
      })
    }}, ['Delete Everything'])
  ])

  if (scroller.childNodes[1]) {
    scroller.insertBefore(div, scroller.childNodes[1])
  } else {
    scroller.appendChild(div)
  }
}


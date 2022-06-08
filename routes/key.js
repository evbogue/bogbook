import { h } from './../lib/misc.js'
import { keys } from './../browserkeys.js'

const kv = new IdbKvStore('bogbook3')

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
    h('button', {onclick: function () {
      if (textarea.value && (textarea.value.length === 132)) {
        kv.set('keypair', textarea.value).then(function () {
          location.hash = ''
          location.reload()
        })
      } if (textarea.value.length != keys.keypair().length) {
        alert('Invalid Keypair')
        textarea.value = keys.keypair()
      }
    }}, ['Import']),
    h('button', {onclick: function () {
      kv.remove('keypair').then(function () {
        location.hash = ''
        location.reload()
      })
    }}, ['Delete Keypair']),
    h('button', {onclick: function () {
      kv.clear().then(function () {
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


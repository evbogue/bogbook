import { h } from './../lib/misc.js'
import { keys } from './../browserkeys.js'

const kv = new IdbKvStore('ssboat')

export function keyroute (scroller) {
  const textarea = h('textarea', [keys.keypair()])
  const div = h('div', {classList: 'message'}, [
    h('span', ['This is your keypair:']),
    textarea,
    h('button', {onclick: function () {
      if (textarea.value && (textarea.value.length === keys.keypair().length)) {
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

  scroller.appendChild(div)
}


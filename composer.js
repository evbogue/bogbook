import { h } from './lib/misc.js'
import { markdown } from './markdown.js'

const kv = new IdbKvStore('ssboat')

export function composer (src) {
  let preview = h('div')
  
  const textarea = h('textarea', {placeholder: 'Write a message...'})

  textarea.addEventListener('input', function (e) {
    /*if (textarea.value) {
      kv.set(src, textarea.value)
    } else {
      kv.remove(src)
    }*/
    preview.innerHTML = markdown(textarea.value)
  })

  const publish = h('button', {
    onclick: function () {
      alert('PUBLISHED!')
    }
  }, ['Publish'])

  const composer = h('div', [
    preview,
    textarea,
    publish
  ])
  return composer
}

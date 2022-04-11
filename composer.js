import { h } from './lib/misc.js'
import { markdown } from './markdown.js'
import { publish } from './sbog.js'
import { make, find } from './inpfs.js'

const kv = new IdbKvStore('ssboat')

export function composer (src) {
  if (!src) { src = 'home' }
  let preview = h('div')
  
  const textarea = h('textarea', {placeholder: 'Write a message...'})

  textarea.addEventListener('input', function (e) {
    if (textarea.value) {
      kv.set(src, textarea.value)
    } else {
      kv.remove(src)
    }
    preview.innerHTML = markdown(textarea.value)
  })

  kv.get(src).then(got => {
    if (got) {
      textarea.value = got
    }
  })

  const publish = h('button', {
    onclick: function () {
      if (textarea.value) {
        make({file: textarea.value, type: 'md'}).then(inpns => {
          console.log(inpns)
        })
      }
    }
  }, ['Publish'])

  const composer = h('div', [
    preview,
    textarea,
    publish
  ])

  return composer
}

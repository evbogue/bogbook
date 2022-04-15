import { h } from './lib/misc.js'
import { markdown } from './markdown.js'
import { publish, open } from './sbog.js'
import { make, find } from './inpfs.js'
import { save } from './browserlog.js'
import { render } from './render.js'


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

  const publishButton = h('button', {
    onclick: function () {
      if (textarea.value) {
        make({file: textarea.value, type: 'md'}).then(content => {
          publish(content).then(msg => {
            open(msg).then(opened => {
              render(opened).then(rendered => {
                scroller.insertBefore(rendered, scroller.childNodes[1])
                preview.innerHTML = ''
                textarea.value = ''
                kv.remove(src)
                save()
              }) 
            })
          })
        })
      }
    }
  }, ['Publish'])

  const composer = h('div', [
    preview,
    textarea,
    publishButton
  ])

  return composer
}

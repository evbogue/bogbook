import { h } from './lib/misc.js'
import { markdown } from './markdown.js'
import { publish, open } from './sbog.js'
import { make, find } from './inpfs.js'
import { save } from './browserlog.js'
import { render } from './render.js'
import { getName } from './avatar.js'

const kv = new IdbKvStore('ssboat')

export function composer (src) {
  let preview = h('div')
  
  const textarea = h('textarea', {placeholder: 'Write a message...'})

  if (!src) { 
    src = 'home' 
  } else if (src.length === 44) {
    var select = window.getSelection().toString()
    textarea.value = '↳ [' + (select || src.substring(0, 7)) + '](' + src + ')'  
  }

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
        publish(textarea.value).then(msg => {
          open(msg).then(opened => {
            render(opened).then(rendered => {
              const getMsg = document.getElementById(src)
              if (getMsg) {
                composer.parentNode.parentNode.removeChild(composer.parentNode)
                getMsg.appendChild(h('div', {classList: 'indent'}, [rendered]))
              } else {
                scroller.insertBefore(rendered, scroller.childNodes[1])
              }
              preview.innerHTML = ''
              textarea.value = ''
              kv.remove(src)
              save()
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

  if (src != 'home') {
    const cancelButton = h('button', {onclick: function () {
      composer.parentNode.parentNode.removeChild(composer.parentNode)
    }}, ['Cancel'])
    composer.appendChild(cancelButton)
  }

  return composer
}

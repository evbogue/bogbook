import { h } from './lib/misc.js'
import { markdown } from './markdown.js'
import { publish, open } from './sbog.js'
import { make, find } from './inpfs.js'
import { save, logs } from './browserlog.js'
import { render } from './render.js'
import { getName, getImage } from './avatar.js'

const kv = new IdbKvStore('ssboat')

function getContacts (textarea, preview) {
  const feeds = logs.getFeeds()
  var span = h('span')

  var button = h('button', {onclick: function () {
    if (!span.childNodes[1]) {
      var addrs = h('span')
      span.appendChild(addrs)
      Object.keys(feeds).forEach(function (key, index) {
        addrs.appendChild(h('button', {onclick: function () {
          kv.get('name:' + key).then(name => {
            if (textarea.selectionStart || textarea.selectionEnd) {
              textarea.value = textarea.value.substring(0, textarea.selectionStart)
                + ' [' + name + '](' + key + ') ' +
                textarea.value.substring(textarea.selectionEnd, textarea.value.length)
            } else {
              textarea.value = textarea.value + ' [' + name + '](' + key + ')'
            }
            preview.innerHTML = marked(textarea.value)
          })
        }}, [getImage(key), getName(key)]))
      })
    } else {
      span.removeChild(span.childNodes[1])
    }
  }}, ['📇 '])

  span.appendChild(button)

  return span
}


export function composer (msg) {
  let preview = h('div')
  
  const textarea = h('textarea', {placeholder: 'Write a message...'})

  let src

  if (msg) {
    src = msg.raw.substring(0, 44)
  } else {
    src = 'home'
  }

  if (src.length === 44) {
    kv.get('name:' + msg.author).then(name => {
      var select = window.getSelection().toString()
      if (msg.author === src) {
        textarea.value = '[' + name + '](' + msg.author + ')'
      } else {
        textarea.value = '[' + name + '](' + msg.author + ') ↳ [' + (select || src.substring(0, 7)) + '](' + src + ')'
      }
    })
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
        publish({text: textarea.value}).then(msg => {
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
    publishButton,
    getContacts(textarea, preview)
  ])

  if (src != 'home') {
    const cancelButton = h('button', {onclick: function () {
      composer.parentNode.parentNode.removeChild(composer.parentNode)
    }}, ['Cancel'])
    composer.appendChild(cancelButton)
  }

  return composer
}

import { h } from './lib/misc.js'
import { markdown } from './markdown.js'
import { publish, open } from './sbog.js'
import { make, find } from './inpfs.js'
import { save, logs } from './browserlog.js'
import { render } from './render.js'
import { getName, getImage, getBoth } from './avatar.js'

const kv = new IdbKvStore('drafts')

function getContacts (textarea, preview) {
  var span = h('span')

  var button = h('button', {classList: 'btn right', onclick: function () {
    if (!span.childNodes[1]) {
      var addrs = h('span')
      span.appendChild(addrs)

      logs.getFeeds().then(feeds => {
        feeds.map(feed => {
          addrs.appendChild(h('button', {classList: 'right btn', onclick: function () {
            kv.get('name:' + feed).then(name => {
              if (textarea.selectionStart || textarea.selectionEnd) {
                textarea.value = textarea.value.substring(0, textarea.selectionStart)
                  + ' [' + name + '](' + feed + ') ' +
                  textarea.value.substring(textarea.selectionEnd, textarea.value.length)
              } else {
                textarea.value = textarea.value + ' [' + name + '](' + feed + ')'
              }
              preview.innerHTML = marked(textarea.value)
            })
          }}, [getImage(feed), getName(feed)]))
        })
      })
    } else {
      span.removeChild(span.childNodes[1])
    }
  }}, ['📇 '])

  span.appendChild(button)

  return span
}

function photoAdder (textarea, preview) {

  const uploadButton = h('button', {classList: 'btn right', onclick: function () {
    input.click()
  }}, ['📸 '])


  const input = h('input', { type: 'file', style: 'display: none;', onchange: function (e) {
    for (let i = 0; i < e.srcElement.files.length; i++) {
      const file = e.srcElement.files[i]
      const img = h('img', {classList: 'thumb'})
      const reader = new FileReader()

      reader.onloadend = function () {
        img.src = reader.result
        make(img.src).then(hash => {
          if (textarea.selectionStart || textarea.selectionEnd) {
            textarea.value = textarea.value.substring(0, textarea.selectionStart)
              + ' ![](' + hash + ') ' +
              textarea.value.substring(textarea.selectionEnd, textarea.value.length)
          } else {
            textarea.value = textarea.value + ' ![](' + hash + ')'
          }
          setTimeout(function () {
            preview.innerHTML = markdown(textarea.value)
          }, 1000)
        })   
      }
      reader.readAsDataURL(file)
    }
  }})

  const buttonsDiv = h('span', [
    uploadButton,
    input
  ])

  return buttonsDiv
}

export function composer (msg) {
  let preview = h('div', [h('p', [' '])])
  
  const textarea = h('textarea', {placeholder: 'Write a message...'})

  if (msg.hash.length === 44) {
    kv.get('name:' + msg.author).then(name => {
      var select = window.getSelection().toString()
      if (!name) {
        name = msg.author.substring(0, 10) + '...'
      }
      if (msg.author === msg.hash) {
        textarea.value = '[' + name + '](' + msg.author + ') '
      } else {
        textarea.value = '[' + name + '](' + msg.author + ') ↳ [' + (select || msg.hash.substring(0, 7)) + '](' + msg.hash + ') '
      }
    })
  }

  textarea.addEventListener('input', function (e) {
    if (textarea.value) {
      kv.set('draft:' + msg.hash, textarea.value)
    } else {
      kv.remove('draft:' + msg.hash)
    }
    preview.innerHTML = markdown(textarea.value)
  })

  kv.get('draft:' + msg.hash).then(got => {
    if (got) {
      console.log(got)
      textarea.value = got
      preview.innerHTML = markdown(textarea.value)
      setTimeout(function () {
        preview.innerHTML = markdown(textarea.value)
      }, 1000)
    }
  })

  const publishButton = h('button', {
    classList: 'btn btn-primary',
    onclick: function () {
      if (textarea.value) {
        publish(textarea.value).then(published => {
          open(published).then(opened => {
            render(opened).then(rendered => {
              const getMsg = document.getElementById(msg.hash)
              if (getMsg) {
                compose.parentNode.parentNode.removeChild(compose.parentNode)
                getMsg.appendChild(h('div', {classList: 'indent'}, [rendered]))
              } else {
                scroller.insertBefore(rendered, scroller.childNodes[1])
              }
              preview.innerHTML = '<p></p>'
              textarea.value = ''
              kv.remove('draft:' + msg.hash)
              save()
            }) 
          })
        })
      }
    }
  }, ['Publish'])

  const compose = h('div', [
    preview,
    textarea,
    publishButton,
    photoAdder(textarea, preview),
    getContacts(textarea, preview)
  ])

  if (!(msg.hash === 'home' || msg.hash === msg.author)) {
    const cancelButton = h('button', {classList: 'btn btn-warning', onclick: function () {
      compose.parentNode.parentNode.removeChild(compose.parentNode)
    }}, ['Cancel'])
    compose.appendChild(cancelButton)
  }

  return compose
}

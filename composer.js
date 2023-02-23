import { h } from './lib/misc.js'
import { markdown } from './markdown.js'
import { publish, open } from './sbog.js'
import { make, find } from './blob.js'
import { save, logs } from './log.js'
import { render } from './render.js'
import { getName, getImage, getBoth } from './avatar.js'
import { blast } from './replicate.js'
import { cachekv } from './cachekv.js'

function getContacts (textarea, preview, msg) {
  var span = h('span')

  var button = h('button', {classList: 'btn right', onclick: function () {
    if (!span.childNodes[1]) {
      var addrs = h('span')
      span.appendChild(addrs)

      logs.getFeeds().then(feeds => {
        feeds.map(feed => {
          addrs.appendChild(h('button', {classList: 'btn', onclick: function () {
            cachekv.get('name:' + feed).then(got => {
              let name = feed.substring(0, 7) + '...'
              if (got) {
                name = got
              }
              if (textarea.selectionStart || textarea.selectionEnd) {
                textarea.value = textarea.value.substring(0, textarea.selectionStart)
                  + ' [' + name + '](' + feed + ') ' +
                  textarea.value.substring(textarea.selectionEnd, textarea.value.length)
              } else {
                textarea.value = textarea.value + ' [' + name + '](' + feed + ')'
              }
              setTimeout(function () {
                preview.innerHTML = marked(textarea.value)
                cachekv.put('draft:' + msg.hash, textarea.value)
              }, 50)
            })
          }}, [getImage(feed), ' ', getName(feed)]))
        })
      })
    } else {
      span.removeChild(span.childNodes[1])
    }
  }}, ['📇 '])

  span.appendChild(button)

  return span
}

function photoAdder (textarea, preview, msg) {

  const uploadButton = h('button', {classList: 'btn right', onclick: function () {
    input.click()
  }}, ['📸 '])

  const input = h('input', { type: 'file', style: 'display: none;'})
  const outputImage = h('img')

  input.addEventListener('change', (e) => {
    const file = e.target.files[0]
    const reader = new FileReader()

    reader.onload = (e) => {
      const canvas = document.createElement("canvas")
      const ctx = canvas.getContext("2d")
      const img = new Image()

      img.onload = () => {
        const size = 1024
        if (img.width > size || img.height > size) {
          const width = img.width
          const height = img.height
          let cropWidth
          let cropHeight

          if (width > height) {
            cropWidth = size
            cropHeight = cropWidth * (height / width)
          } else {
            cropHeight = size
            cropWidth = cropHeight * (width / height)
          }

          canvas.width = cropWidth
          canvas.height = cropHeight
          ctx.drawImage(img, 0, 0, width, height, 0, 0, cropWidth, cropHeight)
          const croppedImage = canvas.toDataURL()
          outputImage.src = croppedImage

          make(outputImage.src).then(hash => {
            if (textarea.selectionStart || textarea.selectionEnd) {
              textarea.value = textarea.value.substring(0, textarea.selectionStart)
                + ' ![](' + hash + ') ' +
                textarea.value.substring(textarea.selectionEnd, textarea.value.length)
            } else {
              textarea.value = textarea.value + ' ![](' + hash + ')'
            }
            preview.innerHTML = markdown(textarea.value)
          })
        } else {
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
              cachekv.put('draft:' + msg.hash, textarea.value)
            }, 50)
          })
        }
      }
      img.src = e.target.result
    }

    reader.readAsDataURL(file)
  })

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
    cachekv.get('name:' + msg.author).then(name => {
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
      cachekv.put('draft:' + msg.hash, textarea.value)
    } else {
      cachekv.rm('draft:' + msg.hash)
    }
    preview.innerHTML = markdown(textarea.value)
  })

  cachekv.get('draft:' + msg.hash).then(got => {
    if (got) {
      textarea.value = got
      preview.innerHTML = markdown(textarea.value)
    }
  })

  const publishButton = h('button', {
    classList: 'btn btn-primary',
    onclick: function () {
      if (textarea.value) {
        publish(textarea.value).then(published => {
          open(published).then(opened => {
            blast(opened.raw)
            blast(opened.data)
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
              cachekv.rm('draft:' + msg.hash)
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
    photoAdder(textarea, preview, msg),
    getContacts(textarea, preview, msg)
  ])

  if (!(msg.hash === 'home' || msg.hash === msg.author)) {
    const cancelButton = h('button', {classList: 'btn btn-warning', onclick: function () {
      compose.parentNode.parentNode.removeChild(compose.parentNode)
    }}, ['Cancel'])
    compose.appendChild(cancelButton)
  }

  return compose
}

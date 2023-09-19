import { h } from './lib/misc.js'
import { markdown } from './markdown.js'
import { publish, open } from './sbog.js'
import { make } from './blob.js'
import { save } from './log.js'
import { render } from './render.js'
import { blast } from './replicate.js'
import { cachekv } from './cachekv.js'
import { getContacts } from './contacts.js'

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
  const preview = h('div', [h('p', [' '])])
  
  const textarea = h('textarea', {placeholder: 'Write a message...'})

  const context = h('div')

  let contextText = ''

  if (msg.hash.length === 44) {
    cachekv.get('name:' + msg.author).then(name => {
      const select = window.getSelection().toString()
      if (!name) {
        name = msg.author.substring(0, 10) + '...'
      }
      if (msg.author === msg.hash) {
        contextText = '[' + name + '](' + msg.author + ') '
        context.innerHTML = marked(contextText)
      } else {
        contextText = '[' + name + '](' + msg.author + ') ↳ [' + (select || msg.hash.substring(0, 7)) + '](' + msg.hash + ') '
        context.innerHTML = marked(contextText)
      }
    })
  }

  textarea.addEventListener('input', () => {
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
        publish(contextText + '\n\n' + textarea.value).then(published => {
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
    context,
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

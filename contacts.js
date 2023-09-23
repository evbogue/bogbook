import { h } from './lib/misc.js'
import { markdown } from './markdown.js'
import { logs } from './log.js'
import { getName, getImage } from './avatar.js'
import { cachekv } from './cachekv.js'

function contactButton (feed, textarea, preview, msg) {
  const span = h('span')
  const contact = h('button', {classList: 'right', onclick: () => {
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
      preview.innerHTML = markdown(textarea.value)
      cachekv.put('draft:' + msg.hash, textarea.value)
    })
  }}, [getImage(feed), ' ', getName(feed)])
  span.appendChild(contact)
  return span
}

export function getContacts (textarea, preview, msg) {
  const span = h('span')
  const contactsButton = h('button', {classList: 'right', onclick: () => {
    if (!span.childNodes[1]) {
      const addrs = h('div')
      span.appendChild(addrs)

      logs.getFeeds().then(feeds => {
        feeds.map(feed => {
          addrs.appendChild(contactButton(feed, textarea, preview, msg))
        })
      })
    } else {
      span.removeChild(span.childNodes[1])
    }
  }}, ['📇 '])

  span.appendChild(contactsButton)

  return span
}


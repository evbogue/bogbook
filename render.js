import { getBoth } from './avatar.js'
import { h, human } from './lib/misc.js'
import { find } from './inpfs.js'
import { markdown } from './markdown.js'
import { composer } from './composer.js' 
import { keys } from './browserkeys.js'
import { logs } from './browserlog.js'
import { adder } from './adder.js'

export async function render (msg) {
  const src = msg.raw.substring(0, 44)
  const messageDiv = h('div', {id: src})
  const message = h('div', {classList: 'message'})
  messageDiv.appendChild(message)

  message.appendChild(h('span', {classList: 'right'}, [
    h('code', [msg.author.substring(0, 7)]),
    ' ',
    h('a', {href: '#' + src}, [
      human(new Date(msg.timestamp))
    ])
  ]))

  message.appendChild(getBoth(msg.author))

  if (msg.text) {
    const content = h('div', {innerHTML: markdown(msg.text)})
    message.appendChild(content)
  }

  const reply = h('button', {onclick: function () {
    const getReply = document.getElementById('reply:' + src)
    if (!getReply) {
      const replybox = h('div', {id: 'reply:' + src, classList: 'message'}, [
        h('span', {classList: 'right'}, ['Preview']),
        getBoth(keys.pubkey()),
        composer(msg.raw.substring(0, 44))
      ])
      if (replyDiv.firstChild) {
        replyDiv.insertBefore(replyBox, replyDiv.firstChild)
      } else {
        replyDiv.appendChild(replybox)
      }
    }
  }}, ['Reply'])

  message.appendChild(reply)

  const replyDiv = h('div', {classList: 'indent'})

  messageDiv.appendChild(replyDiv)

  logs.query('?' + src).then(log => {
    adder(log, src, replyDiv)
  })

  return messageDiv
} 

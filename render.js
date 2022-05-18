import { getBoth, getName } from './avatar.js'
import { h, human } from './lib/misc.js'
import { cache } from './cache.js'
import { markdown } from './markdown.js'
import { composer } from './composer.js' 
import { keys } from './browserkeys.js'
import { logs } from './browserlog.js'
import { adder } from './adder.js'
import { find } from './inpfs.js'

export async function render (msg) {

  const src = msg.hash
  const messageDiv = h('div', {id: src})
  const message = h('div', {classList: 'message'})
  messageDiv.appendChild(message)

  const timestamp = h('a', {href: '#' + src}, [human(new Date(msg.timestamp))])

  setInterval(function () {
    timestamp.textContent = human(new Date(msg.timestamp))
  }, 10000)

  message.appendChild(h('span', {classList: 'right'}, [
    h('code', [msg.author.substring(0, 7)]),
    ' ',
    timestamp
  ]))

  message.appendChild(getBoth(msg.author))

  const reply = h('button', {onclick: function () {
    const getReply = document.getElementById('reply:' + src)
    if (!getReply) {
      const replybox = h('div', {id: 'reply:' + src, classList: 'message'}, [
        h('span', {classList: 'right'}, ['Preview']),
        getBoth(keys.pubkey()),
        composer(msg)
      ])
      if (replyDiv.firstChild) {
        replyDiv.insertBefore(replyBox, replyDiv.firstChild)
      } else {
        replyDiv.appendChild(replybox)
      }
    }
  }}, ['Reply'])

  function contentRender(data, message) {
    if (data.startsWith('image:')) {

    } 
    if (data.startsWith('name:')) {
      console.log(data)
      const named = data.substring(49)
      find(data.substring(5, 49)).then(data => {
        if (data) {
          const content = h('span', [
            ' named ',
            h('a', {href: '#' + named}, [data])
          ])
          message.appendChild(content)
        } 
      }) 
    } else if (data) {
      const content = h('div', {innerHTML: markdown(data)})
      setTimeout(function () {
        content.innerHTML = markdown(data)
      }, 1000)
      message.appendChild(content)
      message.appendChild(reply)
    }
  }

  find(msg.data).then(data => {
    if (data) {
      contentRender(data, message)
    } 
    if (!data) {
      // do this in inpfs module blast(msg.data)
      setTimeout(function () {
        find(msg.data).then(data => {
          if (data) {
            contentRender(data, message)
          }
          if (!data) {
            message.appendChild(h('div', ['Not Found.']))
          }
        })
      }, 5000)
    }
  })

  //if (msg.text) {
  //  const content = h('div', {innerHTML: markdown(msg.text)})
  //  setTimeout(function () {
  //    content.innerHTML = markdown(msg.text)
  //  }, 1000)
  //  message.appendChild(content)
  //  message.appendChild(reply)
  //}

  //if (msg.name) {
  //  const content = h('span', [
  //    ' named ', 
  //    h('a', {href: '#' + msg.named}, [msg.name])
  //  ])
  //  message.appendChild(content)
  //}

  //if (msg.image) {
  //  const img = h('img', {classList: 'thumb'})
  //  const link = h('a', { href: '#' + msg.imaged}, [getName(msg.imaged)])
  //  const content = h('span', [
  //    ' posted an image of ',
  //    link, 
  //    ' '
  //  ])
  //  const image = cache.get(msg.image)
  //  if (image) {
  //    content.appendChild(h('img', {classList: 'avatar', src: image}))
  //  } else {
  //    setTimeout(function () {
  //      const retry = cache.get(msg.image)
  //      if (retry) {
  //        content.appendChild(h('img', {classList: 'avatar', src: retry}))
  //      }
  //    }, 1000)
  //  }
  //  message.appendChild(content) 
  //}

  const replyDiv = h('div', {classList: 'indent'})

  messageDiv.appendChild(replyDiv)

  logs.query('?' + src).then(log => {
    adder(log, src, replyDiv)
  })

  return messageDiv
} 

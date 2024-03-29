import { getBoth, getName } from './avatar.js'
import { h, human } from './lib/misc.js'
import { markdown } from './markdown.js'
import { composer } from './composer.js' 
import { keys } from './keys.js'
import { logs } from './log.js'
import { adder } from './adder.js'
import { find } from './blob.js'
import { blast } from './replicate.js'

export async function render (msg) {

  const src = msg.hash
  const message = h('div', {classList: 'message'})
  const messageDiv = h('div', {id: src}, [message])

  const timestamp = h('a', {href: '#' + src}, [human(new Date(msg.timestamp))])

  setInterval(function () {timestamp.textContent = human(new Date(msg.timestamp))}, 10000)

  const merklenav = h('code')

  if (msg.previous != msg.hash) {
    merklenav.appendChild(h('a', {href: '#' + msg.previous}, ['prev']))
  } else {
    merklenav.appendChild(h('span', ['root']))
  }
 
  message.appendChild(h('span', {classList: 'right'}, [
    h('code', [msg.author.substring(0, 7)]),
    ' ',
    merklenav,
    ' ',
    h('code', [h('a', {href: '#', onclick: function (e) {
      e.preventDefault()
      const raw = h('pre', {id: 'raw:' + msg.id},[JSON.stringify(msg)])
      const getRaw = document.getElementById('raw:' + msg.id)
      if (getRaw) {
        getRaw.parentNode.removeChild(getRaw)
      } else {
        message.appendChild(raw)
      }
    }}, ['raw'])]),
    ' ',
    timestamp
  ]))

  message.appendChild(getBoth(msg.author))

  const reply = h('button', {classList: 'btn', onclick: function () {
    const getReply = document.getElementById('reply:' + src)
    if (!getReply) {
      const replybox = h('div', {id: 'reply:' + src, classList: 'message'}, [
        h('code', {classList: 'right'}, ['Preview']),
        getBoth(keys.pubkey()),
        composer(msg)
      ])
      if (replyDiv.firstChild) {
        replyDiv.insertBefore(replybox, replyDiv.firstChild)
      } else {
        replyDiv.appendChild(replybox)
      }
    }
  }}, ['Reply'])

  function contentRender(data, content) {
    if (data.startsWith('image:')) {
      content.innerHTML = ''
      const named = data.substring(50)
      const hash = data.substring(6,50)
      find(hash).then(file => {
        if (file) {
          const span = h('span', [
            ' imaged ',
            h('a', {href: '#' + named}, [h('img', {classList: 'avatar', src: file})])
          ])
          content.appendChild(span)
        } else {
          blast(hash)
        }
      })  
    } else if (data.startsWith('name:')) {
      content.innerHTML = ''
      const named = data.substring(49)
      const hash = data.substring(5, 49)
      find(hash).then(file => {
        if (file) {
          const span = h('span', [
            ' named ',
            h('a', {href: '#' + named}, [file])
          ])
          content.appendChild(span)
        } else {
          blast(hash)
        }
      }) 
    } else {
      content.innerHTML = markdown(data)
    }
  }

  const content = h('div')

  let retries = 0
  
  function getData (hash, content) {
    find(hash).then(data => {
      if (data) {
        contentRender(data, content)
      } else if (retries < 5) {
        blast(hash)
        retries ++
        setTimeout(function () {
          getData(hash, content)
        }, 5000 * retries)
      }
    })
  }
  //content.innerHTML = markdown(msg.text)
  getData(msg.data, content)
  message.appendChild(content)
  message.appendChild(reply)

  const replyDiv = h('div', {classList: 'indent'})

  messageDiv.appendChild(replyDiv)

  logs.query('?' + src).then(log => {
    if (log[0]) {
      log.forEach(item => {
        const getMsg = document.getElementById(item.hash)
        if (!getMsg) {
          render(item).then(rendered => {
            replyDiv.appendChild(rendered)
          })
        }
      })
    }
  })

  logs.get(msg.previous).then(gotit => {
    if (!gotit) {
      blast(msg.previous)
    }
  })

  return messageDiv
} 

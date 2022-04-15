import { getBoth } from './avatar.js'
import { h, human } from './lib/misc.js'
import { find } from './inpfs.js'
import { markdown } from './markdown.js'

export async function render (msg) {
  const message = h('div', {classList: 'message'})
  console.log('rendering')

  message.appendChild(h('span', {classList: 'right'}, [
    h('code', [msg.author.substring(0, 7)]),
    ' ',
    h('a', {href: '#' + msg.raw.substring(0, 44)}, [
      human(new Date(msg.timestamp))
    ])
  ]))

  message.appendChild(getBoth(msg.author))
  if (msg.content) {
    const data = await find(msg.content) 
    console.log(data)
    const content = h('div', {innerHTML: markdown(data)})
    message.appendChild(content)
  }
  return message
} 

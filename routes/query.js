import { h } from './../lib/misc.js'
import { getBoth } from './../avatar.js'
import { logs } from './../browserlog.js'
import { keys } from './../browserkeys.js'
import { adder } from './../adder.js'

export function query (scroller, src) {
  const header = h('div', {classList: 'message'})
  if (src.length === 44) {
    if (src === keys.pubkey()) {
      header.appendChild(h('span', {classList: 'right'}, ['This is you.']))
    }
    header.appendChild(h('span', [getBoth(src)]))
  } else if (src.startsWith('?')) {
    header.appendChild(h('span', ['Search: ' + src.substring(1)]))
  }
  scroller.appendChild(header)

  logs.query(src).then(log => {
    adder(log, src, scroller)
  })  
} 

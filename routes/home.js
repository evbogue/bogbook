import { composer } from './../composer.js'
import { keys } from './../keys.js'
import { getBoth } from './../avatar.js'
import { h } from './../lib/misc.js'
import { logs } from './../log.js'
import { adder } from './../adder.js'

export function home (scroller) {

  const composemsg = h('div', {classList: 'message'}, [
    h('code', {classList: 'right'}, ['Preview']),
    getBoth(keys.pubkey()),
    composer({hash: 'home'})
  ])

  scroller.appendChild(composemsg)

  logs.getLog().then(log => {
    adder(log, '', scroller)
  })
}

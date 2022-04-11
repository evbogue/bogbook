import { composer } from './../composer.js'
import { keys } from './../browserkeys.js'
import { getBoth } from './../avatar.js'
import { h } from './../lib/misc.js'

export function home (scroller) {
  const composemsg = h('div', {classList: 'message'}, [
    getBoth(keys.pubkey()),
    composer()
  ])
  scroller.appendChild(composemsg)
}

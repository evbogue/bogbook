import { h } from './../lib/misc.js'
import { getBoth } from './../avatar.js'

export function pubhash (scroller, src) {
  scroller.appendChild(h('div', {classList: 'message'}, [getBoth(src)]))
} 

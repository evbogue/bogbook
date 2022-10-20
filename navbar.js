import { h } from './lib/misc.js'
import { keys } from './keys.js'
import { getBoth } from './avatar.js'

export function navbar (screen) {
  const profile = h('span', {id: 'navprofile'}, [getBoth(keys.pubkey())])
  const homepage = h('span', {id: 'navhome'}, [h('a', {href: '#'}, ['Home'])])
  const keypage = h('span', {id: 'navkey'}, [h('a', {href: '#key'}, ['Key'])])

  const navbar = h('div', {id: 'navbar'}, [
    h('p', [
      profile,
      ' ',
      homepage,
      ' ',
      keypage
    ])
  ])

  return navbar
}

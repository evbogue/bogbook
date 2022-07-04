import { h } from './lib/misc.js'
import { keys } from './browserkeys.js'
import { getBoth } from './avatar.js'

export function navbar (screen) {


  const profile = h('li', {id: 'navprofile'}, [getBoth(keys.pubkey())])
  const homepage = h('li', {id: 'navhome'}, [h('a', {href: '#'}, ['Home'])])
  const keypage = h('li', {id: 'navkey'}, [h('a', {href: '#key'}, ['Key'])])

  const navbar = h('div', {classList: 'navbar navbar-fixed-top'})
  const internal = h('div', {classList: 'navbar-inner'}, [
    h('ul', {classList: 'nav'}, [
      profile,
      homepage,
      keypage
    ])
  ])

  navbar.appendChild(internal)

  return navbar
}

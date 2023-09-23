import { navbar } from './navbar.js'
import { route } from './route.js'
import { connect } from './replicate.js'
import { h } from './lib/misc.js' 
import { keys } from './keysasync.js'
import { log } from './awaitlog.js'

if (!window.location.hash) { window.location = '#' }

console.log(await keys.keypair())
console.log(await log())

const proto = window.location.protocol === 'https:' ? 'wss://' : 'ws://'
const server = [proto + window.location.host + '/ws']

document.body.appendChild(navbar())

connect(server)

connect('wss://bogbook.com/ws')

route(document.body)


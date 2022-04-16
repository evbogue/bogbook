import { composer } from './../composer.js'
import { keys } from './../browserkeys.js'
import { getBoth } from './../avatar.js'
import { h } from './../lib/misc.js'
import { logs } from './../browserlog.js'
import { adder } from './../adder.js'

//async function addPosts (posts, scroller) {
//  console.log(posts)
//  console.log('add message')
//  posts.forEach(msg => {
//    render(msg).then(rendered => {
//      console.log(rendered)
//      scroller.appendChild(rendered)
//    })
//  })
//}

export function home (scroller) {

  const composemsg = h('div', {classList: 'message'}, [
    h('span', {classList: 'right'}, ['Preview']),
    getBoth(keys.pubkey()),
    composer()
  ])

  scroller.appendChild(composemsg)

  logs.getLog().then(log => {
    adder(log, '', scroller)
    //let index = 0

    //var reverse = log.slice().reverse()
    //var posts = reverse.slice(index, index + 25)
    //addPosts(posts, scroller).then(done => {
    //  index = index + 25
    //  window.onscroll = function (ev) {
    //    if (((window.innerHeight + window.scrollY) >= document.body.scrollHeight - 1000) && src === '') {
    //      posts = reverse.slice(index, index + 25)
    //      index = index + 25
    //      addPosts(posts, scroller)
    //    }
    //  }
    //})
  })
}

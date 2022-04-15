import { h } from './../lib/misc.js'
import { getBoth } from './../avatar.js'
import { logs } from './../browserlog.js'
import { render } from './../render.js'

async function addPosts (posts, scroller) {
  posts.forEach(msg => {
    render(msg).then(rendered => {
      console.log(rendered)
      scroller.appendChild(rendered)
    })
  })
}

export function query (scroller, src) {
  if (src.length === 44) {
    scroller.appendChild(h('div', {classList: 'message'}, [getBoth(src)]))
  } else if (src.startsWith('?')) {
    scroller.appendChild(h('div', {classList: 'message'}, ['Search: ' + src.substring(1)]))
  }
  logs.query(src).then(log => {
    let index = 0

    var reverse = log.slice().reverse()
    var posts = reverse.slice(index, index + 25)
    addPosts(posts, scroller).then(done => {
      index = index + 25
      window.onscroll = function (ev) {
        if (((window.innerHeight + window.scrollY) >= document.body.scrollHeight - 1000) && src === '') {
          posts = reverse.slice(index, index + 25)
          index = index + 25
          addPosts(posts, scroller)
        }
      }
    })

    //querylog.forEach(msg => {
    //  render(msg).then(rendered => {
    //    scroller.insertBefore(rendered, scroller.childNodes[1])
    //  }) 
    //})
  })  
} 

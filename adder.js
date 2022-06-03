import { render } from './render.js' 
import { logs } from './browserlog.js'
import { open } from './sbog.js'

async function addPosts (posts, div) {
  posts.forEach(msg => {
    const getMsg = document.getElementById(msg.hash)
    if (!getMsg) {
      render(msg).then(rendered => {
        div.appendChild(rendered)
      })
      //logs.get(msg.substring(57, 101)).then(got => {
      //  render(got).then(rendered => {
      //    div.appendChild(rendered)
      //  })
      //})
    }
  })
}

export function adder (log, src, div) {
  if (log && log[0]) {
    let index = 0

    var reverse = log.slice().reverse()
    var posts = reverse.slice(index, index + 25)
    addPosts(posts, div).then(done => {
      index = index + 25
      window.onscroll = function (ev) {
        if (
          ((window.innerHeight + window.scrollY) >= document.body.scrollHeight - 1000)
          && window.location.hash.substring(1) === src
        ) {
          posts = reverse.slice(index, index + 25)
          index = index + 25
          addPosts(posts, div)
        }
      }
    })
  }
}

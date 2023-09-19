import { render } from './render.js' 

const addPosts = async (posts, div) => {
  for (const post of posts) {
    const rendered = await render(post)
    div.appendChild(rendered)
  }
}

export const adder = (log, src, div) => {
  if (log && log[0]) {
    let index = 0

    const reverse = log.slice().reverse()
    let posts = reverse.slice(index, index + 25)

    addPosts(posts, div)
    index = index + 25

    window.onscroll = () => {
      if (((window.innerHeight + window.scrollY) >= document.body.scrollHeight - 1000) && window.location.hash.substring(1) === src) {
        posts = reverse.slice(index, index + 25)
        index = index + 25
        addPosts(posts, div)
      }
    }
  }
}

import { h } from './lib/misc.js'
import { find } from './blob.js'
import { blast } from './replicate.js'

const renderer = new marked.Renderer()

renderer.paragraph = function (paragraph) {
  var array = paragraph.split(' ')

  for (let i = 0; i < array.length; i++) {
    let word = array[i]
    if (word.startsWith('#')) {
      let end
      if ((word[word.length -1] === '.') || (word[word.length - 1] === ',') || (word[word.length -1] === ':') || (word[word.length -1] === '?')) {
        end = word[word.length - 1]
        word = word.substring(0, word.length - 1)
      }
      let counter = 0

      var hashtag = "<a href='#?" + word + "'>" + word + "</a><sup>(" + counter + ")</sup>"
      if (end) {
        hashtag = hashtag + end
      }
      array[i] = hashtag
    }
  }

  const newgraph = array.join(' ')

  return '<p>' + newgraph + '</p>' //+ '<br /><br />'
}

renderer.link = function (href, title, text) {
  if (href.length == 44 && !href.startsWith('http')) {
    href = '#' + href
    var link = marked.Renderer.prototype.link.call(this, href, title, text);
    return link
  } else {
    var link = marked.Renderer.prototype.link.call(this, href, title, text);
    return link
  }
}

renderer.image = function (src, unknown, title) {
  if (src.length === 44) {
    find(src).then(file => {
      if (file) {
        const div = document.getElementById(src)
        div.src = file
      } else {
        blast(src)
        setTimeout(function () {
          find(src).then(file => {
            if (file) {
              div.src = file
            }
          })
        }, 1000)
      }
    })
    return '<div><img id="' + src + '" title="' + title + '" class="thumb" /></div>'
  }
}

marked.setOptions({
  renderer: renderer
})

export function markdown (txt) {
  return '<p>' + marked(txt) + '</p>'
}

import { h } from './lib/misc.js'

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

      //  there is no log yet!
      //log.forEach(msg => {
      //  var search = word.toUpperCase()
      //  if (msg.text && msg.text.toUpperCase().includes(search)) {
      //  //if (msg.text && msg.text.toUpperCase().split(" ").indexOf(search)!= -1) {
      //    ++counter
      //  }
      //})
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
    //var image
    //if (cache[href]) {
    //  image = '<a href="#' + href +'"><img src="' + cache[href].image + '" class="avatar ' + cache[href].filter + '" /></a>'
    //  href = '#' + href
    //  var link = image + marked.Renderer.prototype.link.call(this, href, title, text);
    //  return link
    //} else {
      href = '#' + href
      var link = marked.Renderer.prototype.link.call(this, href, title, text);
      return link
    //}
  } else {
    var link = marked.Renderer.prototype.link.call(this, href, title, text);
    return link
  }
}

renderer.image = function (src, unknown, title) {
  if (src.length === 44) {
    //const image = cache.get(src)
    if (image) {
      return '<div><img src="' + image + '" title="' + title + '" class="thumb" /></div>'
    } else { return ''}
  }
}

marked.setOptions({
  renderer: renderer
})

export function markdown (txt) {
  return '<p>' + marked(txt) + '</p>'
}

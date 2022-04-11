// human-time by Dave Eddy https://github.com/bahamas10/human

export function human (seconds) {
  if (seconds instanceof Date)
    seconds = Math.round((Date.now() - seconds) / 1000);
  var suffix = seconds < 0 ? 'from now' : 'ago';
  seconds = Math.abs(seconds);

  var times = [
    seconds / 60 / 60 / 24 / 365, // years
    seconds / 60 / 60 / 24 / 30,  // months
    seconds / 60 / 60 / 24 / 7,   // weeks
    seconds / 60 / 60 / 24,       // days
    seconds / 60 / 60,            // hours
    seconds / 60,                 // minutes
    seconds                       // seconds
  ];
  var names = ['year', 'month', 'week', 'day', 'hour', 'minute', 'second'];

  for (var i = 0; i < names.length; i++) {
    var time = Math.floor(times[i]);
    var name = names[i];
    if (time > 1)
      name += 's';

    if (time >= 1)
      return time + ' ' + name + ' ' + suffix;
  }
  return 'now'
  //return '0 seconds ' + suffix;
}

// hscrpt by Dominic Tarr https://github.com/dominictarr/hscrpt/blob/master/LICENSE
export function h (tag, attrs, content) {
  if(Array.isArray(attrs)) content = attrs, attrs = {}
  var el = document.createElement(tag)
  for(var k in attrs) el[k] = attrs[k]
  if(content) content.forEach(function (e) {
    if(e) el.appendChild('string' == typeof e ? document.createTextNode(e) : e)
  })
  return el
}

// Visualize Buffer by Dominic Tarr https://github.com/dominictarr/visualize-buffer

export function vb (b, width) {
  width = width || 256
  var canvas = document.createElement('canvas')

  canvas.height = width
  canvas.width = width

  var ctx = canvas.getContext('2d')

  var blocks = Math.ceil(Math.sqrt(b.length*2))

  var B = Math.ceil(width/blocks)
  function rect(i, color) {
    var x = i % blocks
    var y = ~~(i / blocks)
    if(color < 12)
      ctx.fillStyle =
        'hsl('+(color/12)*360 + ',100%,50%)'
    else {
      ctx.fillStyle =
        'hsl(0,0%,'+~~(((color-12)/3)*100)+'%'
    }
    ctx.fillRect(x*B, y*B, B, B)
  }

  for(var i = 0; i < b.length; i++) {
    rect(2*i,     b[i] >> 4 & 15)
    rect(2*i + 1, b[i]      & 15)
  }

  var img = document.createElement('img')
  img.src = canvas.toDataURL()
  return img
}


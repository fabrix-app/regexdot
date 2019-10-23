export const regexdot = function (str, loose) {
  if (str instanceof RegExp) {
    return {keys: false, pattern: str}
  }
  const keys = []
  let c, d, o, tmp, ext,
    pattern = '',
    arr = str.split('/')

  arr[0] || arr.shift()


  while (tmp = arr.shift()) {
    c = tmp[0]
    d = tmp[1]
    console.log('BRK c', c)
    // if the first character is wildcard
    if (c === '*') {
      keys.push('wild')
      pattern += '/(.*)'
    }
    // otherwise if the first character is a parameter marker and not a message marker
    else if (c === ':' && d !== ':') {
      o = tmp.indexOf('?', 1)
      ext = tmp.indexOf('.', 1)
      keys.push(tmp.substring(1, !!~o ? o : !!~ext ? ext : tmp.length))
      pattern += !!~o && !~ext ? '(?:/([^/]+?))?' : '/([^/]+?)'
      if (!!~ext) {
        pattern += (!!~o ? '?' : '') + '\\' + tmp.substring(ext)
      }
    }
    // Lastly, if not a parameter marker or wildcard, assume it's a normal string
    else {
      pattern += '/' + tmp
    }
  }

  return {
    keys: keys,
    pattern: new RegExp('^' + pattern + (loose ? '(?=$|\/)' : '\/?$'), 'i')
  }
}

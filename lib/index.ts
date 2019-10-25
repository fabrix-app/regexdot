export const regexdot = function (str: string | RegExp, loose: boolean = false): { keys: boolean | string[], pattern: RegExp} {
  // Utility to take a regex and convert it to keys, pattern
  if (str instanceof RegExp) {
    return { keys: false, pattern: str }
  }

  // Dictionary of keys
  const keys: string[] = []
  let c: string,
    d: string,
    o: number,
    tmp: string,
    ext: number,
    pattern: string = '',
    arr: string[] = str.split('.')

  arr[0] || arr.shift()


  while (tmp = arr.shift()) {
    c = tmp[0]
    d = tmp[1]

    // if the first character is wildcard
    if (c === '*') {
      keys.push('wild')
      pattern += '\\.(.*)'
    }
    // otherwise if the first character is a parameter marker and not a message marker
    else if (c === ':' && d !== ':') {

      o = tmp.indexOf('?', 1)
      ext = -1 // tmp.indexOf('.', 1)

      keys.push(tmp.substring(1, !!~o
        ? o
        : !!~ext
          ? ext
          : tmp.length
      ))

      // If no extension or optional, use X, otherwise use Y
      pattern += !!~o && !~ext
        ? '(?:\\.([^\\.]+?))?'
        : '\\.([^\\.]+?)'

      // If no extension
      if (!!~ext) {
        pattern += (!!~o ? '?' : '') + '\\.' + tmp.substring(ext)
      }
    }
    // Lastly, if not a parameter marker or wildcard, assume it's a normal string
    else {
      pattern += '\\.' + tmp
    }
  }

  // Add the loose
  pattern += (loose ? '(?=$|\\.)' : '\\.?$')

  return {
    keys: keys,
    pattern: new RegExp('^' + pattern, 'i')
  }
}

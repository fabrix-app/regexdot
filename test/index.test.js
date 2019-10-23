"use strict"

const assert = require('assert')

const {regexdot} = require('../dist/index')

const hasNamedGroups = 'groups' in /x/.exec('x');

function run(route, path, loose) {
  let i = 0, out = {}, result = regexdot(route, !!loose)
  let matches = result.pattern.exec(path)
  if (matches === null) {
    return false
  }
  if (matches.groups) {
    return matches.groups
  }
  while (i < result.keys.length) {
    out[result.keys[i]] = matches[++i] || null;
  }
  return out
}

function raw(route, path, loose) {
  return regexdot(route, !!loose).pattern.exec(path)
}

const test = class {

}
test.prototype.toExec = function (route, path, params) {
  let out = run(route, path);
  assert.deepEqual(out, params, out ? `~> parsed "${path}" into correct params` : `~> route and "${path}" did not match`);
};

test.prototype.toLooseExec = function (route, path, params) {
  let out = run(route, path, true);
  assert.deepEqual(out, params, out ? `~> parsed "${path}" into correct params` : `~> route and "${path}" did not match`);
};

const t = new test()


describe('#regexdot', () => {
  describe('## export', () => {
    it('should test export', () => {
      assert.equal(typeof regexdot, 'function', 'exports a function')
      let foo = regexdot('/')
      assert.equal(typeof foo, 'object', 'output is an object');
      assert.ok(foo.pattern, '~> has "pattern" key');
      assert.ok(foo.pattern instanceof RegExp, '~~> is a RegExp')
      assert.ok(foo.keys, '~> has "keys" key');
      assert.ok(Array.isArray(foo.keys), '~~> is an Array');
    })
  })
  describe('## usage', () => {
    it('should ensure no lead dot', () => {
      assert.deepEqual(regexdot('/'), regexdot(''), '~> root');
      assert.deepEqual(regexdot('/books'), regexdot('books'), '~> static');
      assert.deepEqual(regexdot('/books/:title'), regexdot('books/:title'), '~> param');
      assert.deepEqual(regexdot('/books/:title?'), regexdot('books/:title?'), '~> optional');
      assert.deepEqual(regexdot('/books/*'), regexdot('books/*'), '~> wildcard');
    })
  })
  describe('## static', () => {
    it('should test static', () => {
      let {keys, pattern} = regexdot('/books')
      assert.deepEqual(keys, [], '~> empty keys');
      assert.equal(pattern.test('/books'), true, '~> matches route');
      assert.equal(pattern.test('/books/'), true, '~> matches trailing slash');
      assert.equal(pattern.test('/books/author'), false, '~> does not match extra bits');
      assert.equal(pattern.test('books'), false, '~> does not match path without lead slash');
    })
  })
  describe('## multiples', () => {
    it('should test multiples', () => {
      let {keys, pattern} = regexdot('/foo/bar');
      assert.deepEqual(keys, [], '~> empty keys');
      assert.equal(pattern.test('/foo/bar'), true, '~> matches route');
      assert.equal(pattern.test('/foo/bar/'), true, '~> matches trailing slash');
      assert.equal(pattern.test('/foo/bar/baz'), false, '~> does not match extra bits');
      assert.equal(pattern.test('foo/bar'), false, '~> does not match path without lead slash');
    })
    describe('## params', () => {
      describe('### param :: static', () => {
        describe('#### param :: static :: none', () => {
          it('should param :: static :: none', () => {
            let {keys, pattern} = regexdot('/books/:title');
            assert.deepEqual(keys, ['title'], '~> keys has "title" value');
            assert.equal(pattern.test('/books'), false, '~> does not match naked base');
            assert.equal(pattern.test('/books/'), false, '~> does not match naked base w/ trailing slash');
            assert.equal(pattern.test('/books/narnia'), true, '~> matches definition');
            assert.equal(pattern.test('/books/narnia/'), true, '~> matches definition w/ trailing slash');
            assert.equal(pattern.test('/books/narnia/hello'), false, '~> does not match extra bits');
            assert.equal(pattern.test('books/narnia'), false, '~> does not match path without lead slash');
            let [path, value] = pattern.exec('/books/narnia');

            assert.equal(path, '/books/narnia', '~> executing pattern on correct trimming');
            assert.equal(value, 'narnia', '~> executing pattern gives correct value');

          })
        })
        describe('#### param :: static :: multiple', () => {
          it('should param :: static :: multiple', () => {
            let {keys, pattern} = regexdot('/foo/bar/:title');
            assert.deepEqual(keys, ['title'], '~> keys has "title" value');
            assert.equal(pattern.test('/foo/bar'), false, '~> does not match naked base');
            assert.equal(pattern.test('/foo/bar/'), false, '~> does not match naked base w/ trailing slash');
            assert.equal(pattern.test('/foo/bar/narnia'), true, '~> matches definition');
            assert.equal(pattern.test('/foo/bar/narnia/'), true, '~> matches definition w/ trailing slash');
            assert.equal(pattern.test('/foo/bar/narnia/hello'), false, '~> does not match extra bits');
            assert.equal(pattern.test('foo/bar/narnia'), false, '~> does not match path without lead slash');
            assert.equal(pattern.test('/foo/narnia'), false, '~> does not match if statics are different');
            assert.equal(pattern.test('/bar/narnia'), false, '~> does not match if statics are different');

            let [path, value] = pattern.exec('/foo/bar/narnia');
            assert.equal(path, '/foo/bar/narnia', '~> executing pattern on correct trimming');
            assert.equal(value, 'narnia', '~> executing pattern gives correct value');
          })
        })
      })
      describe('### param :: multiple', () => {
        it('should param :: multiple', () => {
          let {keys, pattern} = regexdot('/books/:author/:title');
          assert.deepEqual(keys, ['author', 'title'], '~> keys has "author" & "title" values');
          assert.equal(pattern.test('/books'), false, '~> does not match naked base');
          assert.equal(pattern.test('/books/'), false, '~> does not match naked base w/ trailing slash');
          assert.equal(pattern.test('/books/smith'), false, '~> does not match insufficient parameter counts');
          assert.equal(pattern.test('/books/smith/'), false, '~> does not match insufficient paramters w/ trailing slash');
          assert.equal(pattern.test('/books/smith/narnia'), true, '~> matches definition');
          assert.equal(pattern.test('/books/smith/narnia/'), true, '~> matches definition w/ trailing slash');
          assert.equal(pattern.test('/books/smith/narnia/reviews'), false, '~> does not match extra bits');
          assert.equal(pattern.test('books/smith/narnia'), false, '~> does not match path without lead slash');

          let [path, author, title] = pattern.exec('/books/smith/narnia');
          assert.equal(path, '/books/smith/narnia', '~> executing pattern on correct trimming');
          assert.equal(author, 'smith', '~> executing pattern gives correct value');
          assert.equal(title, 'narnia', '~> executing pattern gives correct value');
        });
      })

      describe('### param :: suffix', () => {
        it('should param :: suffix', () => {
          let {keys, pattern} = regexdot('/movies/:title.mp4');
          assert.deepEqual(keys, ['title'], '~> keys has "title" only (no suffix)');
          assert.equal(pattern.test('/movies'), false, '~> does not match naked base');
          assert.equal(pattern.test('/movies/'), false, '~> does not match naked base w/ trailing slash');
          assert.equal(pattern.test('/movies/foo'), false, '~> does not match without suffix');
          assert.equal(pattern.test('/movies/foo.mp3'), false, '~> does not match with wrong suffix');
          assert.equal(pattern.test('/movies/foo.mp4'), true, '~> does match with correct suffix');
          assert.equal(pattern.test('/movies/foo.mp4/'), true, '~> does match with trailing slash');
        })

      })
      describe('### param :: suffices', () => {
        it('should param :: suffices', () => {
          let {keys, pattern} = regexdot('/movies/:title.(mp4|mov)');
          assert.deepEqual(keys, ['title'], '~> keys has "title" only (no suffix)');
          assert.ok(!pattern.test('/movies'), '~> does not match naked base');
          assert.ok(!pattern.test('/movies/'), '~> does not match naked base w/ trailing slash');
          assert.ok(!pattern.test('/movies/foo'), '~> does not match without suffix');
          assert.ok(!pattern.test('/movies/foo.mp3'), '~> does not match with wrong suffix');
          assert.ok(pattern.test('/movies/foo.mp4'), '~> does match with correct suffix (mp4)');
          assert.ok(pattern.test('/movies/foo.mp4/'), '~> does match with trailing slash (mp4)');
          assert.ok(pattern.test('/movies/foo.mov'), '~> does match with correct suffix (mov)');
          assert.ok(pattern.test('/movies/foo.mov/'), '~> does match with trailing slash (mov)');
        });
      })
      describe('### param :: optional', () => {
        it('should param :: optional', () => {
          let {keys, pattern} = regexdot('/books/:author/:title?');
          assert.deepEqual(keys, ['author', 'title'], '~> keys has "author" & "title" values');
          assert.ok(!pattern.test('/books'), '~> does not match naked base');
          assert.ok(!pattern.test('/books/'), '~> does not match naked base w/ trailing slash');
          assert.ok(pattern.test('/books/smith'), '~> matches when optional parameter is missing counts');
          assert.ok(pattern.test('/books/smith/'), '~> matches when optional paramter is missing w/ trailing slash');
          assert.ok(pattern.test('/books/smith/narnia'), '~> matches when fully populated');
          assert.ok(pattern.test('/books/smith/narnia/'), '~> matches when fully populated w/ trailing slash');
          assert.ok(!pattern.test('/books/smith/narnia/reviews'), '~> does not match extra bits');
          assert.ok(!pattern.test('books/smith/narnia'), '~> does not match path without lead slash');
          let [_, author, title] = pattern.exec('/books/smith/narnia');
          assert.equal(author, 'smith', '~> executing pattern gives correct value');
          assert.equal(title, 'narnia', '~> executing pattern gives correct value');
        });

        it('should param :: optional :: static :: none', () => {
          let {keys, pattern} = regexdot('/:title?');
          assert.deepEqual(keys, ['title'], '~> keys has "title" value');
          assert.ok(pattern.test('/'), '~> matches root w/ trailing slash');
          assert.ok(pattern.test('/narnia'), '~> matches definition');
          assert.ok(pattern.test('/narnia/'), '~> matches definition w/ trailing slash');
          assert.ok(!pattern.test('/narnia/reviews'), '~> does not match extra bits');
          assert.ok(!pattern.test('narnia'), '~> does not match path without lead slash');
          let [_, value] = pattern.exec('/narnia');
          assert.equal(value, 'narnia', '~> executing pattern gives correct value');
        });

        it('param :: optional :: multiple', () => {
          let {keys, pattern} = regexdot('/books/:genre/:author?/:title?');
          assert.deepEqual(keys, ['genre', 'author', 'title'], '~> keys has "genre", "author" & "title" values');
          assert.ok(!pattern.test('/books'), '~> does not match naked base');
          assert.ok(!pattern.test('/books/'), '~> does not match naked base w/ trailing slash');
          assert.ok(pattern.test('/books/horror'), '~> matches when optional parameter is missing counts');
          assert.ok(pattern.test('/books/horror/'), '~> matches when optional paramter is missing w/ trailing slash');
          assert.ok(pattern.test('/books/horror/smith'), '~> matches when optional parameter is missing counts');
          assert.ok(pattern.test('/books/horror/smith/'), '~> matches when optional paramter is missing w/ trailing slash');
          assert.ok(pattern.test('/books/horror/smith/narnia'), '~> matches when fully populated');
          assert.ok(pattern.test('/books/horror/smith/narnia/'), '~> matches when fully populated w/ trailing slash');
          assert.ok(!pattern.test('/books/horror/smith/narnia/reviews'), '~> does not match extra bits');
          assert.ok(!pattern.test('books/horror/smith/narnia'), '~> does not match path without lead slash');
          let [_, genre, author, title] = pattern.exec('/books/horror/smith/narnia');
          assert.equal(genre, 'horror', '~> executing pattern gives correct value');
          assert.equal(author, 'smith', '~> executing pattern gives correct value');
          assert.equal(title, 'narnia', '~> executing pattern gives correct value');
        })
      })
    })
    describe('### wildcard', () => {
      it('wildcard', () => {
        let {keys, pattern} = regexdot('/books/*');
        assert.deepEqual(keys, ['wild'], '~> keys has "wild" value');
        assert.ok(!pattern.test('/books'), '~> does not match naked base');
        assert.ok(pattern.test('/books/'), '~> does not match naked base w/ trailing slash');
        assert.ok(pattern.test('/books/narnia'), '~> matches definition');
        assert.ok(pattern.test('/books/narnia/'), '~> matches definition w/ trailing slash');
        assert.ok(pattern.test('/books/narnia/reviews'), '~> does not match extra bits');
        assert.ok(!pattern.test('books/narnia'), '~> does not match path without lead slash');
        let [_, value] = pattern.exec('/books/narnia/reviews');
        assert.equal(value, 'narnia/reviews', '~> executing pattern gives ALL values after base');
      })

      describe('#### wildcard :: root', () => {

        it('wildcard :: root', () => {
          let {keys, pattern} = regexdot('*');
          assert.deepEqual(keys, ['wild'], '~> keys has "wild" value');
          assert.ok(pattern.test('/'), '~> matches root path');
          assert.ok(pattern.test('/narnia'), '~> matches definition');
          assert.ok(pattern.test('/narnia/'), '~> matches definition w/ trailing slash');
          assert.ok(pattern.test('/narnia/reviews'), '~> does not match extra bits');
          assert.ok(!pattern.test('narnia'), '~> does not match path without lead slash');
          let [_, value] = pattern.exec('/foo/bar/baz');
          assert.equal(value, 'foo/bar/baz', '~> executing pattern gives ALL values together');
        });
      })
    })
  })

//
  describe('#execs', () => {
    it('execs', () => {
      // false = did not match

      console.log('/books');
      t.toExec('/books', '/', false);
      t.toExec('/books', '/books', {});
      t.toExec('/books', '/books/', {});
      t.toExec('/books', '/books/world/', false);
      t.toExec('/books', '/books/world', false);

      console.log('/:title');
      t.toExec('/:title', '/hello', {title: 'hello'});
      t.toExec('/:title', '/hello/', {title: 'hello'});
      t.toExec('/:title', '/hello/world/', false);
      t.toExec('/:title', '/hello/world', false);
      t.toExec('/:title', '/', false);

      console.log('/:title?');
      t.toExec('/:title?', '/', {title: null});
      t.toExec('/:title?', '/hello', {title: 'hello'});
      t.toExec('/:title?', '/hello/', {title: 'hello'});
      t.toExec('/:title?', '/hello/world/', false);
      t.toExec('/:title?', '/hello/world', false);

      console.log('/:title.mp4');
      t.toExec('/:title.mp4', '/hello.mp4', {title: 'hello'});
      t.toExec('/:title.mp4', '/hello.mp4/', {title: 'hello'});
      t.toExec('/:title.mp4', '/hello.mp4/history/', false);
      t.toExec('/:title.mp4', '/hello.mp4/history', false);
      t.toExec('/:title.mp4', '/', false);

      console.log('/:title/:genre');
      t.toExec('/:title/:genre', '/hello/world', {title: 'hello', genre: 'world'});
      t.toExec('/:title/:genre', '/hello/world/', {title: 'hello', genre: 'world'});
      t.toExec('/:title/:genre', '/hello/world/mundo/', false);
      t.toExec('/:title/:genre', '/hello/world/mundo', false);
      t.toExec('/:title/:genre', '/hello/', false);
      t.toExec('/:title/:genre', '/hello', false);

      console.log('/:title/:genre?');
      t.toExec('/:title/:genre?', '/hello', {title: 'hello', genre: null});
      t.toExec('/:title/:genre?', '/hello/', {title: 'hello', genre: null});
      t.toExec('/:title/:genre?', '/hello/world', {title: 'hello', genre: 'world'});
      t.toExec('/:title/:genre?', '/hello/world/', {title: 'hello', genre: 'world'});
      t.toExec('/:title/:genre?', '/hello/world/mundo/', false);
      t.toExec('/:title/:genre?', '/hello/world/mundo', false);

      console.log('/books/*')
      t.toExec('/books/*', '/books', false);
      t.toExec('/books/*', '/books/', {wild: null});
      t.toExec('/books/*', '/books/world', {wild: 'world'});
      t.toExec('/books/*', '/books/world/', {wild: 'world/'});
      t.toExec('/books/*', '/books/world/howdy', {wild: 'world/howdy'});
      t.toExec('/books/*', '/books/world/howdy/', {wild: 'world/howdy/'});

      console.log('/books/*?')
      t.toExec('/books/*?', '/books', false);
      t.toExec('/books/*?', '/books/', {wild: null});
      t.toExec('/books/*?', '/books/world', {wild: 'world'});
      t.toExec('/books/*?', '/books/world/', {wild: 'world/'});
      t.toExec('/books/*?', '/books/world/howdy', {wild: 'world/howdy'});
      t.toExec('/books/*?', '/books/world/howdy/', {wild: 'world/howdy/'});
    })
  })
  describe('##loose', () => {

    it('execs :: loose', () => {
      // false = did not match

      console.log('/books')
      t.toLooseExec('/books', '/', false);
      t.toLooseExec('/books', '/books', {});
      t.toLooseExec('/books', '/books/', {});
      t.toLooseExec('/books', '/books/world/', {});
      t.toLooseExec('/books', '/books/world', {});

      console.log('/:title')
      t.toLooseExec('/:title', '/hello', {title: 'hello'});
      t.toLooseExec('/:title', '/hello/', {title: 'hello'});
      t.toLooseExec('/:title', '/hello/world/', {title: 'hello'});
      t.toLooseExec('/:title', '/hello/world', {title: 'hello'});
      t.toLooseExec('/:title', '/', false);

      console.log('/:title?')
      t.toLooseExec('/:title?', '/', {title: null});
      t.toLooseExec('/:title?', '/hello', {title: 'hello'});
      t.toLooseExec('/:title?', '/hello/', {title: 'hello'});
      t.toLooseExec('/:title?', '/hello/world/', {title: 'hello'});
      t.toLooseExec('/:title?', '/hello/world', {title: 'hello'});

      console.log('/:title.mp4')
      t.toLooseExec('/:title.mp4', '/hello.mp4', {title: 'hello'});
      t.toLooseExec('/:title.mp4', '/hello.mp4/', {title: 'hello'});
      t.toLooseExec('/:title.mp4', '/hello.mp4/history/', {title: 'hello'});
      t.toLooseExec('/:title.mp4', '/hello.mp4/history', {title: 'hello'});
      t.toLooseExec('/:title.mp4', '/', false);

      console.log('/:title/:genre')
      t.toLooseExec('/:title/:genre', '/hello/world', {title: 'hello', genre: 'world'});
      t.toLooseExec('/:title/:genre', '/hello/world/', {title: 'hello', genre: 'world'});
      t.toLooseExec('/:title/:genre', '/hello/world/mundo/', {title: 'hello', genre: 'world'});
      t.toLooseExec('/:title/:genre', '/hello/world/mundo', {title: 'hello', genre: 'world'});
      t.toLooseExec('/:title/:genre', '/hello/', false);
      t.toLooseExec('/:title/:genre', '/hello', false);

      console.log('/:title/:genre?')
      t.toLooseExec('/:title/:genre?', '/hello', {title: 'hello', genre: null});
      t.toLooseExec('/:title/:genre?', '/hello/', {title: 'hello', genre: null});
      t.toLooseExec('/:title/:genre?', '/hello/world', {title: 'hello', genre: 'world'});
      t.toLooseExec('/:title/:genre?', '/hello/world/', {title: 'hello', genre: 'world'});
      t.toLooseExec('/:title/:genre?', '/hello/world/mundo/', {title: 'hello', genre: 'world'});
      t.toLooseExec('/:title/:genre?', '/hello/world/mundo', {title: 'hello', genre: 'world'});

      console.log('/books/*')
      t.toLooseExec('/books/*', '/books', false);
      t.toLooseExec('/books/*', '/books/', {wild: null});
      t.toLooseExec('/books/*', '/books/world', {wild: 'world'});
      t.toLooseExec('/books/*', '/books/world/', {wild: 'world/'});
      t.toLooseExec('/books/*', '/books/world/howdy', {wild: 'world/howdy'});
      t.toLooseExec('/books/*', '/books/world/howdy/', {wild: 'world/howdy/'});

      console.log('/books/*?')
      t.toLooseExec('/books/*?', '/books', false);
      t.toLooseExec('/books/*?', '/books/', {wild: null});
      t.toLooseExec('/books/*?', '/books/world', {wild: 'world'});
      t.toLooseExec('/books/*?', '/books/world/', {wild: 'world/'});
      t.toLooseExec('/books/*?', '/books/world/howdy', {wild: 'world/howdy'});
      t.toLooseExec('/books/*?', '/books/world/howdy/', {wild: 'world/howdy/'});
    })

    it('(raw) exec', () => {
      console.log('/foo ~> "/foo"')

      let [path, ...vals] = raw('/foo', '/foo')
      assert.equal(path, '/foo', '~> parsed `path` correctly')
      assert.deepEqual(vals, [], '~> parsed value segments correctly')

      console.log('/foo ~> "/foo/"');
      [path, ...vals] = raw('/foo/', '/foo/');
      assert.equal(path, '/foo/', '~> parsed `path` correctly');
      assert.deepEqual(vals, [], '~> parsed value segments correctly');


      console.log('/:path ~> "/foo"');
      [path, ...vals] = raw('/:path', '/foo');
      assert.equal(path, '/foo', '~> parsed `path` correctly');
      assert.deepEqual(vals, ['foo'], '~> parsed value segments correctly');

      console.log('/:path ~> "/foo/"');
      [path, ...vals] = raw('/:path', '/foo/');
      assert.equal(path, '/foo/', '~> parsed `path` correctly');
      assert.deepEqual(vals, ['foo'], '~> parsed value segments correctly');


      console.log('/:path/:sub ~> "/foo/bar"');
      [path, ...vals] = raw('/:path/:sub', '/foo/bar');
      assert.equal(path, '/foo/bar', '~> parsed `path` correctly');
      assert.deepEqual(vals, ['foo', 'bar'], '~> parsed value segments correctly');

      console.log('/:path/:sub ~> "/foo/bar/"');
      [path, ...vals] = raw('/:path/:sub', '/foo/bar/');
      assert.equal(path, '/foo/bar/', '~> parsed `path` correctly');
      assert.deepEqual(vals, ['foo', 'bar'], '~> parsed value segments correctly');


      console.log('/:path/:sub? ~> "/foo"');
      [path, ...vals] = raw('/:path/:sub?', '/foo');
      assert.equal(path, '/foo', '~> parsed `path` correctly');
      assert.deepEqual(vals, ['foo', undefined], '~> parsed value segments correctly');

      console.log('/:path/:sub? ~> "/foo/"');
      [path, ...vals] = raw('/:path/:sub?', '/foo/');
      assert.equal(path, '/foo/', '~> parsed `path` correctly');
      assert.deepEqual(vals, ['foo', undefined], '~> parsed value segments correctly');


      console.log('/:path/:sub? ~> "/foo/bar"');
      [path, ...vals] = raw('/:path/:sub?', '/foo/bar');
      assert.equal(path, '/foo/bar', '~> parsed `path` correctly');
      assert.deepEqual(vals, ['foo', 'bar'], '~> parsed value segments correctly');

      console.log('/:path/:sub? ~> "/foo/bar/"');
      [path, ...vals] = raw('/:path/:sub', '/foo/bar/');
      assert.equal(path, '/foo/bar/', '~> parsed `path` correctly');
      assert.deepEqual(vals, ['foo', 'bar'], '~> parsed value segments correctly');


      console.log('/:path/* ~> "/foo/bar/baz"');
      [path, ...vals] = raw('/:path/*', '/foo/bar/baz');
      assert.equal(path, '/foo/bar/baz', '~> parsed `path` correctly');
      assert.deepEqual(vals, ['foo', 'bar/baz'], '~> parsed value segments correctly');

      console.log('/:path/* ~> "/foo/bar/baz/"');
      [path, ...vals] = raw('/:path/*', '/foo/bar/baz/');
      assert.equal(path, '/foo/bar/baz/', '~> parsed `path` correctly');
      assert.deepEqual(vals, ['foo', 'bar/baz/'], '~> parsed value segments correctly');


      console.log('/foo/:path ~> "/foo/bar"');
      [path, ...vals] = raw('/foo/:path', '/foo/bar');
      assert.equal(path, '/foo/bar', '~> parsed `path` correctly');
      assert.deepEqual(vals, ['bar'], '~> parsed value segments correctly');

      console.log('/foo/:path ~> "/foo/bar/"');
      [path, ...vals] = raw('/foo/:path', '/foo/bar/');
      assert.equal(path, '/foo/bar/', '~> parsed `path` correctly');
      assert.deepEqual(vals, ['bar'], '~> parsed value segments correctly');
    });

    it('(raw) exec :: loose', () => {
      console.log('/foo ~> "/foo"');
      let [path, ...vals] = raw('/foo', '/foo', 1);
      assert.equal(path, '/foo', '~> parsed `path` correctly');
      assert.deepEqual(vals, [], '~> parsed value segments correctly');

      console.log('/foo ~> "/foo/"');
      [path, ...vals] = raw('/foo/', '/foo/', 1);
      assert.equal(path, '/foo', '~> parsed `path` correctly');
      assert.deepEqual(vals, [], '~> parsed value segments correctly');


      console.log('/:path ~> "/foo"');
      [path, ...vals] = raw('/:path', '/foo', 1);
      assert.equal(path, '/foo', '~> parsed `path` correctly');
      assert.deepEqual(vals, ['foo'], '~> parsed value segments correctly');

      console.log('/:path ~> "/foo/"');
      [path, ...vals] = raw('/:path', '/foo/', 1);
      assert.equal(path, '/foo', '~> parsed `path` correctly');
      assert.deepEqual(vals, ['foo'], '~> parsed value segments correctly');


      console.log('/:path/:sub ~> "/foo/bar"');
      [path, ...vals] = raw('/:path/:sub', '/foo/bar', 1);
      assert.equal(path, '/foo/bar', '~> parsed `path` correctly');
      assert.deepEqual(vals, ['foo', 'bar'], '~> parsed value segments correctly');

      console.log('/:path/:sub ~> "/foo/bar/"');
      [path, ...vals] = raw('/:path/:sub', '/foo/bar/', 1);
      assert.equal(path, '/foo/bar', '~> parsed `path` correctly');
      assert.deepEqual(vals, ['foo', 'bar'], '~> parsed value segments correctly');


      console.log('/:path/:sub? ~> "/foo"');
      [path, ...vals] = raw('/:path/:sub?', '/foo', 1);
      assert.equal(path, '/foo', '~> parsed `path` correctly');
      assert.deepEqual(vals, ['foo', undefined], '~> parsed value segments correctly');

      console.log('/:path/:sub? ~> "/foo/"');
      [path, ...vals] = raw('/:path/:sub?', '/foo/', 1);
      assert.equal(path, '/foo', '~> parsed `path` correctly');
      assert.deepEqual(vals, ['foo', undefined], '~> parsed value segments correctly');


      console.log('/:path/:sub? ~> "/foo/bar"');
      [path, ...vals] = raw('/:path/:sub?', '/foo/bar', 1);
      assert.equal(path, '/foo/bar', '~> parsed `path` correctly');
      assert.deepEqual(vals, ['foo', 'bar'], '~> parsed value segments correctly');

      console.log('/:path/:sub? ~> "/foo/bar/"');
      [path, ...vals] = raw('/:path/:sub', '/foo/bar/', 1);
      assert.equal(path, '/foo/bar', '~> parsed `path` correctly');
      assert.deepEqual(vals, ['foo', 'bar'], '~> parsed value segments correctly');


      console.log('/:path/* ~> "/foo/bar/baz"');
      [path, ...vals] = raw('/:path/*', '/foo/bar/baz', 1);
      assert.equal(path, '/foo/bar/baz', '~> parsed `path` correctly');
      assert.deepEqual(vals, ['foo', 'bar/baz'], '~> parsed value segments correctly');

      console.log('/:path/* ~> "/foo/bar/baz/"');
      [path, ...vals] = raw('/:path/*', '/foo/bar/baz/', 1);
      assert.equal(path, '/foo/bar/baz/', '~> parsed `path` correctly'); // trail
      assert.deepEqual(vals, ['foo', 'bar/baz/'], '~> parsed value segments correctly');


      console.log('/foo/:path ~> "/foo/bar"');
      [path, ...vals] = raw('/foo/:path', '/foo/bar', 1);
      assert.equal(path, '/foo/bar', '~> parsed `path` correctly');
      assert.deepEqual(vals, ['bar'], '~> parsed value segments correctly');

      console.log('/foo/:path ~> "/foo/bar/"');
      [path, ...vals] = raw('/foo/:path', '/foo/bar/', 1);
      assert.equal(path, '/foo/bar', '~> parsed `path` correctly');
      assert.deepEqual(vals, ['bar'], '~> parsed value segments correctly');

    });

    it('(extra) exec', () => {
      // Not matches!
      console.log('/foo ~> "/foo/bar" (extra)');
      assert.equal(raw('/foo', '/foo/bar'), null, '~> does not match');

      console.log('/foo ~> "/foo/bar/" (extra)');
      assert.equal(raw('/foo/', '/foo/bar/'), null, '~> does not match');


      console.log('/:path ~> "/foo/bar" (extra)');
      assert.equal(raw('/:path', '/foo/bar'), null, '~> does not match');

      console.log('/:path ~> "/foo/bar/" (extra)');
      assert.equal(raw('/:path', '/foo/bar/'), null, '~> does not match');


    });

    it('(extra) exec :: loose', () => {
      console.log('/foo ~> "/foo/bar" (extra)');
      let [path, ...vals] = raw('/foo', '/foo/bar', 1);
      assert.equal(path, '/foo', '~> parsed `path` correctly');
      assert.deepEqual(vals, [], '~> parsed value segments correctly');

      console.log('/foo ~> "/foo/bar/" (extra)');
      [path, ...vals] = raw('/foo/', '/foo/bar/', 1);
      assert.equal(path, '/foo', '~> parsed `path` correctly');
      assert.deepEqual(vals, [], '~> parsed value segments correctly');


      console.log('/:path ~> "/foo/bar" (extra)');
      [path, ...vals] = raw('/:path', '/foo/bar', 1);
      assert.equal(path, '/foo', '~> parsed `path` correctly');
      assert.deepEqual(vals, ['foo'], '~> parsed value segments correctly');

      console.log('/:path ~> "/foo/bar/" (extra)');
      [path, ...vals] = raw('/:path', '/foo/bar/', 1);
      assert.equal(path, '/foo', '~> parsed `path` correctly');
      assert.deepEqual(vals, ['foo'], '~> parsed value segments correctly');

    })

// ---

    it('(RegExp) static', () => {
      let rgx = /^\/?books/;
      let {keys, pattern} = regexdot(rgx);
      assert.deepEqual(keys, false, '~> keys = false');
      assert.deepEqual(rgx, pattern, '~> pattern = input');
      assert.ok(pattern.test('/books'), '~> matches route');
      assert.ok(pattern.test('/books/'), '~> matches trailing slash');
      assert.ok(pattern.test('/books/'), '~> matches without leading slash');

    })

    if (hasNamedGroups) {
      it('(RegExp) param', () => {
        let rgx = /^\/(?<year>[0-9]{4})/i;
        let {keys, pattern} = regexdot(rgx);
        assert.deepEqual(keys, false, '~> keys = false');
        assert.deepEqual(rgx, pattern, '~> pattern = input');

        // RegExp testing (not regexdot related)
        assert.ok(!pattern.test('/123'), '~> does not match 3-digit string');
        assert.ok(!pattern.test('/asdf'), '~> does not match 4 alpha characters');
        assert.ok(pattern.test('/2019'), '~> matches definition');
        assert.ok(pattern.test('/2019/'), '~> matches definition w/ trailing slash');
        assert.ok(!pattern.test('2019'), '~> does not match without lead slash');
        assert.ok(pattern.test('/2019/narnia/hello'), '~> allows extra bits');

        // exec results, array access
        let [path, value] = pattern.exec('/2019/books');
        assert.equal(path, '/2019', '~> executing pattern on correct trimming');
        assert.equal(value, '2019', '~> executing pattern gives correct value');

        // exec results, named object
        t.toExec(rgx, '/2019/books', {year: '2019'});
        t.toExec(rgx, '/2019/books/narnia', {year: '2019'});
      });

      it('(RegExp) param :: w/ static', () => {
        let rgx = /^\/books\/(?<title>[a-z]+)/i;
        let {keys, pattern} = regexdot(rgx);
        assert.deepEqual(keys, false, '~> keys = false');
        assert.deepEqual(rgx, pattern, '~> pattern = input');

        // RegExp testing (not regexdot related)
        assert.ok(!pattern.test('/books'), '~> does not match naked base');
        assert.ok(!pattern.test('/books/'), '~> does not match naked base w/ trailing slash');
        assert.ok(pattern.test('/books/narnia'), '~> matches definition');
        assert.ok(pattern.test('/books/narnia/'), '~> matches definition w/ trailing slash');
        assert.ok(pattern.test('/books/narnia/hello'), '~> allows extra bits');
        assert.ok(!pattern.test('books/narnia'), '~> does not match path without lead slash');

        // exec results, array access
        let [path, value] = pattern.exec('/books/narnia');
        assert.equal(path, '/books/narnia', '~> executing pattern on correct trimming');
        assert.equal(value, 'narnia', '~> executing pattern gives correct value');

        // exec results, named object
        t.toExec(rgx, '/books/narnia', {title: 'narnia'});
        t.toExec(rgx, '/books/narnia/hello', {title: 'narnia'});

      });

      it('(RegExp) param :: multiple', () => {
        let rgx = /^\/(?<year>[0-9]{4})-(?<month>[0-9]{2})\/(?<day>[0-9]{2})/i;
        let {keys, pattern} = regexdot(rgx);
        assert.deepEqual(keys, false, '~> keys = false');
        assert.deepEqual(rgx, pattern, '~> pattern = input');

        // RegExp testing (not regexdot related)
        assert.ok(!pattern.test('/123-1'));
        assert.ok(!pattern.test('/123-10'));
        assert.ok(!pattern.test('/1234-10'));
        assert.ok(!pattern.test('/1234-10/1'));
        assert.ok(!pattern.test('/1234-10/as'));
        assert.ok(pattern.test('/1234-10/01/'));
        assert.ok(pattern.test('/2019-10/30'));

        // exec results, array access
        let [path, year, month, day] = pattern.exec('/2019-05/30/');
        assert.equal(path, '/2019-05/30', '~> executing pattern on correct trimming');
        assert.equal(year, '2019', '~> executing pattern gives correct "year" value');
        assert.equal(month, '05', '~> executing pattern gives correct "month" value');
        assert.equal(day, '30', '~> executing pattern gives correct "day" value');

        // exec results, named object
        t.toExec(rgx, '/2019-10/02', {year: '2019', month: '10', day: '02'});
        t.toExec(rgx, '/2019-10/02/narnia', {year: '2019', month: '10', day: '02'});

      })

      it('(RegExp) param :: suffix', () => {
        let rgx = /^\/movies[/](?<title>\w+)\.mp4/i;
        let {keys, pattern} = regexdot(rgx);
        assert.deepEqual(keys, false, '~> keys = false');
        assert.deepEqual(rgx, pattern, '~> pattern = input');

        // RegExp testing (not regexdot related)
        assert.ok(!pattern.test('/movies'));
        assert.ok(!pattern.test('/movies/'));
        assert.ok(!pattern.test('/movies/foo'));
        assert.ok(!pattern.test('/movies/foo.mp3'));
        assert.ok(pattern.test('/movies/foo.mp4'));
        assert.ok(pattern.test('/movies/foo.mp4/'));

        // exec results, array access
        let [path, title] = pattern.exec('/movies/narnia.mp4');
        assert.equal(path, '/movies/narnia.mp4', '~> executing pattern on correct trimming');
        assert.equal(title, 'narnia', '~> executing pattern gives correct "title" value');

        // exec results, named object
        t.toExec(rgx, '/movies/narnia.mp4', {title: 'narnia'})
        t.toExec(rgx, '/movies/narnia.mp4/', {title: 'narnia'})

      })

      it('(RegExp) param :: suffices', () => {
        let rgx = /^\/movies[/](?<title>\w+)\.(mp4|mov)/i;
        let {keys, pattern} = regexdot(rgx);
        assert.deepEqual(keys, false, '~> keys = false');
        assert.deepEqual(rgx, pattern, '~> pattern = input');

        // RegExp testing (not regexdot related)
        assert.ok(!pattern.test('/movies'));
        assert.ok(!pattern.test('/movies/'));
        assert.ok(!pattern.test('/movies/foo'));
        assert.ok(!pattern.test('/movies/foo.mp3'));
        assert.ok(pattern.test('/movies/foo.mp4'));
        assert.ok(pattern.test('/movies/foo.mp4/'));
        assert.ok(pattern.test('/movies/foo.mov/'));

        // exec results, array access
        let [path, title] = pattern.exec('/movies/narnia.mov');
        assert.equal(path, '/movies/narnia.mov', '~> executing pattern on correct trimming');
        assert.equal(title, 'narnia', '~> executing pattern gives correct "title" value');

        // exec results, named object
        t.toExec(rgx, '/movies/narnia.mov', {title: 'narnia'});
        t.toExec(rgx, '/movies/narnia.mov/', {title: 'narnia'});

      });

      it('(RegExp) param :: optional', () => {
        let rgx = /^\/books[/](?<author>[^/]+)[/]?(?<title>[^/]+)?[/]?$/
        let {keys, pattern} = regexdot(rgx);
        assert.deepEqual(keys, false, '~> keys = false');
        assert.deepEqual(rgx, pattern, '~> pattern = input');

        // RegExp testing (not regexdot related)
        assert.ok(!pattern.test('/books'));
        assert.ok(!pattern.test('/books/'));
        assert.ok(pattern.test('/books/smith'));
        assert.ok(pattern.test('/books/smith/'));
        assert.ok(pattern.test('/books/smith/narnia'));
        assert.ok(pattern.test('/books/smith/narnia/'));
        assert.ok(!pattern.test('/books/smith/narnia/reviews'));
        assert.ok(!pattern.test('books/smith/narnia'));

        // exec results, array access
        let [path, author, title] = pattern.exec('/books/smith/narnia/');
        assert.equal(path, '/books/smith/narnia/', '~> executing pattern on correct trimming');
        assert.equal(author, 'smith', '~> executing pattern gives correct value');
        assert.equal(title, 'narnia', '~> executing pattern gives correct value');

        // exec results, named object
        t.toExec(rgx, '/books/smith/narnia', {author: 'smith', title: 'narnia'});
        t.toExec(rgx, '/books/smith/narnia/', {author: 'smith', title: 'narnia'});
        t.toExec(rgx, '/books/smith/', {author: 'smith', title: undefined});
      })
    }

    it('(RegExp) nameless', () => {
      // For whatever reason~
      // ~> regexdot CANNOT give `keys` list cuz unknown
      let rgx = /^\/books[/]([^/]\w+)[/]?(\w+)?(?=\/|$)/i;
      let {keys, pattern} = regexdot(rgx);
      assert.deepEqual(keys, false, '~> keys = false');
      assert.deepEqual(rgx, pattern, '~> pattern = input');

      // RegExp testing (not regexdot related)
      assert.ok(!pattern.test('/books'));
      assert.ok(!pattern.test('/books/'));
      assert.ok(pattern.test('/books/smith'));
      assert.ok(pattern.test('/books/smith/'));
      assert.ok(pattern.test('/books/smith/narnia'));
      assert.ok(pattern.test('/books/smith/narnia/'));
      assert.ok(!pattern.test('books/smith/narnia'));

      // exec results, array access
      let [path, author, title] = pattern.exec('/books/smith/narnia/');
      assert.equal(path, '/books/smith/narnia', '~> executing pattern on correct trimming');
      assert.equal(author, 'smith', '~> executing pattern gives correct value');
      assert.equal(title, 'narnia', '~> executing pattern gives correct value');

      // exec results, named object
      // Note: UNKNOWN & UNNAMED KEYS
      t.toExec(rgx, '/books/smith/narnia', {});
      t.toExec(rgx, '/books/smith/narnia/', {});
      t.toExec(rgx, '/books/smith/', {});
    })
  })
})

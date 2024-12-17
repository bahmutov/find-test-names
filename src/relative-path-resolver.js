const path = require('path')
const debug = require('debug')('find-test-names')
const fs = require('fs')

function relativePathResolver(currentFilename) {
  return function (relativePath) {
    if (!currentFilename) {
      return
    }

    const dir = require('path').dirname(currentFilename)
    const resolved = path.resolve(dir, relativePath)
    debug(
      'resolved "%s" wrt "%s" to "%s"',
      relativePath,
      currentFilename,
      resolved,
    )

    const exists = fs.existsSync(resolved)
    if (!exists) {
      debug('"%s" does not exist', resolved)
      return
    }

    return fs.readFileSync(resolved, 'utf-8')
  }
}

module.exports = { relativePathResolver }

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

    // Try the original path first
    if (fs.existsSync(resolved)) {
      return fs.readFileSync(resolved, 'utf-8')
    }

    // Try with .ts and .js extensions
    const extensions = ['.ts', '.js']
    for (const ext of extensions) {
      const resolvedWithExt = resolved + ext
      if (fs.existsSync(resolvedWithExt)) {
        debug('found "%s" with extension "%s"', resolved, ext)
        return fs.readFileSync(resolvedWithExt, 'utf-8')
      }
    }

    debug('"%s[.js|.ts]" does not exist', resolved)
    return
  }
}

module.exports = { relativePathResolver }

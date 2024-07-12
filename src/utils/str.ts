import crypto from 'node:crypto'

export function sha1(id: string) {
  return crypto.createHash('sha1').update(id).digest('hex')
}

/**
 * 去除 id 中的 ? 后面的内容
 */
export function trimQMark(s: string) {
  if (s.includes('?'))
    return s.split('?')[0]
  return s
}

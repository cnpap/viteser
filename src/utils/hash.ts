import crypto from 'node:crypto'

export function sha1(id: string) {
  return crypto.createHash('sha1').update(id).digest('hex')
}

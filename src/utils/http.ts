import type { IncomingHttpHeaders } from 'node:http'

/**
 * 从 headers 中获取 token
 *
 * @param headers
 */
export function getTokenByHeaders(headers: IncomingHttpHeaders) {
  const authorization
    = headers.authorization || headers.Authorization || ''
  const token = (authorization as string).replace('Bearer ', '')
  if (!token) {
    // noinspection ExceptionCaughtLocallyJS
    throw new Error('Token is required')
  }
  return token
}

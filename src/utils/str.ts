/**
 * 去除 id 中的 ? 后面的内容
 */
export function trimQMark(s: string) {
  if (s.includes('?'))
    return s.split('?')[0]
  return s
}

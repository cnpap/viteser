export function fetchTemplete(funcname: string, funcCode: string) {
  return `\
async function ${funcname}(...args) {
  const __token__ = localStorage.getItem('token')
  return fetch('/vs/call', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': __token__ ? 'Bearer ' + __token__ : '',
    },
    body: JSON.stringify({
      code: '${funcCode}',
      data: args,
    })
  })
    .then(async (res) => {
      const data = await res.json()
      if (!data.success) {
        throw new Error('fail on use server function')
      }
      return data.data
    })
}`
}

export function axiosTemplate(funcname: string, funcCode: string) {
  return `\
async function ${funcname}(...args) {
  const __api = await import('axios').then((m) => m.default)
  return __api.post('/vs/call', {
    code: '${funcCode}',
    data: args,
  })
    .then(async (res) => {
      const data = res.data
      if (!data.success) {
        throw new Error('fail on use server function')
      }
      return data.data
    })
}`
}

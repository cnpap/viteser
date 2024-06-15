export async function a(name: string) {
  'use server'

  return {
    hello: name,
  }
}

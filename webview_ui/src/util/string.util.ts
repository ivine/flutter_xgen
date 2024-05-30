export function getRandomString(length: number): string {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  const charactersLength = characters.length;
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}

export function isEmptyString(string: any): boolean {
  let result = true
  if (typeof string === 'string') {
    result = string.length === 0
  }
  return result
}

export function getStringOrEmpty(string: any): string {
  let result = ''
  if (typeof string === 'string' && string.length > 0) {
    result = string
  }
  return result
}
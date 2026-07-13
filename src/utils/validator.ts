export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function isValidUsername(username: string): boolean {
  if (!username || username.length < 3) {
    return false;
  }
  return /^[a-zA-Z0-9_]+$/.test(username);
}

export function isValidTelegramData(initData: string): boolean {
  return initData.length > 0 && initData.includes('user=');
}

export function isValidWalletAddress(address: string): boolean {
  return /^EQ[a-zA-Z0-9_-]{46}$/.test(address);
}

export function isValidUsername(username: string): boolean {
  return /^[a-zA-Z0-9_]{3,32}$/.test(username);
}

export function sanitizeInput(input: string): string {
  return input.trim().replace(/[<>]/g, '');
}

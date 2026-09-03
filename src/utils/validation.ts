const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isRequired(value: string): boolean {
  return value.trim().length > 0;
}

export function isValidEmail(value: string): boolean {
  return EMAIL_REGEX.test(value.trim());
}

export function isValidPassword(value: string, minLength = 8): boolean {
  return value.length > minLength;
}

export function hasValidDomain(
  email: string,
  domains: string[] = ['@gmail.com', '@unitec.edu', '@hotmail.com', '@outlook.com']
): boolean {
  return domains.some((domain) => email.trim().endsWith(domain));
}

export function isValidAmount(value: string): boolean {
  const parsed = Number.parseFloat(value.replace(',', '.'));
  return !Number.isNaN(parsed) && parsed > 0;
}

export function isValidDate(value: string): boolean {
  const match = value.trim().match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!match) {
    return false;
  }

  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]);
  const date = new Date(year, month - 1, day);

  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  );
}

export function isValidDueDay(value: string): boolean {
  if (!value.trim()) {
    return true;
  }

  const day = Number.parseInt(value, 10);
  return !Number.isNaN(day) && day >= 1 && day <= 31;
}

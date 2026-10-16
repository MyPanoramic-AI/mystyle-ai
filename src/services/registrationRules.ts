const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export interface RegistrationInput {
  email: string;
  password: string;
  confirmation: string;
}

export function registrationError(input: RegistrationInput): string | null {
  const email = input.email.trim().toLowerCase();
  if (!EMAIL.test(email) || email.length > 254) return 'Enter a valid email address.';
  if (input.password.length < 12 || input.password.length > 200) return 'Use a password of at least 12 characters.';
  if (input.password !== input.confirmation) return 'The passwords do not match.';
  return null;
}

export function loginError(email: string, password: string): string | null {
  if (!EMAIL.test(email.trim().toLowerCase())) return 'Enter a valid email address.';
  if (!password) return 'Enter your password.';
  return null;
}

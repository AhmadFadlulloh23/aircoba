// This is a simulated auth system for demonstration purposes.
// In a real application, use a robust authentication library like NextAuth.js or Firebase Authentication.

import type { User } from '@/types';

const MOCK_USER: User = {
  id: '1',
  email: 'ahmadfadlulloh023@gmail.com',
  name: 'Ahmad Fadlulloh',
  photoUrl: 'https://placehold.co/200x200.png', // Placeholder profile picture
  idNumber: '1103213040', // Example NIK/NIM/NIP
};

const MOCK_PASSWORD = 'onezero23';

export async function login(email: string, password: string): Promise<{ success: boolean; user?: User; error?: string }> {
  const normalizedEmail = email.trim().toLowerCase();
  if (normalizedEmail === MOCK_USER.email && password === MOCK_PASSWORD) {
    // Simulate session creation
    if (typeof window !== 'undefined') {
      localStorage.setItem('aquaGuardUser', JSON.stringify(MOCK_USER));
    }
    return { success: true, user: MOCK_USER };
  }
  return { success: false, error: 'Invalid email or password.' };
}

export async function register(email: string, password: string): Promise<{ success: boolean; error?: string }> {
  // Simulate registration - in this demo, it doesn't actually save new users.
  // It just checks if the email is the mock user's email to simulate "already exists".
  const normalizedEmail = email.trim().toLowerCase();
  if (normalizedEmail === MOCK_USER.email) {
    return { success: false, error: 'Email already exists. Please login.' };
  }
  // For any other email, simulate successful registration.
  return { success: true };
}

export async function logout(): Promise<void> {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('aquaGuardUser');
  }
}

export function getCurrentUser(): User | null {
  if (typeof window !== 'undefined') {
    const userJson = localStorage.getItem('aquaGuardUser');
    if (userJson) {
      try {
        return JSON.parse(userJson) as User;
      } catch (e) {
        return null;
      }
    }
  }
  return null;
}


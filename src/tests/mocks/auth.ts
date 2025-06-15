import { vi } from "vitest";

// Define types inline since better-auth doesn't export them directly
export interface User {
  id: string;
  email: string;
  name: string;
  emailVerified: boolean;
  image: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Session {
  id: string;
  userId: string;
  expiresAt: Date;
  ipAddress: string;
  userAgent: string;
  createdAt: Date;
  updatedAt: Date;
}

export const mockUser: User = {
  id: "test-user-id",
  email: "test@example.com",
  name: "Test User",
  emailVerified: true,
  image: null,
  createdAt: new Date("2024-01-01"),
  updatedAt: new Date("2024-01-01"),
};

export const mockSession: Session = {
  id: "test-session-id",
  userId: mockUser.id,
  expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24), // 24 hours from now
  ipAddress: "127.0.0.1",
  userAgent: "test-agent",
  createdAt: new Date("2024-01-01"),
  updatedAt: new Date("2024-01-01"),
};

export const createAuthMocks = () => {
  const authClient = {
    signIn: {
      email: vi.fn().mockResolvedValue({
        data: { user: mockUser, session: mockSession },
        error: null,
      }),
    },
    signUp: {
      email: vi.fn().mockResolvedValue({
        data: { user: mockUser, session: mockSession },
        error: null,
      }),
    },
    signOut: vi.fn().mockResolvedValue({ error: null }),
    getSession: vi.fn().mockResolvedValue({
      data: { user: mockUser, session: mockSession },
      error: null,
    }),
  };

  return { authClient, mockUser, mockSession };
};

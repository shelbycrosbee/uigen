// @vitest-environment node
import { describe, test, expect, vi, beforeEach } from "vitest";
import { jwtVerify } from "jose";

const mockCookieSet = vi.fn();
vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => ({
    set: mockCookieSet,
    get: vi.fn(),
    delete: vi.fn(),
  })),
}));

// Import after mocks are in place
const { createSession } = await import("@/lib/auth");

const JWT_SECRET = new TextEncoder().encode("development-secret-key");

beforeEach(() => {
  mockCookieSet.mockClear();
});

describe("createSession", () => {
  test("sets the auth-token cookie", async () => {
    await createSession("user-1", "test@example.com");

    expect(mockCookieSet).toHaveBeenCalledOnce();
    expect(mockCookieSet.mock.calls[0][0]).toBe("auth-token");
  });

  test("cookie contains a valid signed JWT", async () => {
    await createSession("user-1", "test@example.com");

    const token = mockCookieSet.mock.calls[0][1] as string;
    const { payload } = await jwtVerify(token, JWT_SECRET);

    expect(payload.userId).toBe("user-1");
    expect(payload.email).toBe("test@example.com");
  });

  test("JWT payload includes userId and email", async () => {
    await createSession("abc-123", "hello@world.com");

    const token = mockCookieSet.mock.calls[0][1] as string;
    const { payload } = await jwtVerify(token, JWT_SECRET);

    expect(payload.userId).toBe("abc-123");
    expect(payload.email).toBe("hello@world.com");
  });

  test("cookie expires in ~7 days", async () => {
    const before = Date.now();
    await createSession("user-1", "test@example.com");
    const after = Date.now();

    const options = mockCookieSet.mock.calls[0][2] as { expires: Date };
    const expiresMs = options.expires.getTime();
    const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;

    expect(expiresMs).toBeGreaterThanOrEqual(before + sevenDaysMs);
    expect(expiresMs).toBeLessThanOrEqual(after + sevenDaysMs);
  });

  test("cookie is httpOnly", async () => {
    await createSession("user-1", "test@example.com");

    const options = mockCookieSet.mock.calls[0][2] as { httpOnly: boolean };
    expect(options.httpOnly).toBe(true);
  });

  test("cookie has path /", async () => {
    await createSession("user-1", "test@example.com");

    const options = mockCookieSet.mock.calls[0][2] as { path: string };
    expect(options.path).toBe("/");
  });

  test("cookie sameSite is lax", async () => {
    await createSession("user-1", "test@example.com");

    const options = mockCookieSet.mock.calls[0][2] as { sameSite: string };
    expect(options.sameSite).toBe("lax");
  });

  test("cookie is not secure outside production", async () => {
    await createSession("user-1", "test@example.com");

    const options = mockCookieSet.mock.calls[0][2] as { secure: boolean };
    expect(options.secure).toBe(false);
  });
});

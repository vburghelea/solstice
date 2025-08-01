import { APIRequestContext } from "@playwright/test";

export async function authenticateViaAPI(request: APIRequestContext): Promise<string> {
  // Make API request to login endpoint
  const response = await request.post("/api/auth/email", {
    data: {
      email: process.env["E2E_TEST_EMAIL"],
      password: process.env["E2E_TEST_PASSWORD"],
    },
  });

  // Extract auth token from response
  const { token } = await response.json();

  return token;
}

export async function createAuthenticatedContext(
  request: APIRequestContext,
  page: {
    context: () => {
      addCookies: (
        cookies: Array<{
          name: string;
          value: string;
          domain: string;
          path: string;
          httpOnly: boolean;
          secure: boolean;
          sameSite: string;
        }>,
      ) => Promise<void>;
    };
  },
) {
  const token = await authenticateViaAPI(request);

  // Set auth cookie or local storage
  await page.context().addCookies([
    {
      name: "auth-token",
      value: token,
      domain: "localhost",
      path: "/",
      httpOnly: true,
      secure: false, // Set to true in production
      sameSite: "Lax",
    },
  ]);

  // Or set in localStorage
  // await page.evaluate((token) => {
  //   localStorage.setItem('auth-token', token);
  // }, token);
}

import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const error = url.searchParams.get("error");
  const errorDescription =
    url.searchParams.get("error_description");

  const origin = url.origin;

  if (error) {
    console.error(
      "Google OAuth error:",
      error,
      errorDescription
    );

    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(
        errorDescription || error
      )}`
    );
  }

  if (!code) {
    console.error(
      "OAuth callback reached without authorization code."
    );

    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(
        "No OAuth authorization code received."
      )}`
    );
  }

  const response = NextResponse.redirect(`${origin}/`);

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.headers
            .get("cookie")
            ?.split(";")
            .filter(Boolean)
            .map((cookie) => {
              const index = cookie.indexOf("=");

              return {
                name: cookie
                  .slice(0, index)
                  .trim(),
                value: decodeURIComponent(
                  cookie.slice(index + 1).trim()
                ),
              };
            }) || [];
        },

        setAll(cookiesToSet) {
          cookiesToSet.forEach(
            ({ name, value, options }) => {
              response.cookies.set(
                name,
                value,
                options
              );
            }
          );
        },
      },
    }
  );

  const {
    data: { session },
    error: exchangeError,
  } = await supabase.auth.exchangeCodeForSession(code);

  if (exchangeError) {
    console.error(
      "exchangeCodeForSession error:",
      exchangeError.message
    );

    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(
        exchangeError.message
      )}`
    );
  }

  if (!session) {
    console.error(
      "Google login completed but session was not created."
    );

    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(
        "Google login failed. No session was created."
      )}`
    );
  }

  return response;
}
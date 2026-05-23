import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options?: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  const isAuthRoute =
    pathname === "/giris" || pathname === "/kayit" || pathname === "/dogrulama";
  const isAppRoute =
    pathname.startsWith("/kesfet") ||
    pathname.startsWith("/ara") ||
    pathname.startsWith("/sat") ||
    pathname.startsWith("/favoriler") ||
    pathname.startsWith("/profil") ||
    pathname.startsWith("/ilan") ||
    pathname.startsWith("/rezervasyonlar") ||
    pathname.startsWith("/sohbet");
  const isCallback = pathname.startsWith("/auth/callback");

  if (!user && isAppRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/giris";
    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url);
  }

  if (user && isAppRoute && !pathname.startsWith("/ilan")) {
    const { data: profile } = await supabase
      .from("users")
      .select("verified_student")
      .eq("id", user.id)
      .maybeSingle();

    if (profile && !profile.verified_student && pathname !== "/profil") {
      const url = request.nextUrl.clone();
      url.pathname = "/dogrulama";
      return NextResponse.redirect(url);
    }
  }

  if (user && isAuthRoute && !isCallback) {
    const { data: profile } = await supabase
      .from("users")
      .select("verified_student")
      .eq("id", user.id)
      .maybeSingle();
    if (profile?.verified_student) {
      const url = request.nextUrl.clone();
      url.pathname = "/kesfet";
      return NextResponse.redirect(url);
    }
  }

  return response;
}

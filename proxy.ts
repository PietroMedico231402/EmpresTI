import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { publicSupabaseConfig } from "@/lib/supabase/config";
import { hasInitialMembership } from "@/lib/supabase/membership";

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });
  const { url, key } = publicSupabaseConfig();
  const supabase = createServerClient(url, key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        Object.entries(headers).forEach(([name, value]) => response.headers.set(name, value));
      },
    },
  });

  const { data: { user } } = await supabase.auth.getUser();
  const pathname = request.nextUrl.pathname;
  if (pathname === "/login") {
    if (user && await hasInitialMembership(supabase, user.id)) {
      const redirect = NextResponse.redirect(new URL("/catalogo", request.url));
      response.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie));
      return redirect;
    }
    return response;
  }

  if (!user || !await hasInitialMembership(supabase, user.id)) {
    const denied = pathname.startsWith("/api/")
      ? NextResponse.json({ error: "Acesso não autorizado." }, { status: user ? 403 : 401 })
      : NextResponse.redirect(new URL("/login", request.url));
    response.cookies.getAll().forEach((cookie) => denied.cookies.set(cookie));
    return denied;
  }

  return response;
}

export const config = {
  matcher: ["/login", "/catalogo/:path*", "/meus-emprestimos/:path*", "/operacoes/:path*", "/api/:path*"],
};

import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  pages: {
    signIn: "/admin/login",
  },
  trustHost: true,
  session: { strategy: "jwt" },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const { pathname, search } = nextUrl;
      const isOnLogin = pathname === "/admin/login";
      const isOnAdmin = pathname.startsWith("/admin");

      if (isOnLogin) {
        if (isLoggedIn) {
          return Response.redirect(new URL("/admin", nextUrl));
        }
        return true;
      }

      if (isOnAdmin) {
        if (isLoggedIn) return true;
        const callbackUrl = encodeURIComponent(`${pathname}${search}`);
        return Response.redirect(new URL(`/admin/login?callbackUrl=${callbackUrl}`, nextUrl));
      }

      return true;
    },
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
      }
      return token;
    },
    session({ session, token }) {
      if (token?.id && typeof token.id === "string") {
        session.user.id = token.id;
      }
      return session;
    },
  },
  providers: [],
} satisfies NextAuthConfig;

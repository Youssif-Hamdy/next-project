import { withAuth } from "next-auth/middleware";

export const proxy = withAuth(
  function proxyHandler() {},
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const path = req.nextUrl.pathname;
        if (path.startsWith("/admin")) {
          return token?.role === "ADMIN";
        }
        if (path.startsWith("/dashboard")) {
          return !!token;
        }
        return true;
      },
    },
  }
);

export const config = {
  matcher: ["/dashboard/:path*", "/admin/:path*"],
};

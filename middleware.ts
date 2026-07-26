import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware() {
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => Boolean(token),
    },
    pages: {
      // withAuth would otherwise redirect straight to NEXTAUTH's default
      // sign-in page; we override callbackUrl/error handling ourselves below.
      signIn: "/",
    },
  },
);

export const config = {
  matcher: ["/dashboard"],
};

import { NextResponse } from "next/server";
import { getSignInUrl } from "@workos-inc/authkit-nextjs";

// Sends the user to WorkOS AuthKit (Google) and back through /callback.
export async function GET() {
  return NextResponse.redirect(await getSignInUrl());
}

export { auth as middleware } from "@/server/auth";

export const config = {
  matcher: ["/dashboard/:path*", "/api/brief", "/api/triage", "/api/contributors", "/api/releases", "/api/duplicates", "/api/chat"],
};

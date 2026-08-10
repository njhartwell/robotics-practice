import { auth, type AuthSession } from "./auth";
import { isAdmin, isApproved } from "./access";

export async function requestSession(request: Request) {
  return auth.api.getSession({ headers: request.headers });
}

export async function approvedSession(
  request: Request
): Promise<AuthSession | null> {
  const session = await requestSession(request);
  return isApproved(session) ? session : null;
}

export async function adminSession(
  request: Request
): Promise<AuthSession | null> {
  const session = await requestSession(request);
  return isAdmin(session) ? session : null;
}

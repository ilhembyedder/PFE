import { LoginForm } from "../login-form";

/** Platform administrators: no company identifier, lands on /tenants. */
export default function PlatformLoginPage() {
  return <LoginForm mode="platform" />;
}

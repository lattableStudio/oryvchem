import { redirect } from "next/navigation";
import { adminEnabled, isAdmin } from "@/lib/auth";
import { LoginForm } from "./LoginForm";

export default async function LoginPage() {
  if (await isAdmin()) redirect("/admin/dashboard");
  return (
    <div className="login">
      <h1>Oryvchem admin</h1>
      {adminEnabled() ? <LoginForm /> : <div className="notice">Set <code>ADMIN_PASSWORD</code> in the environment to enable the admin.</div>}
    </div>
  );
}

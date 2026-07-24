import { LoginForm } from "@/components/auth/AuthForms";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  return <LoginForm checkEmail={params["check-email"] === "1"} />;
}

import { redirect } from "next/navigation";
import { getSessionJudge } from "@/lib/auth";

interface Props {
  searchParams: Promise<{ code?: string }>;
}

export default async function Home({ searchParams }: Props) {
  const { code } = await searchParams;

  if (code) {
    redirect(`/api/auth/login-by-code?code=${encodeURIComponent(code)}`);
  }

  const judge = await getSessionJudge();
  if (judge) redirect("/judge");
  redirect("/login");
}

import type { Metadata } from "next";
import AuthScreen from "../../components/AuthScreen";

export const metadata: Metadata = {
  title: "Sign in · AI-PATH",
  description: "Sign in to AI-PATH and continue your learning journey.",
};

export default function SigninPage() {
  return <AuthScreen mode="signin" />;
}

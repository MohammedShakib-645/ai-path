import type { Metadata } from "next";
import AuthScreen from "../../components/AuthScreen";

export const metadata: Metadata = {
  title: "Create your account · AI-PATH",
  description: "Create a free AI-PATH account — your personalized learning path, progress and notes, saved.",
};

export default function SignupPage() {
  return <AuthScreen mode="signup" />;
}

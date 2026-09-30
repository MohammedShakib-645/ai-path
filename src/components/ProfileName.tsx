"use client";
import { useProfileName } from "../lib/store";

/** Prints the learner's real name (from onboarding / settings). Falls back to "Learner". */
export default function ProfileName() {
  const n = useProfileName();
  return <>{n}</>;
}

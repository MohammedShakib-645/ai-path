import { permanentRedirect } from "next/navigation";

/** Old route — merged into /learn (Roadmap tab). Kept so old URLs never break. */
export default function RoadmapRedirect() {
  permanentRedirect("/learn");
}

import { permanentRedirect } from "next/navigation";

/** Old route — merged into /learn (Catalog tab). Kept so old URLs never break.
 *  /courses/[levelId] stays a real route underneath. */
export default function CoursesRedirect() {
  permanentRedirect("/learn?view=catalog");
}

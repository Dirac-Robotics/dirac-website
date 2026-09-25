import { permanentRedirect } from "next/navigation";

export default function RetiredPage() {
  permanentRedirect("/#how-it-works");
}

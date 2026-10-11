import { redirect } from "next/navigation";
import { SITE } from "@/lib/config/site";

export default function RetiredPage() {
  redirect(SITE.bookingUrl);
}

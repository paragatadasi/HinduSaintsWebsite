import { redirect } from "next/navigation";

export default function PlacesIndexRedirectPage() {
  redirect("/map");
}

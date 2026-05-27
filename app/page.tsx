import { redirect } from "next/navigation";

// The root URL redirects to the home screen.
// Later, we'll add auth here: if the user isn't logged in, redirect to /login instead.
export default function RootPage() {
  redirect("/home");
}

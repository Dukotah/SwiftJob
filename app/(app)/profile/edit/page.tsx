import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { EditProfileForm } from "./edit-profile-form";

export default async function EditProfilePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const user = await db.query.users.findFirst({
    where: eq(users.id, session.user.id),
  });

  if (!user) redirect("/login");

  return (
    <EditProfileForm
      initialBusinessName={user.businessName ?? ""}
      initialTradeType={user.tradeType    ?? ""}
      initialCity={user.city         ?? ""}
      initialState={user.state        ?? ""}
      initialPhone={user.phone        ?? ""}
    />
  );
}

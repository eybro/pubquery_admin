import { Suspense } from "react";
import ResetPasswordClient from "./reset-password-client";

export default function Page() {
  return (
    <Suspense fallback={<div className="p-6 text-sm md:p-10">Loading…</div>}>
      <ResetPasswordClient />
    </Suspense>
  );
}

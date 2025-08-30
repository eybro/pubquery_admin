"use client";
import { Badge } from "@/components/ui/badge";

export function SourceBadge({
  auto_created,
}: {
  auto_created: number | boolean | null | undefined;
}) {
  const isAuto = auto_created === true || auto_created === 1;
  const cls = isAuto
    ? "bg-green-600 text-white hover:bg-green-600/90"
    : "bg-blue-600 text-white hover:bg-blue-600/90";

  return (
    <Badge className={cls}>
      {isAuto ? "System Generated" : "Manually Created"}
    </Badge>
  );
}

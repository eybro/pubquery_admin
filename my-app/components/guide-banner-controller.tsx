"use client";
import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Info, X, FileDown } from "lucide-react";
import Cookies from "js-cookie";

function getCookie(name: string) {
  return Cookies.get(name);
}
function setCookie(name: string, value: string, days = 180) {
  Cookies.set(name, value, { expires: days, sameSite: "lax", path: "/" });
}

export function GuideBannerController() {
  const [show, setShow] = useState(false); // default hidden to avoid SSR flash

  useEffect(() => {
    // show only if cookie not set
    if (getCookie("pq_hideGuideBanner") !== "1") setShow(true);
  }, []);

  const onClose = () => {
    setShow(false);
    setCookie("pq_hideGuideBanner", "1");
  };

  if (!show) return;

  return (
    <Card className="mx-4 mb-4 max-w-[1200px] border-blue-200 bg-blue-50">
      <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="rounded-md bg-blue-600/90 p-2 text-white">
            <Info className="size-5" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-blue-900">
              Vill du veta mer om Pubquery?
            </p>
            <p className="text-sm text-blue-900/80">
              Ladda ner vår användarguide (PDF).
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button asChild className="shrink-0">
            <a href={"https://pubquery-images.fra1.cdn.digitaloceanspaces.com/User-guide/Pubquery%20user%20guide.pdf"} download>
              <FileDown className="mr-2 size-4" />
              Ladda ner användarguide
            </a>
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="shrink-0"
            aria-label="Stäng bannern"
            onClick={onClose}
          >
            <X className="size-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

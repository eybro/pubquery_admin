import Image from "next/image";
import Link from "next/link";
import dinner_view from "@/public/images/dinner_view.png";
import counter from "@/public/images/counter.png";
import live_count from "@/public/images/live_count.png";
import pub_view from "@/public/images/live_count.png";
import ReactGA from 'react-ga';

export default function InfoPage() {
  ReactGA.initialize('G-RL1J01TPJ4');
  ReactGA.pageview(window.location.pathname + window.location.search);

  return (

    <div className="mx-auto max-w-6xl space-y-12 p-6">
      {/* Pub Organizer Section */}
      <section className="text-center">
        <h2 className="mb-6 text-3xl font-bold">
          Lägg upp pubar och sittningar
        </h2>
        <p className="mb-8 text-lg text-gray-600">
          Lägg upp era pubar och sittningar eller redigera pubar som lagts upp
          automatiskt. Nå ut till över 10 000 besökare i månaden!
        </p>
        <div className="grid grid-cols-1 justify-center gap-6 md:grid-cols-2">
          <div className="flex aspect-[4/3] w-full max-w-lg flex-col items-center rounded-lg bg-white p-6 shadow-lg">
            <Image
              src={pub_view}
              alt="Pub view"
              className="size-full rounded-lg object-contain"
            />
          </div>
          <div className="flex aspect-[4/3] w-full max-w-lg flex-col items-center rounded-lg bg-white p-6 shadow-lg">
            <Image
              src={dinner_view}
              alt="Dinner view"
              className="size-full rounded-lg object-contain"
            />
          </div>
        </div>
        <div className="mt-6 space-x-4">
          <Link
            href="/login"
            className="rounded-lg bg-blue-600 px-6 py-3 text-white shadow-md transition hover:bg-blue-700"
          >
            Logga in
          </Link>
          <a
            href="mailto:info@pubquery.se"
            className="rounded-lg bg-green-600 px-6 py-3 text-white shadow-md transition hover:bg-green-700"
          >
            Skapa konto
          </a>
        </div>
      </section>

      {/* Counter App Section */}
      <section className="text-center">
        <h2 className="mb-6 text-3xl font-bold">Räknar-app</h2>
        <p className="mb-8 text-lg text-gray-600">
          Med vår räknar-app kan ni enkelt hålla koll på antalet besökare och
          även välja att visa detta live på pubquery.se
        </p>
        <div className="grid grid-cols-1 justify-center gap-6 md:grid-cols-2">
          <div className="flex aspect-[4/3] w-full max-w-lg flex-col items-center rounded-lg bg-white p-6 shadow-lg">
            <Image
              src={counter}
              alt="Counter"
              className="size-full rounded-lg object-contain"
            />
          </div>
          <div className="flex aspect-[4/3] w-full max-w-lg flex-col items-center rounded-lg bg-white p-6 shadow-lg">
            <Image
              src={live_count}
              alt="Live count"
              className="size-full rounded-lg object-contain"
            />
          </div>
        </div>
      </section>
    </div>
  );
}

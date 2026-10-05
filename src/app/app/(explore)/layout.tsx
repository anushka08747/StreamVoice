"use client";
import dynamic from "next/dynamic";

const MapView = dynamic(() => import("@/components/MapView"), {
  ssr: false,
  loading: () => <div className="well h-[420px] animate-pulse lg:h-[calc(100vh-150px)]" aria-label="Loading map" />,
});

/** The map stays mounted while the side panel switches between the stream list and a stream. */
export default function ExploreLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,60fr)_minmax(0,40fr)]">
      <div className="card self-start overflow-hidden p-2 xl:sticky xl:top-4"><MapView /></div>
      <section aria-label="Stream details" className="min-w-0 space-y-6">{children}</section>
    </div>
  );
}

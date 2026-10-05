"use client";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { MapContainer, Marker, TileLayer, Tooltip } from "react-leaflet";
import { usePathname, useRouter } from "next/navigation";
import { useAllInsights, BAND_COLOR, healthBand, type Band } from "@/lib/ui";
import type { Trend } from "@/lib/types";

const CARTO_KEY = process.env.NEXT_PUBLIC_CARTO_KEY;
const TILES = CARTO_KEY
  ? {
      url: `https://basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png?key=${CARTO_KEY}`,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    }
  : {
      url: "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    };

// Inline SVG glyphs so colour is never the only signal.
const GLYPH: Record<Band, string> = {
  good: '<path d="M5 12.5l4.5 4.5L19 7.5" />',
  warn: '<path d="M6 12h12" />',
  bad: '<path d="M12 6v7" /><path d="M12 17.5v.5" />',
  unknown: '<path d="M9.5 9a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.6v.6" /><path d="M12 17.5v.5" />',
};
const TREND_GLYPH: Record<Trend, string> = { improving: "↗", declining: "↘", stable: "→", unknown: "?" };

function icon(score: number | null, trend: Trend, selected: boolean) {
  const band = healthBand(score);
  const size = selected ? 48 : 40;
  const ring = selected ? "0 0 0 4px rgba(99,102,241,.35)," : "";
  return L.divIcon({
    className: "",
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    html: `<div style="width:${size}px;height:${size}px;border-radius:50%;background:${BAND_COLOR[band]};border:3px solid #fff;display:flex;align-items:center;justify-content:center;box-shadow:${ring}0 10px 20px -8px rgba(40,50,120,.55);position:relative;">
      <svg width="${size * 0.5}" height="${size * 0.5}" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">${GLYPH[band]}</svg>
      <span style="position:absolute;right:-10px;top:-10px;min-width:22px;height:22px;border-radius:999px;background:#fff;color:#151935;font:700 13px/22px system-ui;text-align:center;box-shadow:0 4px 10px -4px rgba(40,50,120,.5);">${TREND_GLYPH[trend]}</span>
    </div>`,
  });
}

export default function MapView() {
  const all = useAllInsights();
  const router = useRouter();
  const path = usePathname();
  const selected = path.startsWith("/app/streams/") ? path.split("/")[3] : null;
  return (
    <MapContainer center={[40.826, -74.046]} zoom={12} className="h-[420px] w-full rounded-[20px] lg:h-[calc(100vh-150px)] lg:min-h-[520px]" scrollWheelZoom>
      <TileLayer url={TILES.url} attribution={TILES.attribution} />
      {all.map((i) => (
        <Marker key={i.stream.id} position={[i.stream.lat, i.stream.lng]} icon={icon(i.current.score, i.trend, selected === i.stream.id)}
          title={`${i.stream.name}, score ${i.current.score ?? "unknown"}, ${i.trend}`}
          eventHandlers={{ click: () => router.push(`/app/streams/${i.stream.id}`) }} keyboard>
          <Tooltip direction="top" offset={[0, -24]}>{i.stream.name}: {i.current.score ?? "unknown"}</Tooltip>
        </Marker>
      ))}
    </MapContainer>
  );
}

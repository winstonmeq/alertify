// app/geopolygons/page.tsx
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  GoogleMap,
  Polygon,
  useJsApiLoader,
} from "@react-google-maps/api";
// DrawingManager is type-only in v2; import via any to avoid TS friction
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const DrawingManager: any = (await import("@react-google-maps/api" as any)).DrawingManager ?? null;

type LatLng = { lat: number; lng: number };

type GeoPolygon = {
  id: string;
  name: string;
  paths: LatLng[];
  center?: LatLng | null;
  createdAt: string;
};

const containerStyle = { width: "100%", height: "70vh" } as const;

export default function GeoPolygonsPage() {
  const [polys, setPolys] = useState<GeoPolygon[]>([]);
  const [activePath, setActivePath] = useState<LatLng[] | null>(null);
  const [name, setName] = useState("");
  const [selected, setSelected] = useState<GeoPolygon | null>(null);

  const center = useMemo(() => ({ lat: 7.1449, lng: 124.8280 }), []); // North Cotabato default

  const { isLoaded, loadError } = useJsApiLoader({
    id: "maps-script",
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "",
    libraries: ["drawing", "places"],
    region: "PH",
  });

  useEffect(() => {
    fetch("/api/geopolygons")
      .then((r) => r.json())
      .then((data) => setPolys(data));
  }, []);

  const onPolygonComplete = useCallback((polygon: google.maps.Polygon) => {
    const path = polygon.getPath();
    const pts: LatLng[] = [];
    for (let i = 0; i < path.getLength(); i++) {
      const p = path.getAt(i);
      pts.push({ lat: p.lat(), lng: p.lng() });
    }
    setActivePath(pts);
    polygon.setMap(null); // remove the temp drawn polygon
  }, []);

  const savePolygon = useCallback(async () => {
    if (!activePath || activePath.length < 3 || !name.trim()) return;
    const latSum = activePath.reduce((s, p) => s + p.lat, 0);
    const lngSum = activePath.reduce((s, p) => s + p.lng, 0);
    const center = { lat: latSum / activePath.length, lng: lngSum / activePath.length };

    const res = await fetch("/api/geopolygons", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim(), paths: activePath, center }),
    });

    if (res.ok) {
      const created = await res.json();
      setPolys((p) => [created, ...p]);
      setActivePath(null);
      setName("");
    } else {
      const e = await res.json().catch(() => ({}));
      alert(e?.error ?? "Failed to save");
    }
  }, [activePath, name]);

  if (loadError) return <div className="p-6 text-red-600">Failed to load Google Maps</div>;
  if (!isLoaded) return <div className="p-6">Loading map…</div>;

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold">Geo Polygons</h1>

      <div className="flex flex-col gap-3 md:flex-row">
        <div className="md:w-2/3 w-full">
          <GoogleMap mapContainerStyle={containerStyle} center={selected?.center ?? center} zoom={11}>
            {activePath && (
              <Polygon
                paths={activePath}
                options={{ editable: true, draggable: false, fillOpacity: 0.3 }}
                // onMouseUp={(e) => {
                //   // capture edits when vertices are adjusted
                //   // @ts-ignore
                //   // const poly = e?.overlay as google.maps.Polygon | undefined;
                // }}
              />
            )}

            {polys.map((p) => (
              <Polygon key={p.id} paths={p.paths as LatLng[]} options={{ fillOpacity: 0.15 }} />
            ))}

            {DrawingManager && (
              <DrawingManager
                onPolygonComplete={onPolygonComplete}
                options={{
                  drawingControl: true,
                  drawingControlOptions: {
                    position: google.maps.ControlPosition.TOP_CENTER,
                    drawingModes: [google.maps.drawing.OverlayType.POLYGON],
                  },
                  polygonOptions: {
                    editable: true,
                    fillOpacity: 0.3,
                  },
                }}
              />
            )}
          </GoogleMap>
        </div>

        <div className="md:w-1/3 w-full space-y-4">
          <div className="p-4 rounded-2xl border shadow-sm space-y-3">
            <h2 className="font-semibold">New Polygon</h2>
            <input
              className="input input-bordered w-full px-3 py-2 rounded-xl border"
              placeholder="Name (e.g., Purok 2 boundary)"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <div className="text-sm text-gray-600">
              {activePath ? `${activePath.length} points selected` : "Use the polygon tool on the map"}
            </div>
            <div className="flex gap-2">
              <button
                className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200"
                onClick={() => setActivePath(null)}
                disabled={!activePath}
              >
                Reset
              </button>
              <button
                className="px-4 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
                onClick={savePolygon}
                disabled={!activePath || !name.trim()}
              >
                Save
              </button>
            </div>
          </div>

          <div className="p-4 rounded-2xl border shadow-sm space-y-2">
            <h2 className="font-semibold">Saved Polygons</h2>
            <ul className="space-y-1 max-h-72 overflow-auto pr-2">
              {polys.map((p) => (
                <li key={p.id} className="flex items-center justify-between gap-2">
                  <button
                    className="text-left hover:underline"
                    onClick={() => setSelected(p)}
                    title={`Created ${new Date(p.createdAt).toLocaleString()}`}
                  >
                    {p.name}
                  </button>
                  {/* <span className="text-xs text-gray-500">{(p.paths as LatLng[]).length} pts</span> */}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <p className="text-xs text-gray-500">
        Tip: After drawing, you can tweak vertices before saving. Saving stores vertices as JSON in MongoDB.
      </p>
    </div>
  );
}
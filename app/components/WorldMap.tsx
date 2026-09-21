"use client";

import { useEffect, useRef, useState } from "react";
import "mapbox-gl/dist/mapbox-gl.css";
import type { Map as MapboxMap, Marker } from "mapbox-gl";
import type { PeerDot } from "@/lib/types";

const TOKEN =
  process.env.NEXT_PUBLIC_MAPBOX_TOKEN ??
  "pk.eyJ1IjoicHVsc2UtbWFwIiwiYSI6ImNrMDBkZW1vMDAwMDAwMDAifQ.AAAAAAAAAAAAAAAAAAAAAA";

function createMeMarkerElement() {
  const root = document.createElement("div");
  root.className = "marker-root";

  const el = document.createElement("div");
  el.className = "pulse-me";
  el.innerHTML = `<span class="pulse-me-label">You are here</span>`;
  root.appendChild(el);
  return root;
}

function createPeerMarkerElement(
  peerId: string,
  onPeerClickRef: React.MutableRefObject<(id: string) => void>,
  canConnectRef: React.MutableRefObject<boolean>,
) {
  const root = document.createElement("div");
  root.className = "marker-root";

  const el = document.createElement("button");
  el.type = "button";
  el.className = "pulse-dot";
  el.title = "Tap to connect";
  el.addEventListener("click", (e) => {
    e.stopPropagation();
    if (canConnectRef.current) onPeerClickRef.current(peerId);
  });
  root.appendChild(el);
  return root;
}

export default function WorldMap({
  peers,
  me,
  onPeerClick,
  canConnect,
}: {
  peers: PeerDot[];
  me: { lat: number; lng: number } | null;
  onPeerClick: (id: string) => void;
  canConnect: boolean;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapboxMap | null>(null);
  const markersRef = useRef<Map<string, Marker>>(new Map());
  const meMarkerRef = useRef<Marker | null>(null);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);
  const [ready, setReady] = useState(false);

  const onPeerClickRef = useRef(onPeerClick);
  const canConnectRef = useRef(canConnect);
  useEffect(() => {
    onPeerClickRef.current = onPeerClick;
    canConnectRef.current = canConnect;
  });

  useEffect(() => {
    if (!TOKEN || !containerRef.current) return;
    let cancelled = false;
    const markers = markersRef.current;

    const fixAfterResize = () => {
      const map = mapRef.current;
      if (!map) return;
      map.resize();
      meMarkerRef.current?.setLngLat(meMarkerRef.current.getLngLat());
      markers.forEach((marker) => marker.setLngLat(marker.getLngLat()));
    };

    (async () => {
      const mapboxgl = (await import("mapbox-gl")).default;
      if (cancelled || !containerRef.current) return;
      mapboxgl.accessToken = TOKEN;

      const map = new mapboxgl.Map({
        container: containerRef.current,
        style: "mapbox://styles/mapbox/dark-v11",
        projection: "mercator",
        center: me ? [me.lng, me.lat] : [0, 20],
        zoom: me ? 4 : 1.4,
        attributionControl: true,
      });

      map.on("load", () => {
        if (!cancelled) setReady(true);
        requestAnimationFrame(fixAfterResize);
      });
      mapRef.current = map;

      const resizeObserver = new ResizeObserver(fixAfterResize);
      resizeObserver.observe(containerRef.current);
      resizeObserverRef.current = resizeObserver;
      window.addEventListener("resize", fixAfterResize);
    })();

    return () => {
      cancelled = true;
      resizeObserverRef.current?.disconnect();
      resizeObserverRef.current = null;
      window.removeEventListener("resize", fixAfterResize);
      markers.forEach((m) => m.remove());
      markers.clear();
      meMarkerRef.current?.remove();
      meMarkerRef.current = null;
      mapRef.current?.remove();
      mapRef.current = null;
      setReady(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready || !me) return;
    let cancelled = false;

    (async () => {
      const mapboxgl = (await import("mapbox-gl")).default;
      if (cancelled) return;
      if (!meMarkerRef.current) {
        meMarkerRef.current = new mapboxgl.Marker({
          element: createMeMarkerElement(),
          anchor: "center",
        })
          .setLngLat([me.lng, me.lat])
          .addTo(map);
      } else {
        meMarkerRef.current.setLngLat([me.lng, me.lat]);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [me, ready]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    let cancelled = false;

    (async () => {
      const mapboxgl = (await import("mapbox-gl")).default;
      if (cancelled) return;
      const markers = markersRef.current;
      const seen = new Set<string>();

      for (const peer of peers) {
        seen.add(peer.id);
        let marker = markers.get(peer.id);
        if (!marker) {
          marker = new mapboxgl.Marker({
            element: createPeerMarkerElement(
              peer.id,
              onPeerClickRef,
              canConnectRef,
            ),
          })
            .setLngLat([peer.lng, peer.lat])
            .addTo(map);
          markers.set(peer.id, marker);
        }
        const inner = marker.getElement().querySelector(".pulse-dot") as
          | HTMLElement
          | null;
        if (inner) inner.style.opacity = peer.busy ? "0.35" : "1";
      }

      for (const [id, marker] of markers) {
        if (!seen.has(id)) {
          marker.remove();
          markers.delete(id);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [peers, ready]);

  return (
    <div className="absolute inset-0">
      <div ref={containerRef} className="h-full w-full bg-[#050807]" />

      {!TOKEN && (
        <div className="absolute inset-0 flex items-center justify-center p-6 text-center">
          <p className="max-w-md rounded-lg bg-[#0B0F0E] p-4 text-sm text-[#F2F1EB]">
            Set{" "}
            <code className="text-[#02AAB0]">NEXT_PUBLIC_MAPBOX_TOKEN</code> in{" "}
            <code>.env</code> to load the map.
          </p>
        </div>
      )}

      <div className="absolute bottom-4 left-4 rounded-full bg-[#0B0F0E] px-3.5 py-2 text-xs font-medium text-[#F2F1EB]">
        {peers.length} online
      </div>
    </div>
  );
}
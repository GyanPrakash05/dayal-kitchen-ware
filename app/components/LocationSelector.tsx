"use client";

import { useEffect, useState } from "react";

type SavedLocation = {
  latitude: number;
  longitude: number;
  accuracy?: number;
};

const STORAGE_KEY = "dayal_customer_location";

export default function LocationSelector() {
  const [location, setLocation] = useState<SavedLocation | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);

      if (saved) {
        setLocation(JSON.parse(saved));
      }
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  function requestLocation() {
    setMessage("");

    if (!navigator.geolocation) {
      setMessage("Location is not supported on this device.");
      return;
    }

    setLoading(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const newLocation: SavedLocation = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
        };

        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify(newLocation)
        );

        setLocation(newLocation);
        setLoading(false);
        setMessage("Location detected successfully.");
      },
      (error) => {
        setLoading(false);

        if (error.code === error.PERMISSION_DENIED) {
          setMessage(
            "Location permission was denied. You can allow it from browser settings."
          );
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          setMessage("Your location could not be detected.");
        } else if (error.code === error.TIMEOUT) {
          setMessage("Location request timed out. Please try again.");
        } else {
          setMessage("Unable to detect your location.");
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000,
      }
    );
  }

  function clearLocation() {
    localStorage.removeItem(STORAGE_KEY);
    setLocation(null);
    setMessage("");
  }

  return (
    <div className="w-full">
      {!location ? (
        <button
          type="button"
          onClick={requestLocation}
          disabled={loading}
          className="flex w-full items-center justify-between gap-4 rounded-2xl border border-zinc-200 bg-white px-4 py-4 text-left shadow-sm transition hover:border-zinc-300 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60"
        >
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-amber-100 text-xl">
              📍
            </div>

            <div className="min-w-0">
              <p className="text-sm font-bold text-zinc-950">
                {loading
                  ? "Detecting your location..."
                  : "Set your location"}
              </p>

              <p className="mt-1 text-xs leading-5 text-zinc-500">
                {loading
                  ? "Please allow location access."
                  : "Check delivery availability near you."}
              </p>
            </div>
          </div>

          <span className="shrink-0 text-sm font-bold text-zinc-900">
            {loading ? "..." : "Detect"}
          </span>
        </button>
      ) : (
        <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div className="flex min-w-0 items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-green-100 text-xl">
                📍
              </div>

              <div className="min-w-0">
                <p className="text-sm font-bold text-zinc-950">
                  Location detected
                </p>

                <p className="mt-1 text-xs leading-5 text-zinc-500">
                  Your location is saved on this device for delivery
                  availability.
                </p>
              </div>
            </div>

            <span className="shrink-0 rounded-full bg-green-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-green-700">
              Ready
            </span>
          </div>

          <div className="mt-4 rounded-xl bg-zinc-50 px-3 py-3">
            <p className="text-[11px] font-medium text-zinc-500">
              Coordinates
            </p>

            <p className="mt-1 break-all text-xs font-semibold text-zinc-800">
              {location.latitude.toFixed(6)},{" "}
              {location.longitude.toFixed(6)}
            </p>
          </div>

          <div className="mt-3 flex gap-3">
            <button
              type="button"
              onClick={requestLocation}
              disabled={loading}
              className="flex-1 rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-xs font-bold text-zinc-900 transition hover:bg-zinc-50 disabled:opacity-60"
            >
              {loading ? "Detecting..." : "Update location"}
            </button>

            <button
              type="button"
              onClick={clearLocation}
              className="rounded-xl px-4 py-2.5 text-xs font-bold text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-900"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {message && (
        <p
          className={`mt-3 rounded-xl px-3 py-2.5 text-xs leading-5 ${
            message.includes("successfully")
              ? "bg-green-50 text-green-700"
              : "bg-amber-50 text-amber-700"
          }`}
        >
          {message}
        </p>
      )}
    </div>
  );
}
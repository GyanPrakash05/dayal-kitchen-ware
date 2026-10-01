"use client";

import { useEffect, useState } from "react";

type SavedLocation = {
  latitude: number;
  longitude: number;
  accuracy?: number;
};

type ManualLocation = {
  pincode: string;
};

const STORAGE_KEY = "dayal_customer_location";
const MANUAL_LOCATION_KEY = "dayal_customer_manual_location";

// Dayal Kitchen Ware store location
const STORE_LATITUDE = 28.605567;
const STORE_LONGITUDE = 77.0567969;

// Current delivery radius
const DELIVERY_RADIUS_KM = 3;

export default function LocationSelector() {
  const [location, setLocation] = useState<SavedLocation | null>(null);
  const [manualLocation, setManualLocation] =
    useState<ManualLocation | null>(null);

  const [pincode, setPincode] = useState("");
  const [loading, setLoading] = useState(false);
  const [manualLoading, setManualLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);

      if (saved) {
        const parsed = JSON.parse(saved);

        if (
          typeof parsed.latitude === "number" &&
          typeof parsed.longitude === "number"
        ) {
          setLocation(parsed);
        }
      }

      const savedManual = localStorage.getItem(MANUAL_LOCATION_KEY);

      if (savedManual) {
        const parsedManual = JSON.parse(savedManual);

        if (
          parsedManual &&
          typeof parsedManual.pincode === "string"
        ) {
          setManualLocation(parsedManual);
          setPincode(parsedManual.pincode);
        }
      }
    } catch {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(MANUAL_LOCATION_KEY);
    }
  }, []);

  function calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ) {
    const earthRadiusKm = 6371;

    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return earthRadiusKm * c;
  }

  function getDistanceFromStore() {
    if (!location) return null;

    return calculateDistance(
      STORE_LATITUDE,
      STORE_LONGITUDE,
      location.latitude,
      location.longitude
    );
  }

  function requestLocation() {
    setMessage("");

    if (!navigator.geolocation) {
      setMessage(
        "Location is not supported on this device. Please use manual location."
      );
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

        // GPS location becomes the active location.
        localStorage.removeItem(MANUAL_LOCATION_KEY);
        setManualLocation(null);

        setLocation(newLocation);
        setLoading(false);
        setMessage("Location detected successfully.");
      },
      (error) => {
        setLoading(false);

        if (error.code === error.PERMISSION_DENIED) {
          setMessage(
            "Location permission was denied. You can use manual location below."
          );
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          setMessage(
            "Your location could not be detected. You can use manual location below."
          );
        } else if (error.code === error.TIMEOUT) {
          setMessage(
            "Location request timed out. You can use manual location below."
          );
        } else {
          setMessage(
            "Unable to detect your location. You can use manual location below."
          );
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000,
      }
    );
  }

  function saveManualLocation() {
    setMessage("");

    const cleanPincode = pincode.trim();

    if (!/^\d{6}$/.test(cleanPincode)) {
      setMessage("Please enter a valid 6-digit pincode.");
      return;
    }

    setManualLoading(true);

    const newManualLocation: ManualLocation = {
      pincode: cleanPincode,
    };

    localStorage.setItem(
      MANUAL_LOCATION_KEY,
      JSON.stringify(newManualLocation)
    );

    // Manual location becomes the active location.
    localStorage.removeItem(STORAGE_KEY);
    setLocation(null);

    setManualLocation(newManualLocation);
    setManualLoading(false);

    setMessage(
      "Pincode saved. Delivery availability will be verified for this location."
    );
  }

  function clearLocation() {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(MANUAL_LOCATION_KEY);

    setLocation(null);
    setManualLocation(null);
    setPincode("");
    setMessage("");
  }

  const distance = getDistanceFromStore();

  const deliveryAvailable =
    distance !== null && distance <= DELIVERY_RADIUS_KM;

  return (
    <div className="w-full">
      {/* GPS LOCATION */}
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

          {/* DELIVERY AVAILABILITY */}
          {distance !== null && (
            <div
              className={`mt-4 rounded-xl border px-4 py-3 ${
                deliveryAvailable
                  ? "border-green-200 bg-green-50"
                  : "border-amber-200 bg-amber-50"
              }`}
            >
              <div className="flex items-start gap-3">
                <span className="text-lg">
                  {deliveryAvailable ? "🚚" : "📍"}
                </span>

                <div>
                  <p
                    className={`text-sm font-bold ${
                      deliveryAvailable
                        ? "text-green-800"
                        : "text-amber-800"
                    }`}
                  >
                    {deliveryAvailable
                      ? "Delivery available"
                      : "Outside current delivery area"}
                  </p>

                  <p
                    className={`mt-1 text-xs leading-5 ${
                      deliveryAvailable
                        ? "text-green-700"
                        : "text-amber-700"
                    }`}
                  >
                    You are approximately{" "}
                    <strong>{distance.toFixed(1)} km</strong> from
                    Dayal Kitchen Ware.
                  </p>

                  <p
                    className={`mt-1 text-[11px] ${
                      deliveryAvailable
                        ? "text-green-600"
                        : "text-amber-600"
                    }`}
                  >
                    Current delivery area: up to{" "}
                    {DELIVERY_RADIUS_KM} km from the store.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* DETECTED COORDINATES */}
          <div className="mt-4 rounded-xl bg-zinc-50 px-3 py-3">
            <p className="text-[11px] font-medium text-zinc-500">
              Detected location
            </p>

            <p className="mt-1 break-all text-xs font-semibold text-zinc-800">
              {location.latitude.toFixed(6)},{" "}
              {location.longitude.toFixed(6)}
            </p>

            {location.accuracy && (
              <p className="mt-1 text-[10px] text-zinc-500">
                Accuracy: approximately{" "}
                {Math.round(location.accuracy)} m
              </p>
            )}
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

      {/* MANUAL LOCATION */}
      {!location && (
        <div className="mt-4 rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-lg shadow-sm">
              🏠
            </div>

            <div>
              <p className="text-sm font-bold text-zinc-950">
                Use your pincode instead
              </p>

              <p className="mt-1 text-xs leading-5 text-zinc-500">
                Don&apos;t want to share location? Enter your 6-digit
                pincode.
              </p>
            </div>
          </div>

          <div className="mt-4 flex gap-2">
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={pincode}
              onChange={(event) => {
                const value = event.target.value
                  .replace(/\D/g, "")
                  .slice(0, 6);

                setPincode(value);
              }}
              placeholder="Enter pincode"
              className="min-w-0 flex-1 rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm font-semibold text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-zinc-400"
            />

            <button
              type="button"
              onClick={saveManualLocation}
              disabled={manualLoading || pincode.length !== 6}
              className="shrink-0 rounded-xl bg-zinc-950 px-4 py-3 text-xs font-bold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {manualLoading ? "Saving..." : "Save"}
            </button>
          </div>

          {manualLocation && (
            <div className="mt-3 rounded-xl border border-blue-200 bg-blue-50 px-3 py-3">
              <p className="text-xs font-bold text-blue-800">
                📍 Pincode {manualLocation.pincode} saved
              </p>

              <p className="mt-1 text-[11px] leading-5 text-blue-700">
                We&apos;ll verify delivery availability for this
                location.
              </p>
            </div>
          )}
        </div>
      )}

      {/* MESSAGE */}
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

      {/* CLEAR MANUAL LOCATION */}
      {!location && manualLocation && (
        <button
          type="button"
          onClick={clearLocation}
          className="mt-3 text-xs font-bold text-zinc-500 transition hover:text-zinc-900"
        >
          Clear saved location
        </button>
      )}
    </div>
  );
}
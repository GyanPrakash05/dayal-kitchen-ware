"use client";

import { useEffect, useState } from "react";

type TimingStatus = {
  isOpen: boolean;
  message: string;
  subMessage: string;
};

function getTimingStatus(): TimingStatus {
  const now = new Date();

  const indiaTime = new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    hour: "numeric",
    minute: "numeric",
    hour12: false,
  }).formatToParts(now);

  const hour =
    Number(
      indiaTime.find((part) => part.type === "hour")?.value || 0
    );

  const minute =
    Number(
      indiaTime.find((part) => part.type === "minute")?.value || 0
    );

  const totalMinutes = hour * 60 + minute;

  const openingTime = 9 * 60;
  const closingTime = 22 * 60;

  if (totalMinutes < openingTime) {
    return {
      isOpen: false,
      message: "🌅 Shop opens at 9:00 AM",
      subMessage:
        "Orders placed now will be processed today after the shop opens.",
    };
  }

  if (totalMinutes >= closingTime) {
    return {
      isOpen: false,
      message: "🌙 Shop is currently closed",
      subMessage:
        "Orders placed now will be scheduled for next-day delivery.",
    };
  }

  return {
    isOpen: true,
    message: "🟢 We're open • Same-day delivery available",
    subMessage:
      "Shop & delivery hours: 9:00 AM – 10:00 PM",
  };
}

export default function ShopTimingBanner() {
  const [status, setStatus] = useState<TimingStatus | null>(null);

  useEffect(() => {
    function updateStatus() {
      setStatus(getTimingStatus());
    }

    updateStatus();

    const interval = window.setInterval(
      updateStatus,
      60 * 1000
    );

    return () => {
      window.clearInterval(interval);
    };
  }, []);

  if (!status) {
    return null;
  }

  return (
    <div
      className={`w-full border-b ${
        status.isOpen
          ? "border-green-200 bg-green-50"
          : "border-amber-200 bg-amber-50"
      }`}
    >
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3 sm:px-6 lg:px-8">
        <div
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
            status.isOpen
              ? "bg-green-100"
              : "bg-amber-100"
          }`}
        >
          {status.isOpen ? "🟢" : "🕐"}
        </div>

        <div className="min-w-0">
          <p
            className={`text-sm font-bold ${
              status.isOpen
                ? "text-green-800"
                : "text-amber-800"
            }`}
          >
            {status.message}
          </p>

          <p
            className={`mt-0.5 text-xs ${
              status.isOpen
                ? "text-green-700"
                : "text-amber-700"
            }`}
          >
            {status.subMessage}
          </p>
        </div>
      </div>
    </div>
  );
}
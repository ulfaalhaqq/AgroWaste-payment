"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";

interface UserProfile {
  name: string;
  peternak_profile?: {
    total_sold_kg: string | number;
    badge: string;
  };
}

export default function BadgesPage() {
  const [totalSold, setTotalSold] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch("/profile")
      .then((r) => (r.ok ? r.json() : null))
      .then((json) => {
        if (json?.success && json?.data) {
          const user = json.data as UserProfile;
          const sold = Number(user.peternak_profile?.total_sold_kg || 0);
          setTotalSold(sold);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const carbonKg = totalSold * 0.98;
  const carbonText =
    carbonKg >= 1000
      ? `${(carbonKg / 1000).toFixed(1)} Ton`
      : `${carbonKg.toFixed(0)} kg`;
  // Konversi US EPA dari ImpactCalculator: Math.ceil(volume * 0.0108)
  const treesPlanted = Math.ceil(totalSold * 0.0108);

  const badges = [
    {
      id: "peternak_hijau",
      name: "Peternak Hijau",
      target: 100,
      description:
        "Kelola 100 kg limbah organik untuk mendukung ekonomi sirkular.",
      image: "/images/badges/petani_hijau.png",
      gradient: "from-emerald-400 to-emerald-600",
      tier: "Pioneer Hijau",
    },
    {
      id: "agen_iklim",
      name: "Agen Iklim",
      target: 500,
      description:
        "Olah 500 kg limbah organik untuk meminimalkan dampak pemanasan global.",
      image: "/images/badges/agen_iklim.png",
      gradient: "from-blue-400 to-blue-600",
      tier: "Pembela Atmosfer",
    },
    {
      id: "pahlawan_bumi",
      name: "Pahlawan Bumi",
      target: 1000,
      description:
        "Selamatkan 1.000 kg limbah untuk memulihkan kesuburan tanah daerah setempat.",
      image: "/images/badges/pahlawan_bumi.png",
      gradient: "from-amber-400 to-amber-600",
      tier: "Pelindung Ekosistem",
    },
    {
      id: "alkemis_limbah",
      name: "Master Alkemis",
      target: 5000,
      description:
        "Daur ulang 5.000 kg limbah organik menjadi berkah pertanian berkelanjutan.",
      image: "/images/badges/alkemis_limbah.png",
      gradient: "from-amber-400 to-yellow-500",
      tier: "Dewa Sirkular",
    },
  ];

  return (
    <div className="space-y-8 animate-fade-in pb-10">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-seller-textprimary mb-1">
          Galeri Lencana Dampak
        </h2>
        <p className="text-sm text-seller-textsecondary">
          Pantau kontribusimu untuk ekonomi sirkular. Dapatkan lencana dengan
          mengolah limbah, memperbaiki tanah, serta reduksi emisi metana (CO₂e).
        </p>
      </div>

      {/* Top Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-seller-surfacewhite border border-seller-hairline p-6 rounded-2xl flex items-center justify-between relative overflow-hidden">
          <div className="absolute right-0 top-0 w-24 h-24 bg-seller-primary/5 rounded-bl-full -mr-4 -mt-4"></div>
          <div>
            <div className="text-seller-primary mb-3">
              <svg
                className="w-8 h-8"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
                />
              </svg>
            </div>
            <span className="text-[10px] font-bold text-seller-textsecondary uppercase tracking-wider block mb-1">
              TOTAL LIMBAH TERSELAMATKAN
            </span>
            <h3 className="text-2xl font-bold text-seller-textprimary font-tabular">
              {loading ? "..." : `${totalSold.toLocaleString("id-ID")} kg`}
            </h3>
          </div>
        </div>

        <div className="bg-seller-surfacewhite border border-seller-hairline p-6 rounded-2xl flex items-center justify-between relative overflow-hidden">
          <div className="absolute right-0 top-0 w-24 h-24 bg-emerald-500/5 rounded-bl-full -mr-4 -mt-4"></div>
          <div>
            <div className="text-[#009A44] mb-3">
              <svg
                className="w-8 h-8"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                />
              </svg>
            </div>
            <span className="text-[10px] font-bold text-seller-textsecondary uppercase tracking-wider block mb-1">
              KESETARAAN POHON
            </span>
            <h3 className="text-2xl font-bold text-seller-textprimary font-tabular">
              {loading ? "..." : `${treesPlanted} Pohon`}
            </h3>
          </div>
        </div>

        <div className="bg-seller-surfacewhite border border-seller-hairline p-6 rounded-2xl flex items-center justify-between relative overflow-hidden">
          <div className="absolute right-0 top-0 w-24 h-24 bg-amber-500/5 rounded-bl-full -mr-4 -mt-4"></div>
          <div>
            <div className="text-amber-500 mb-3 font-bold text-xl flex items-baseline">
              <span>CO</span>
              <sub className="text-xs">2</sub>
              <span className="text-base font-medium">e</span>
            </div>
            <span className="text-[10px] font-bold text-seller-textsecondary uppercase tracking-wider block mb-1">
              PENGURANGAN KARBON
            </span>
            <h3 className="text-2xl font-bold text-seller-textprimary font-tabular">
              {loading ? "..." : carbonText}
            </h3>
          </div>
        </div>
      </div>

      {/* Badges Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {badges.map((badge) => {
          const isUnlocked = totalSold >= badge.target;
          const percentage = Math.min(
            100,
            Math.round((totalSold / badge.target) * 100),
          );
          const remaining = Math.max(0, badge.target - totalSold);

          return (
            <div
              key={badge.id}
              className={`bg-seller-surfacewhite border border-seller-hairline rounded-2xl p-6 text-center flex flex-col items-center justify-between relative ${
                !isUnlocked ? "opacity-75" : ""
              }`}
            >
              <div className="flex flex-col items-center w-full">
                <div className="relative w-32 h-32 mb-6 flex items-center justify-center">
                  {/* Badge Graphic */}
                  {badge.image ? (
                    <img
                      src={badge.image}
                      alt={badge.name}
                      className={`w-full h-full object-contain drop-shadow-md transition-transform duration-300 hover:scale-105 ${
                        !isUnlocked ? "grayscale opacity-50" : ""
                      }`}
                    />
                  ) : (
                    <div
                      className={`w-full h-full rounded-full bg-gradient-to-br ${
                        isUnlocked
                          ? badge.gradient
                          : "from-[#EAE6E1] to-[#D5CFC6]"
                      } flex items-center justify-center border-4 border-white shadow-lg relative`}
                    >
                      {isUnlocked ? (
                        <svg
                          className="w-10 h-10 text-white"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.5}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      ) : (
                        <svg
                          className="w-10 h-10 text-seller-textsecondary"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                          />
                        </svg>
                      )}
                    </div>
                  )}

                  {/* Status Indicator */}
                  <div
                    className={`absolute bottom-0 right-0 w-7 h-7 rounded-full ${
                      isUnlocked
                        ? "bg-seller-primary text-white"
                        : "bg-[#B5ADA3] text-white"
                    } flex items-center justify-center border-2 border-white shadow-md z-10`}
                  >
                    {isUnlocked ? (
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={3}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    ) : (
                      <svg
                        className="w-3.5 h-3.5 text-white"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2.5}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                        />
                      </svg>
                    )}
                  </div>
                </div>

                <h3 className="text-xl font-bold text-seller-textprimary">
                  {badge.name}
                </h3>
                <span className="text-xs text-seller-textsecondary block mt-1 mb-4">
                  {isUnlocked ? `Tingkat: ${badge.tier}` : "Belum Tercapai"}
                </span>

                <p className="text-xs text-seller-textsecondary px-2 mb-6 leading-relaxed">
                  {badge.description}
                </p>
              </div>

              <div className="w-full text-left mt-auto">
                <div className="flex justify-between text-[10px] font-bold text-seller-textprimary mb-1.5">
                  <span>
                    {totalSold.toLocaleString("id-ID")} kg /{" "}
                    {badge.target.toLocaleString("id-ID")} kg
                  </span>
                  <span
                    className={
                      isUnlocked
                        ? "text-seller-primary"
                        : "text-seller-textsecondary"
                    }
                  >
                    {percentage}%
                  </span>
                </div>
                <div className="w-full bg-seller-warmbg h-1.5 rounded-full overflow-hidden mb-2">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      isUnlocked ? "bg-seller-primary" : "bg-[#B5ADA3]"
                    }`}
                    style={{ width: `${percentage}%` }}
                  ></div>
                </div>
                <p className="text-[10px] text-seller-textsecondary text-center">
                  {isUnlocked
                    ? "Lencana ini telah aktif!"
                    : `${remaining.toLocaleString("id-ID")} kg lagi menuju lencana ini`}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

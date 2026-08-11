"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

interface TopbarProps {
  onMenuToggle?: () => void;
}

export const Topbar = ({ onMenuToggle }: TopbarProps) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const currentRole = searchParams.get("role") || "ALL";
  const currentSearch = searchParams.get("search") || "";

  const [searchVal, setSearchVal] = useState(currentSearch);
  const [roleVal, setRoleVal] = useState(currentRole);

  useEffect(() => {
    setSearchVal(searchParams.get("search") || "");
    setRoleVal(searchParams.get("role") || "ALL");
  }, [searchParams]);

  const handleUpdateQuery = (newSearch: string, newRole: string) => {
    const params = new URLSearchParams();
    if (newSearch.trim()) params.set("search", newSearch.trim());
    if (newRole && newRole !== "ALL") params.set("role", newRole);

    const queryString = params.toString();
    const targetPath = "/admin/users";

    router.push(queryString ? `${targetPath}?${queryString}` : targetPath);
  };

  return (
    <header className="bg-admin-surfacewhite h-16 border-b border-admin-hairline px-4 sm:px-8 flex items-center justify-between sticky top-0 z-20 gap-4">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        {/* Mobile hamburger */}
        <button
          type="button"
          aria-label="Buka/tutup navigasi"
          onClick={onMenuToggle}
          className="lg:hidden p-2 -ml-1 rounded-lg hover:bg-admin-warmbg text-admin-textsecondary transition-colors shrink-0"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        </button>

        {/* Search */}
        <div className="relative flex-1 max-w-md hidden sm:block">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-admin-textsecondary">
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </span>
          <input
            type="search"
            value={searchVal}
            onChange={(e) => {
              const val = e.target.value;
              setSearchVal(val);
              handleUpdateQuery(val, roleVal);
            }}
            placeholder="Cari pengguna (nama/email)..."
            className="w-full pl-9 pr-4 py-2 bg-admin-warmbg border border-admin-hairline rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-admin-primary focus:bg-admin-surfacewhite transition-colors text-admin-textprimary"
          />
        </div>
      </div>

      <div className="flex items-center gap-3 shrink-0">
        {/* Category selector */}
        <div className="relative hidden md:block">
          <select
            value={roleVal}
            onChange={(e) => {
              const val = e.target.value;
              setRoleVal(val);
              handleUpdateQuery(searchVal, val);
            }}
            className="block py-1.5 pl-3 pr-8 text-xs bg-admin-warmbg border border-admin-hairline rounded-full focus:outline-none focus:ring-1 focus:ring-admin-primary appearance-none cursor-pointer text-admin-textsecondary font-medium"
          >
            <option value="ALL">Semua Kategori</option>
            <option value="peternak">Peternak (Penjual)</option>
            <option value="pembeli">Pembeli</option>
            <option value="logistik">Kurir Logistik</option>
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-admin-textsecondary">
            <svg
              className="w-3 h-3"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </div>
    </header>
  );
};

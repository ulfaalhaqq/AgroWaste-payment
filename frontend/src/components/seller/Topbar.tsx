"use client";

interface TopbarProps {
  onMenuToggle?: () => void;
}

export const Topbar = ({ onMenuToggle }: TopbarProps) => {
  return (
    <header className="bg-seller-surfacewhite h-16 border-b border-seller-hairline px-4 sm:px-8 flex items-center justify-between sticky top-0 z-20 gap-4">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        {/* Mobile hamburger */}
        <button
          type="button"
          aria-label="Buka/tutup navigasi"
          onClick={onMenuToggle}
          className="lg:hidden p-2 -ml-1 rounded-lg hover:bg-seller-warmbg text-seller-textsecondary transition-colors shrink-0"
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
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-seller-textsecondary">
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
            </svg>
          </span>
          <input
            type="text"
            placeholder="Cari pesanan, limbah, atau mitra..."
            className="w-full pl-9 pr-4 py-2 bg-seller-warmbg border border-seller-hairline rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-seller-primary focus:bg-seller-surfacewhite transition-colors text-seller-textprimary"
          />
        </div>
      </div>
      <div className="flex items-center gap-4">
        {/* Selektor Bank/Kategori Cepat */}
        <div className="relative inline-block text-left">
          <select className="block w-full py-1.5 pl-3 pr-10 text-xs bg-seller-warmbg border border-seller-hairline rounded-full focus:outline-none focus:ring-1 focus:ring-seller-primary appearance-none cursor-pointer text-seller-textsecondary font-medium">
            <option>Semua Wilayah</option>
            <option>Jawa Timur</option>
            <option>Jawa Tengah</option>
            <option>Jawa Barat</option>
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-seller-textsecondary">
            <svg
              className="w-3 h-3"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path d="M19 9l-7 7-7-7"></path>
            </svg>
          </div>
        </div>
      </div>
    </header>
  );
};

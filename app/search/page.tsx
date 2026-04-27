"use client";

import { useState } from "react";
import { InfiniteFeed } from "@/components/productos/infinite-feed";

export default function SearchPage() {
  const [searchTerm, setSearchTerm] = useState("");

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="sticky top-0 bg-white pb-4 z-10">
        <input
          type="text"
          placeholder="Buscar productos..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full h-12 px-4 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:border-primary"
        />
      </div>
      <InfiniteFeed search={searchTerm} />
    </div>
  );
}
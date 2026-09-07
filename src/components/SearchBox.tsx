"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

export function SearchBox() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [value, setValue] = useState(searchParams.get("q") ?? "");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set("q", value);
    else params.delete("q");
    router.push(`/?${params.toString()}`);
  }

  return (
    <form onSubmit={submit} className="relative">
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Search name, username, bio"
        className="bg-transparent border-b border-border focus:border-accent outline-none text-sm py-1.5 pr-6 w-56 placeholder:text-fg-faint transition-colors"
      />
      {value && (
        <button
          type="button"
          onClick={() => {
            setValue("");
            const params = new URLSearchParams(searchParams.toString());
            params.delete("q");
            router.push(`/?${params.toString()}`);
          }}
          className="absolute right-0 top-1/2 -translate-y-1/2 text-fg-faint hover:text-fg text-xs cursor-pointer"
        >
          clear
        </button>
      )}
    </form>
  );
}

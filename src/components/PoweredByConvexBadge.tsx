import React from "react";
import Link from "next/link";

export const PoweredByConvexBadge: React.FC = () => {
  return (
    <div className="absolute top-4 left-4 z-20 hidden md:block">
      <Link
        href="https://convex.dev"
        target="_blank"
        className="border bg-card p-2 flex flex-row rounded-xl gap-2 items-center"
      >
        <img src="/convex.svg" alt="Convex Logo" className="w-10 h-10" />
        <div className="text-xs">
          Powered by <br />
          <span className="font-bold text-xl">Convex</span>
        </div>
      </Link>
    </div>
  );
};

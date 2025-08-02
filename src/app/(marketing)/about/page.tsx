import { Metadata } from "next";

import { pageProse } from "@/components/page-prose";
import { cn } from "@/lib/utils";

import { About } from "./component";

export const metadata: Metadata = {
  title: "Infinite Canvas - about",
  description: "What is Infinite Canvas?",
};

export default function Page() {
  return (
    <div className={cn(...pageProse)}>
      <About />
    </div>
  );
}

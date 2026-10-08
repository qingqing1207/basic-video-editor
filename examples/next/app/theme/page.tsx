"use client";
import dynamic from "next/dynamic";
const ThemeLab = dynamic(() => import("../../../shared/theme-lab"), {
  ssr: false,
});
export default function Page() {
  return <ThemeLab />;
}

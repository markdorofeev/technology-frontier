import type { Metadata } from "next";
import { Digest } from "@/components/digest";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "This month" };

export default function Month() {
  return <Digest period="month" />;
}

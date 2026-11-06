import { Digest } from "@/components/digest";

export const dynamic = "force-dynamic";

export default function Home() {
  return <Digest period="week" />;
}

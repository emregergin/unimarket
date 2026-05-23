import { TopBar } from "@/components/nav/top-bar";
import { SellForm } from "./sell-form";

export const dynamic = "force-dynamic";

export default function SellPage() {
  return (
    <>
      <TopBar title="İlan Oluştur" showBack />
      <SellForm />
    </>
  );
}

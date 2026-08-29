import AtmosphericIntelligence from "@/features/atmospheric-intelligence/AtmosphericIntelligence";
import { loadAtmosphericDataset } from "@/features/atmospheric-intelligence/service";
import "./atmospheric-intelligence.css";

export const revalidate = 1800;
export default async function Page() { return <AtmosphericIntelligence initialData={await loadAtmosphericDataset()} />; }


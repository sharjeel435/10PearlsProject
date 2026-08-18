import Dashboard from "@/components/Dashboard";
import { loadDashboardData } from "@/lib/data";

export default async function Page() {
  return <Dashboard data={await loadDashboardData()} />;
}

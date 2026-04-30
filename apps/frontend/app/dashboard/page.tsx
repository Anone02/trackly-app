// app/dashboard/page.tsx
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import DashboardContent from "@/components/DashboardContent";
import { getDashboardStats } from "@/app/actions";


export default async function DashboardPage() {
  const cookieStore = await cookies();
  const userId = cookieStore.get("user_session")?.value;

  // 1. Proteksi Halaman: Kalau nggak ada session, tendang ke login
  if (!userId) {
    redirect("/login");
  }

  // 2. Ambil data gabungan dari server action
  // getDashboardStats sekarang udah gue update buat narik data user + apps sekaligus
  const initialData = await getDashboardStats();

  // 3. Fallback kalau data gagal diambil (misal DB down)
  if (!initialData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white">
        <p className="font-black italic animate-pulse">ERROR_FETCHING_CORE_DATA...</p>
      </div>
    );
  }

  // 4. Kirim data ke Client Component
  return <DashboardContent initialStats={initialData} />;
}
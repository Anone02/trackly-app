"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma"; 
import bcrypt from "bcrypt";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import jwt from "jsonwebtoken";

// HELPER: Fungsi buat bongkar token biar gak ngetik ulang-ulang
async function getUserIdFromToken() {
  const cookieStore = await cookies();
  const token = cookieStore.get("user_session")?.value;
  if (!token) return null;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: number };
    return decoded.userId;
  } catch (e) {
    return null;
  }
}

/**
 * ACTION: REGISTER USER
 */
export async function registerUser(prevState: any, formData: FormData) {
  const username = formData.get("username") as string;
  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  if (!username || !password) return { error: "Username dan Password wajib diisi!" };
  if (password !== confirmPassword) return { error: "Password tidak cocok!" };

  try {
    const existingUser = await prisma.user.findUnique({ where: { username } });
    if (existingUser) return { error: "Username sudah dipakai!" };

    const hashedPassword = await bcrypt.hash(password, 10);
    await prisma.user.create({
      data: { username, password: hashedPassword },
    });

    return { success: true };
  } catch (e) {
    console.error("Register Error:", e);
    return { error: "Gagal daftar. Cek database Docker lo!" };
  }
}

/**
 * ACTION: LOGIN USER
 */
export async function loginUser(prevState: any, formData: FormData) {
  const username = formData.get("username") as string;
  const password = formData.get("password") as string;

  if (!username || !password) return { error: "Isi dulu username ama passwordnya!" };

  let isSuccess = false;
  try {
    const user = await prisma.user.findUnique({ where: { username } });
    if (!user) return { error: "Username nggak ketemu!" };

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) return { error: "Password lo salah!" };

    // 1. BIKIN TOKEN
    const token = jwt.sign(
      { userId: user.id }, 
      process.env.JWT_SECRET!, 
      { expiresIn: "7d" }
    );

    // 2. SET COOKIE PAKE TOKEN (Bukan ID mentah)
    const cookieStore = await cookies();
    cookieStore.set("user_session", token, { // TADI LO SALAH DI SINI
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });
    isSuccess = true;
  } catch (e) {
    console.error("Login Error:", e);
    return { error: "Terjadi kesalahan sistem saat login." };
  }

  if (isSuccess) redirect("/dashboard");
}

/**
 * ACTION: LOGOUT
 */
export async function logoutUser() {
  const cookieStore = await cookies();
  cookieStore.delete("user_session");
  redirect("/login");
}

/**
 * ACTION: GET DASHBOARD STATS
 */
export async function getDashboardStats() {
  const userId = await getUserIdFromToken(); // PAKE HELPER
  if (!userId) return null;

  try {
    const apps = await prisma.jobApplication.findMany({
      where: { userId: userId },
      orderBy: { applicationDate: 'desc' }
    });

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { username: true, telegramId: true }
    });

    return {
      total: apps.length,
      rejected: apps.filter((a: any) => a.applicationStatus === "Rejected").length,
      interview: apps.filter((a: any) => a.applicationStatus === "Interview").length,
      applied: apps.filter((a: any) => a.applicationStatus === "Applied").length,
      allData: apps,
      user: user
    };
  } catch (e) {
    console.error("Fetch Stats Error:", e);
    return null;
  }
}

/**
 * ACTION: ADD / UPDATE JOB APPLICATION
 */
export async function addApplication(prevState: any, formData: FormData) {
  const userId = await getUserIdFromToken(); // PAKE HELPER
  if (!userId) return { error: "Sesi habis, login lagi." };

  const id = formData.get("id") as string;
  const applicationData = {
    companyName: formData.get("companyName") as string,
    jobTitle: formData.get("jobTitle") as string,
    location: formData.get("location") as string,
    jobType: formData.get("jobType") as string,
    applicationStatus: formData.get("status") as string,
    sourceLink: formData.get("sourceLink") as string,
    contactPerson: formData.get("contactPerson") as string,
    salary: formData.get("salary") ? String(formData.get("salary")) : null,
    notes: formData.get("notes") as string,
    applicationDate: new Date(formData.get("appDate") as string),
    followUpDate: formData.get("followUpDate") ? new Date(formData.get("followUpDate") as string) : null,
    userId: userId,
  };

  try {
    if (id && id !== "") {
      await prisma.jobApplication.update({ where: { id: Number(id) }, data: applicationData });
    } else {
      await prisma.jobApplication.create({ data: applicationData });
    }
    revalidatePath("/dashboard");
    return { success: true };
  } catch (e) {
    console.error("App Error:", e);
    return { error: "Gagal memproses data!" };
  }
}

/**
 * ACTION: UPDATE PROFILE
 */
export async function updateProfile(data: { username?: string; password?: string; telegramId?: string }) {
  const userId = await getUserIdFromToken();
  if (!userId) return { error: "Sesi tidak valid" };

  try {
    const updateData: any = {};
    if (data.username) updateData.username = data.username;
    if (data.telegramId) updateData.telegramId = data.telegramId; 
    
    if (data.password && data.password.trim() !== "") {
      updateData.password = await bcrypt.hash(data.password, 10);
    }

    await prisma.user.update({
      where: { id: userId },
      data: updateData,
    });

    revalidatePath("/", "layout"); 
    return { success: true };
  } catch (e) {
    console.error("Update Profile Error:", e);
    return { error: "Gagal update profil!" };
  }
}

/**
 * ACTION: DELETE APPLICATION
 */
export async function deleteApplication(id: number) {
  try {
    await prisma.jobApplication.delete({ where: { id } });
    revalidatePath("/dashboard");
    return { success: true };
  } catch (e) {
    return { error: "Gagal hapus!" };
  }
}

/**
 * ACTION: GET APPLICATIONS (SEARCH)
 */
export async function getApplications(search: string = '', status: string = 'All') {
  const userId = await getUserIdFromToken(); // TAMBAHIN INI BIAR GAK LIAT DATA ORANG LAIN
  if (!userId) return [];

  try {
    const applications = await prisma.jobApplication.findMany({
      where: {
        userId: userId, // WAJIB FILTER BY USERID
        companyName: {
          contains: search,
          mode: 'insensitive',
        },
        ...(status !== 'All' ? { applicationStatus: status } : {}),
      },
      orderBy: {
        applicationDate: 'desc',
      },
    });
    return applications;
  } catch (error) {
    console.error(error);
    return [];
  }
}


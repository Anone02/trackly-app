import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const message = body.message;

    // Kalau user ngirim stiker/gambar, message.text bakal null/undefined
    if (!message?.text) {
      console.log("User ngirim sampah (stiker/gambar)");
      return NextResponse.json({ ok: true }); 
    }

    const chatId = message.chat.id.toString();
    const text = message.text;

    // 1. Cari user di DB lewat telegramId
    const user = await prisma.user.findUnique({
      where: { telegramId: chatId }
    });

    if (!user) {
      console.log("Chat ID gak dikenal");
      return NextResponse.json({ ok: true });
    }

    // 2. Logic Tambah Data (Format: /add NamaPT|Posisi|Gaji)
    if (text.startsWith("/add ")) {
      const input = text.replace("/add ", "");
      const [company, position, salary] = input.split("|");

      // HAJAR LANGSUNG KE DB
      // Kalau company atau position kosong, Prisma bakal lempar ERROR ke catch block
      await prisma.jobApplication.create({
        data: {
          companyName: company.trim(),
          jobTitle: position.trim(),
          salary: salary ? salary.replace(/\./g, "").trim() : null, // Bersihin titik di gaji
          applicationStatus: "Applied",
          applicationDate: new Date(),
          userId: user.id
        }
      });

      // Balas ke Telegram kalau sukses
      await sendMessage(chatId, `✅ Sip! Data ${company} udah masuk.`);
    }

    return NextResponse.json({ ok: true });

  } catch (error) {
    // Kalau format salah atau ada field yang null, larinya ke sini
    console.error("WEBHOOK ERROR:", error);
    return NextResponse.json({ ok: true }); 
  }
}

// Helper kirim pesan
async function sendMessage(chatId: string, text: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text })
  });
}
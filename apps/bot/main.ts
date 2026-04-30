import TelegramBot from 'node-telegram-bot-api';
import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
import { Parser } from 'json2csv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../../.env') });
const prisma = new PrismaClient();
const token = process.env.TELEGRAM_BOT_TOKEN;
if (!token) {
  console.error("❌ ERROR: TELEGRAM_BOT_TOKEN gak nemu di .env!");
  process.exit(1);
}
const bot = new TelegramBot(token, { polling: true });
console.log("🚀 Bot berhasil jalan pakai token dari root .env");
//const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN!, { polling: true });

// State user untuk menangani flow input dan update
const userState: { 
  [key: string]: { 
    menu: string; 
    step: number; 
    data: any; 
    lastMsgId?: number;
    editAppId?: string; 
    editField?: string; 
  } 
} = {};

console.log("🚀 Trackly Bot Clean Version is running...");

// --- FUNGSI TAMPILAN MENU UTAMA ---
const sendMainMenu = async (chatId: number) => {
  const welcomeMsg = `👋 *Welcome to Trackly!*
Asisten cerdas pelacak lamaran kerja lo.

*Silakan pilih menu di bawah:*`;

  const menu = await bot.sendMessage(chatId, welcomeMsg, {
    parse_mode: 'Markdown',
    reply_markup: {
      inline_keyboard: [
        [{ text: "🆔 Generate Telegram ID", callback_data: "menu_id" }],
        [{ text: "➕ Add New App", callback_data: "menu_add" }],
        [{ text: "🔄 Update App", callback_data: "menu_update" }],
        [{ text: "📊 Export to CSV (Excel)", callback_data: "menu_export" }],
        [{ text: "📖 Readme", callback_data: "menu_readme" }],
        [{ text: "♻️ Restart / Clear View", callback_data: "menu_restart" }]
      ]
    }
  });
  
  if (!userState[chatId]) userState[chatId] = { menu: '', step: 0, data: {} };
  userState[chatId].lastMsgId = menu.message_id;
};

// --- HANDLER TOMBOL (CALLBACK QUERY) ---
bot.on('callback_query', async (query) => {
  const chatId = query.message!.chat.id;
  const messageId = query.message!.message_id;
  const data = query.data!;

  if (data === "menu_restart") {
    try {
      await bot.deleteMessage(chatId, messageId); 
      sendMainMenu(chatId);
    } catch (e) {
      sendMainMenu(chatId);
    }
  } 
  else if (data === "menu_id") {
    bot.sendMessage(chatId, `Nih ID lo: \`${chatId}\`\n\nKetik \`/back\` untuk kembali.`, { parse_mode: 'Markdown' });
  }
  else if (data === "menu_add") {
    userState[chatId] = { menu: 'ADD', step: 1, data: {} };
    bot.sendMessage(chatId, "🏢 *1. Nama Perusahaan?*\nContoh: `PT. Maju Mundur` atau `Gojek`", { parse_mode: 'Markdown' });
  }
  else if (data === "menu_readme") {
    const readme = `📖 *CARA KERJA TRACKLY*

1️⃣ **Connect ID**: Gunakan menu 'Generate ID', lalu paste ke Dashboard Web (Settings).
2️⃣ **Add App**: Input lamaran baru lewat chat ini secara bertahap.
3️⃣ **Update**: Ubah status lamaran yang sudah ada.
4️⃣ **Export**: Download semua data lamaran lo dalam format Excel/CSV.

💡 *Tips:* Gunakan \`/back\` jika salah input.`;
    bot.sendMessage(chatId, readme, {
      parse_mode: 'Markdown',
      reply_markup: { inline_keyboard: [[{ text: "⬅️ Kembali", callback_data: "back_to_main" }]] }
    });
  }
  else if (data === "menu_update") {
    try {
      const user = await prisma.user.findFirst({ where: { telegramId: chatId.toString() } });
      const apps = await prisma.jobApplication.findMany({
        where: { userId: user?.id },
        orderBy: { applicationDate: 'desc' },
        take: 5
      });

      if (!apps.length) return bot.sendMessage(chatId, "Belum ada data lamaran untuk di-update.");

      const buttons = apps.map(app => [{
        text: `✏️ ${app.companyName}`,
        callback_data: `edit_select_${app.id}`
      }]);
      bot.sendMessage(chatId, "Pilih lamaran yang mau di-update:", {
        reply_markup: { inline_keyboard: buttons }
      });
    } catch (e) {
      bot.sendMessage(chatId, "Gagal memuat data.");
    }
  }
  // Logic milih parameter yang mau diupdate
  else if (data.startsWith("edit_select_")) {
    const appId = data.split("_")[2];
    const fields = [
      [{ text: "🏢 Company", callback_data: `updField_companyName_${appId}` }, { text: "💼 Role", callback_data: `updField_jobTitle_${appId}` }],
      [{ text: "📍 Location", callback_data: `updField_location_${appId}` }, { text: "🕒 Type", callback_data: `updField_jobType_${appId}` }],
      [{ text: "📅 App Date", callback_data: `updField_applicationDate_${appId}` }, { text: "📊 Status", callback_data: `updField_applicationStatus_${appId}` }],
      [{ text: "🔗 Link", callback_data: `updField_sourceLink_${appId}` }, { text: "👤 Contact", callback_data: `updField_contactPerson_${appId}` }],
      [{ text: "📆 Follow-up", callback_data: `updField_followUpDate_${appId}` }, { text: "💰 Salary", callback_data: `updField_salary_${appId}` }],
      [{ text: "📝 Notes", callback_data: `updField_notes_${appId}` }]
    ];
    bot.sendMessage(chatId, "Parameter mana yang mau di-update?", {
      reply_markup: { inline_keyboard: fields }
    });
  }
  // Logic minta input value baru
  else if (data.startsWith("updField_")) {
    const [, field, appId] = data.split("_");
    userState[chatId] = { menu: 'UPDATE_VAL', step: 1, data: {}, editAppId: appId, editField: field };

    let textKeterangan = "";

    // Kasih detail keterangan contoh pas mau ngetik manual
    switch (field) {
      case "companyName": 
        textKeterangan = "🏢 *Update Nama Perusahaan*\nKetik nama perusahaan baru.\nContoh: `PT. Maju Mundur` atau `Gojek`"; break;
      case "jobTitle": 
        textKeterangan = "💻 *Update Job Title*\nKetik posisi baru.\nContoh: `Frontend Developer` atau `Data Analyst`"; break;
      case "location": 
        textKeterangan = "📍 *Update Location*\nKetik lokasi baru.\nContoh: `Jakarta`, `Remote`, atau `Singapore`"; break;
      case "jobType": 
        textKeterangan = "💼 *Update Job Type*\nKetik jenis pekerjaan.\nOpsi: `Full-time`, `Contract`, `Freelance`, atau `Internship`"; break;
      case "applicationDate": 
        textKeterangan = "📅 *Update Application Date*\nFormat: `MM/DD/YYYY` (Bulan/Tanggal/Tahun)\nContoh: `04/28/2026`"; break;
      case "applicationStatus": 
        textKeterangan = "🚦 *Update Status*\nKetik status terbaru.\nOpsi: `Applied`, `Interview`, `Offering Letter`, atau `Rejected`"; break;
      case "sourceLink": 
        textKeterangan = "🔗 *Update Source Link*\nKetik link atau ketik `-` jika tidak ada."; break;
      case "contactPerson": 
        textKeterangan = "👤 *Update Contact Person / HR*\nKetik nama/kontak atau ketik `-` jika tidak tahu."; break;
      case "followUpDate": 
        textKeterangan = "⏰ *Update Follow-up Date*\nFormat: `MM/DD/YYYY` (Bulan/Tanggal/Tahun)\nContoh: `05/05/2026`"; break;
      case "salary": 
        textKeterangan = "💰 *Update Salary Estimate*\nContoh: `10jt - 15jt` atau `Negotiable` "; break;
      case "notes": 
        textKeterangan = "📝 *Update Notes*\nContoh: `Benefit asuransi lengkap.` atau ketik `-`"; break;
      default: 
        textKeterangan = `Silakan ketik nilai baru untuk *${field}*:`;
    }

    // Pake force_reply biar kursor lo otomatis fokus ke kolom chat
    bot.sendMessage(chatId, textKeterangan, { 
      parse_mode: "Markdown",
      reply_markup: { 
        remove_keyboard: true // Pastiin keyboard tombol-tombol ilang biar enak ngetiknya
      } 
    });
  }
  else if (data === "menu_export") {
    try {
      const user = await prisma.user.findFirst({ where: { telegramId: chatId.toString() } });
      if (!user) return bot.sendMessage(chatId, "❌ User tidak ditemukan.");

      const apps = await prisma.jobApplication.findMany({
        where: { userId: user.id },
        orderBy: { applicationDate: 'desc' } 
      });

      if (apps.length === 0) return bot.sendMessage(chatId, "Belum ada data.");

      const dataUntukCsv = apps.map((app, index) => ({
        ...app,
        no: index + 1,
        applicationDate: app.applicationDate ? app.applicationDate.toISOString().split('T')[0] : '-',
        followUpDate: app.followUpDate ? app.followUpDate.toISOString().split('T')[0] : '-'
      }));

      const fields = [
        { label: 'No', value: 'no' },
        { label: 'Company Name', value: 'companyName' },
        { label: 'Job Title', value: 'jobTitle' },
        { label: 'Location', value: 'location' },
        { label: 'Job Type', value: 'jobType' },
        { label: 'Application Date', value: 'applicationDate' },
        { label: 'Status', value: 'applicationStatus' },
        { label: 'Source/Link', value: 'sourceLink' },
        { label: 'Contact Person', value: 'contactPerson' },
        { label: 'Follow-up Date', value: 'followUpDate' },
        { label: 'Salary', value: 'salary' },
        { label: 'Notes', value: 'notes' }
      ];

      const json2csvParser = new Parser({ fields });
      const csv = json2csvParser.parse(dataUntukCsv);
      const buffer = Buffer.from(csv, 'utf-8');
      
      bot.sendDocument(chatId, buffer, { 
        caption: `✅ Berhasil export ${apps.length} data lamaran!` 
      }, { filename: 'rekap_trackly.csv', contentType: 'text/csv' });

    } catch (e) {
      console.error("Export Error:", e);
      bot.sendMessage(chatId, "Gagal export CSV.");
    }
  }
  else if (data === "back_to_main") {
    delete userState[chatId];
    sendMainMenu(chatId);
  }
});

// --- PERINTAH /BACK ---
bot.onText(/\/back/, (msg) => {
  const chatId = msg.chat.id;
  const state = userState[chatId];

  if (!state) {
    sendMainMenu(chatId);
    return;
  }

  if (state.step > 1) {
    state.step -= 1;
    bot.sendMessage(chatId, `⬅️ Balik ke Step ${state.step}. Silakan isi ulang.`);
  } else {
    delete userState[chatId];
    sendMainMenu(chatId);
  }
});

bot.onText(/\/start/, (msg) => sendMainMenu(msg.chat.id));

// --- LOGIC PESAN MASUK (ADD & UPDATE) ---
bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;
  const state = userState[chatId];

  if (!text || text.startsWith('/')) return;
  if (!state) return;

  // --- LOGIC UPDATE VALUE ---
  if (state.menu === 'UPDATE_VAL') {
    try {
      let value: any = text;
      if (state.editField === "applicationDate" || state.editField === "followUpDate") {
        value = new Date(text);
        if (isNaN(value.getTime())) return bot.sendMessage(chatId, "❌ Format tanggal salah! Gunakan MM/DD/YYYY");
      }

      await prisma.jobApplication.update({
        where: { id: Number(state.editAppId) },
        data: { [state.editField!]: value }
      });

      bot.sendMessage(chatId, `✅ *${state.editField}* berhasil di-update jadi: _${text}_`, { parse_mode: "Markdown" });
      delete userState[chatId];
      sendMainMenu(chatId);
    } catch (e) {
      bot.sendMessage(chatId, "❌ Gagal update ke database.");
    }
    return;
  }

  // --- LOGIC ADD APP ---
  if (state.menu === 'ADD') {
    switch (state.step) {
      case 1: 
        state.data.company = text; 
        state.step = 2; 
        bot.sendMessage(chatId, "💻 *2. Job Title?*\nContoh: `Frontend Developer` atau `Data Analyst`", { parse_mode: 'Markdown' }); 
        break;
      case 2: 
        state.data.role = text; 
        state.step = 3; 
        bot.sendMessage(chatId, "📍 *3. Location?*\nContoh: `Jakarta`, `Remote`, atau `Singapore`", { parse_mode: 'Markdown' }); 
        break;
      case 3:
        state.data.location = text;
        state.step = 4;
        bot.sendMessage(chatId, "💼 *4. Job Type?*\n\n*Opsi:*\n- Full-time\n- Contract\n- Freelance\n- Internship", {
          parse_mode: 'Markdown',
          reply_markup: {
            keyboard: [[{text: "Full-time"}, {text: "Contract"}], [{text: "Freelance"}, {text: "Internship"}]],
            one_time_keyboard: true, resize_keyboard: true
          }
        });
        break;
      case 4:
        state.data.jobType = text;
        state.step = 5;
        bot.sendMessage(chatId, "📅 *5. Application Date?*\nFormat: `MM/DD/YYYY`\nContoh: `04/28/2026` (Bulan/Tanggal/Tahun)", { parse_mode: 'Markdown' });
        break;
      case 5:
        const dateApp = new Date(text);
        if (isNaN(dateApp.getTime())) {
          return bot.sendMessage(chatId, "❌ Format tanggal salah! Gunakan `Bulan/Tanggal/Tahun`.\nContoh: `04/28/2026`", { parse_mode: 'Markdown' });
        }
        state.data.date = dateApp;
        state.step = 6;
        bot.sendMessage(chatId, "🚦 *6. Status?*\n\n*Opsi:*\n- Applied\n- Interview\n- Offering Letter\n- Rejected", {
          parse_mode: 'Markdown',
          reply_markup: {
            keyboard: [[{text: "Applied"}, {text: "Interview"}], [{text: "Offering Letter"}, {text: "Rejected"}]],
            one_time_keyboard: true, resize_keyboard: true
          }
        });
        break;
      case 6:
        state.data.status = text;
        state.step = 7;
        bot.sendMessage(chatId, "🔗 *7. Source Link?*\nContoh: `https://linkedin.com/...` atau ketik `-` jika tidak ada.", { parse_mode: 'Markdown' });
        break;
      case 7:
        state.data.link = text;
        state.step = 8;
        bot.sendMessage(chatId, "👤 *8. Contact Person / HR?*\nKetik `-` jika tidak tahu.", { parse_mode: 'Markdown' }); 
        break;
      case 8:
        state.data.cp = text;
        state.step = 9;
        bot.sendMessage(chatId, "⏰ *9. Follow-up Date?*\nFormat: `MM/DD/YYYY`\nContoh: `05/05/2026`", { parse_mode: 'Markdown' });
        break;
      case 9:
        const dateFollow = new Date(text);
        if (isNaN(dateFollow.getTime())) {
          return bot.sendMessage(chatId, "❌ Format tanggal salah! Gunakan `MM/DD/YYYY`.", { parse_mode: 'Markdown' });
        }
        state.data.followUp = dateFollow;
        state.step = 10;
        bot.sendMessage(chatId, "💰 *10. Salary Estimate?*\nContoh: `10jt - 15jt` atau `Negotiable` ", { parse_mode: 'Markdown' });
        break;
      case 10:
        state.data.salary = text;
        state.step = 11;
        bot.sendMessage(chatId, "📝 *11. Notes?*\nContoh: `Benefit asuransi lengkap.` atau ketik `-` jika tidak ada.", { parse_mode: 'Markdown' });
        break;
      case 11:
        try {
          const user = await prisma.user.findFirst({ where: { telegramId: chatId.toString() } });
          if (!user) return bot.sendMessage(chatId, "❌ ID belum terhubung!");

          await prisma.jobApplication.create({
            data: {
              companyName: state.data.company,
              jobTitle: state.data.role,
              location: state.data.location,
              jobType: state.data.jobType,
              applicationStatus: state.data.status,
              applicationDate: state.data.date,
              sourceLink: state.data.link,
              contactPerson: state.data.cp,
              followUpDate: state.data.followUp,
              salary: String(state.data.salary),
              notes: text === '-' ? "" : text,
              userId: user.id
            }
          });

          bot.sendMessage(chatId, "✅ *DATA DISIMPAN!*", { parse_mode: 'Markdown' });
          delete userState[chatId];
          sendMainMenu(chatId);
        } catch (e) {
          bot.sendMessage(chatId, "❌ Gagal simpan ke database!");
        }
        break;
    }
  }
});
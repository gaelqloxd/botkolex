require("dotenv").config();
const { io } = require("socket.io-client");
const { Client, GatewayIntentBits, EmbedBuilder } = require("discord.js");

// 🔑 CONFIG
const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
const CHANNEL_ID = process.env.CHANNEL_ID; // packs
const MARKET_CHANNEL_ID = process.env.MARKET_CHANNEL_ID; // market

// 🤖 Discord
const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

client.on("clientReady", async () => {
  console.log(`🤖 Bot listo: ${client.user.tag}`);
});

client.login(DISCORD_TOKEN).catch(console.error);

// 🌐 Socket
const socket = io("https://sockets.kolex.gg", {
  transports: ["websocket"]
});

socket.on("connect", () => {
  console.log("✅ Conectado a Kolex:", socket.id);
  socket.emit("join-public-feed");
});


// =======================
// 🎁 PACK OPENED
// =======================
socket.on("pack-opened", async (data) => {
  try {
    const buenas = data.cards.filter(card => {
      const title = (card.title || "").toLowerCase();

      return (
        (title.includes("legendary") ||
         title.includes("mythic") ||
         title.includes("hero")) &&
        card.mintNumber <= 200
      );
    });

    if (buenas.length === 0) return;

    const channel = await client.channels.fetch(CHANNEL_ID);

    for (const card of buenas) {
      let image = null;

      if (card.images) {
        const values = Object.values(card.images);
        image = values.find(v => typeof v === "string" && v.includes(".png"));
      }

      if (!image && card.cardTemplate?.images?.size402) {
        image = card.cardTemplate.images.size402;
      }

      if (!image && card.cardTemplateId) {
        image = `https://cdn2.kolex.gg/card-template/render/${card.cardTemplateId}/402x670.png`;
      }

      if (!image) continue;

      const embed = new EmbedBuilder()
        .setTitle("🔥 Carta detectada (Pack)")
        .setDescription(`👤 ${data.user.username}`)
        .addFields(
          { name: "🃏 Carta", value: card.title || "Desconocida" },
          { name: "#️⃣ Mint", value: `#${card.mintNumber}`, inline: true }
        )
        .setColor(0x00ff99)
        .setImage(image);

      await channel.send({ embeds: [embed] });
    }

  } catch (err) {
    console.error("Error pack:", err);
  }
});


// =======================
// 🛒 MARKET LIST
// =======================
socket.on("market-list", async (data) => {
  try {
    const card = data.entity;
    if (!card) return;

    const title = card.itemName || "Carta desconocida";
    const mint = card.mintNumber || "??";
    const price = data.market?.price || "?";


   
    // 🖼️ IMAGEN
   
   let image = null;

// 🥇 CASO 1: imagen directa (TU CASO)
if (typeof card.images === "string") {
  image = card.images;
}

// 🥈 CASO 2: objeto de imágenes
else if (card.images && typeof card.images === "object") {
  const values = Object.values(card.images);
  image = values.find(v => typeof v === "string" && v.includes(".png"));
}

// 🥉 fallback template
if (!image && card.templateId) {
  image = `https://cdn2.kolex.gg/card-template/render/${card.templateId}/402x670.png`;
}



    if (
      !(title.toLowerCase().includes("mythic") ||
        title.toLowerCase().includes("hero")) ||
      mint > 200
    ) return;

    const channel = await client.channels.fetch(process.env.MARKET_LIST_CHANNEL_ID);

    const embed = new EmbedBuilder()
      .setTitle("🛒 Carta listada")
      .setDescription(`👤 ${data.user?.username || "Desconocido"}`)
      .addFields(
        { name: "🃏 Carta", value: title },
        { name: "#️⃣ Mint", value: `#${mint}`, inline: true },
        { name: "💰 Precio", value: `${price}`, inline: true }
      )
      .setColor(0xff9900);

    if (image) embed.setImage(image); // 🔥 AQUÍ

    await channel.send({ embeds: [embed] });

  } catch (err) {
    console.error("Error market-list:", err);
  }
});


// =======================
// 💸 MARKET SOLD (SOLO HERO)
// =======================
socket.on("market-sold", async (data) => {
  try {
    const card = data.entity;
    if (!card) return;

    const title = card.itemName || "Carta desconocida";
    const mint = card.mintNumber || "??";
    const price = data.market?.price || "?";

    
    // 🖼️ IMAGEN
   
   let image = null;

// 🥇 CASO 1: imagen directa (TU CASO)
if (typeof card.images === "string") {
  image = card.images;
}

// 🥈 CASO 2: objeto de imágenes
else if (card.images && typeof card.images === "object") {
  const values = Object.values(card.images);
  image = values.find(v => typeof v === "string" && v.includes(".png"));
}

// 🥉 fallback template
if (!image && card.templateId) {
  image = `https://cdn2.kolex.gg/card-template/render/${card.templateId}/402x670.png`;
}

    // 🔥 SOLO HERO
    if (
    !(title.toLowerCase().includes("mythic") ||
        title.toLowerCase().includes("hero")) ||
      mint > 200
    ) return;

    const channel = await client.channels.fetch(process.env.MARKET_SOLD_CHANNEL_ID);

    const embed = new EmbedBuilder()
      .setTitle("💸 CARTA VENDIDA")
      .setDescription(`👤 ${data.user?.username || "Desconocido"}`)
      .addFields(
        { name: "🃏 Carta", value: title },
        { name: "#️⃣ Mint", value: `#${mint}`, inline: true },
        { name: "💰 Precio", value: `${price}`, inline: true }
      )
      .setColor(0xff0000);

    if (image) embed.setImage(image); // 🔥 AQUÍ

    await channel.send({ embeds: [embed] });

  } catch (err) {
    console.error("Error market-sold:", err);
  }
});

// =======================
// 🔍 DEBUG GLOBAL
// =======================
// socket.onAny((event) => {
//   console.log("📡 EVENTO:", event);
// });
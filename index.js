require("dotenv").config();
const { io } = require("socket.io-client");
const { Client, GatewayIntentBits, EmbedBuilder } = require("discord.js");

// 🔑 CONFIG
const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
const CHANNEL_ID = process.env.CHANNEL_ID;

// 🤖 Discord
const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

client.on("clientReady", async () => {
  console.log(`🤖 Bot listo: ${client.user.tag}`);

  try {
    const channel = await client.channels.fetch(CHANNEL_ID);
    await channel.send("🟢 Bot encendido");
  } catch (err) {
    console.error("Error:", err);
  }
});

client.login(DISCORD_TOKEN).catch(console.error);

// 🌐 Socket Kolex (PUBLIC FEED)
const socket = io("https://sockets.kolex.gg", {
  transports: ["websocket"]
});

socket.on("connect", () => {
  console.log("✅ Conectado a Kolex:", socket.id);

  // 🔥 PUBLIC FEED
  socket.emit("join-public-feed");
});

// 🔍 DEBUG (opcional, déjalo si quieres ver eventos)
// socket.onAny((event) => {
//   console.log("📡 EVENTO:", event);
// });

// 🎁 EVENTO PRINCIPAL
socket.on("pack-opened", async (data) => {
  try {
    console.log("📦 Pack recibido");

    const buenas = data.cards.filter(card => card.mintNumber <= 200);
    if (buenas.length === 0) return;

    const channel = await client.channels.fetch(CHANNEL_ID);

    for (const card of buenas) {
      let image = null;

      // 🟢 1. CS y otros
      if (card.images) {
        const values = Object.values(card.images);
        image = values.find(v => typeof v === "string" && v.includes(".png"));
      }

      // 🔥 2. Kings League
      if (!image && card.cardTemplate?.images?.size402) {
        image = card.cardTemplate.images.size402;
      }

      // 🛠️ 3. fallback
      if (!image && card.cardTemplateId) {
        image = `https://cdn2.kolex.gg/card-template/render/${card.cardTemplateId}/402x670.png`;
      }

      if (!image) {
        console.log("❌ SIN IMAGEN FINAL", card.title);
        continue;
      }

      const embed = new EmbedBuilder()
        .setTitle("🔥 Carta detectada")
        .setDescription(`👤 ${data.user.username}`)
        .addFields(
          { name: "🃏 Carta", value: card.title },
          { name: "#️⃣ Mint", value: `#${card.mintNumber}`, inline: true }
        )
        .setColor(0x00ff99)
        .setImage(image);

      await channel.send({ embeds: [embed] });
    }

  } catch (err) {
    console.error("Error en pack-opened:", err);
  }
});
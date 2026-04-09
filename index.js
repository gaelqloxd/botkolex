require("dotenv").config();
const { Client, GatewayIntentBits, EmbedBuilder } = require("discord.js");

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

const TOKEN = process.env.DISCORD_TOKEN;
const CHANNEL_ID = process.env.CHANNEL_ID;

client.once("ready", () => {
  console.log(`✅ Bot listo como ${client.user.tag}`);
});

// 🔥 ejemplo de evento (ajusta a tu socket real)
async function enviarCarta(data, buenas) {
  const channel = await client.channels.fetch(CHANNEL_ID);

  for (const card of buenas) {

    let image = null;

    // CS u otros
    if (card.images) {
      const values = Object.values(card.images);
      image = values.find(v => typeof v === "string" && v.includes(".png"));
    }

    // Kings League
    if (!image && card.cardTemplate?.images?.size402) {
      image = card.cardTemplate.images.size402;
    }

    // fallback
    if (!image && card.cardTemplateId) {
      image = `https://cdn2.kolex.gg/card-template/render/${card.cardTemplateId}/402x670.png`;
    }

    if (!image) continue;

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
}

client.login(TOKEN);
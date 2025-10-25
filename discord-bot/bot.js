import 'dotenv/config';
import { Client, GatewayIntentBits } from 'discord.js';
import fetch from 'node-fetch';

// Environment variables
const BOT_TOKEN = process.env.BOT_TOKEN;
const API_BASE  = process.env.API_BASE || 'https://puce-beta.vercel.app'; // your Vercel domain

if (!BOT_TOKEN) throw new Error('Missing BOT_TOKEN in .env');

// Discord client setup
const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent]
});

client.once('ready', () => console.log(`✅ Logged in as ${client.user.tag}`));

client.on('messageCreate', async (msg) => {
  if (msg.author.bot) return;
  if (!msg.content.startsWith('!track ')) return;

  const url = msg.content.split(' ')[1];
  if (!url) return msg.reply('Usage: `!track <url>`');

  try {
    const res = await fetch(`${API_BASE}/create`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({ url, owner: msg.author.id })
    });
    const data = await res.json();

    if (data.short) {
      msg.reply(`🔗 Short link created: ${data.short}\n(Share only with consenting users.)`);
    } else {
      msg.reply('⚠️ Could not create link.');
    }
  } catch (err) {
    console.error(err);
    msg.reply('❌ Error connecting to tracker.');
  }
});

client.login(BOT_TOKEN);

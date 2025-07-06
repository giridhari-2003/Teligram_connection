const fetch = require("node-fetch");

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const AIRTABLE_TABLE_NAME = process.env.AIRTABLE_TABLE_NAME;

const AIRTABLE_URL = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_NAME}`;
const HEADERS = { Authorization: `Bearer ${AIRTABLE_API_KEY}` };

// ❗ TEMP: In-memory tracking (won't persist between runs on Netlify)
let seenIds = [];

exports.handler = async function () {
  try {
    const res = await fetch(AIRTABLE_URL, { headers: HEADERS });
    const data = await res.json();
    const records = data.records || [];

    const newRecords = records.filter(r => !seenIds.includes(r.id));

    for (const record of newRecords.reverse()) {
      const fields = record.fields;
      await sendTelegramMessage(`🆕 New Row: ${JSON.stringify(fields)}`);
      seenIds.push(record.id);
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ message: `Checked ${records.length} records` }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    };
  }
};

async function sendTelegramMessage(text) {
  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
  await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: TELEGRAM_CHAT_ID, text }),
  });
}

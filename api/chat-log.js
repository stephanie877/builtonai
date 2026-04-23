// Vercel Serverless Function — Save chat transcript to Airtable

const AIRTABLE_TOKEN = process.env.AIRTABLE_TOKEN;
const AIRTABLE_BASE  = process.env.AIRTABLE_BASE  || 'appeHJfMPE2sIj87I';
const AIRTABLE_TABLE = process.env.AIRTABLE_TABLE || 'tblsa0KMAv0twNYPH';

export default async function handler(req, res) {
  // Allow cross-origin from our own site
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(200).json({ status: 'chat-log endpoint live' });

  const { email, messages, pageUrl } = req.body;
  if (!messages || messages.length < 2) {
    return res.status(200).json({ status: 'skipped — too short' });
  }

  // Format transcript
  const transcript = messages
    .map(m => `[${m.role === 'user' ? 'Visitor' : 'AI'}]: ${m.content}`)
    .join('\n\n');

  const dateFormatted = new Date().toLocaleDateString('en-US');

  try {
    const airtableRes = await fetch(
      `https://api.airtable.com/v0/${AIRTABLE_BASE}/${AIRTABLE_TABLE}`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${AIRTABLE_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fields: {
            'Email':      email || '(not provided)',
            'Stage':      '🟡 Lead',
            'Source':     'Chat Widget',
            'Date Added': dateFormatted,
            'Notes':      `Chat transcript from ${pageUrl || 'builtonai.co'}:\n\n${transcript}`,
          }
        })
      }
    );

    const data = await airtableRes.json();
    if (data.id) {
      return res.status(200).json({ success: true, recordId: data.id });
    } else {
      console.error('Airtable error:', data);
      return res.status(500).json({ success: false });
    }
  } catch (err) {
    console.error('chat-log error:', err.message);
    return res.status(500).json({ error: err.message });
  }
}

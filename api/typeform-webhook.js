// Vercel Serverless Function
// Receives Typeform webhook → creates Airtable CRM record
// Secrets stored as Vercel Environment Variables (not in code)

const AIRTABLE_TOKEN = process.env.AIRTABLE_TOKEN;
const AIRTABLE_BASE  = process.env.AIRTABLE_BASE  || 'appeHJfMPE2sIj87I';
const AIRTABLE_TABLE = process.env.AIRTABLE_TABLE || 'tblsa0KMAv0twNYPH';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(200).json({ status: 'Webhook endpoint live' });
  }

  try {
    const payload = req.body;
    const answers = payload.form_response?.answers || [];

    const getAnswer = (index) => {
      const a = answers[index];
      if (!a) return '';
      if (a.type === 'text' || a.type === 'long_text') return a.text || '';
      if (a.type === 'email') return a.email || '';
      if (a.type === 'choice') return a.choice?.label || '';
      if (a.type === 'choices') return a.choices?.labels?.join(', ') || '';
      if (a.type === 'boolean') return a.boolean ? 'Yes' : 'No';
      return '';
    };

    const businessInfo = getAnswer(0);
    const timeDrain    = getAnswer(1);
    const commonQs     = getAnswer(2);
    const currentFlow  = getAnswer(3);
    const tools        = getAnswer(4);
    const leadSources  = getAnswer(5);
    const wishList     = getAnswer(6);
    const hasDocs      = getAnswer(7);
    const brandVoice   = getAnswer(8);
    const extraNotes   = getAnswer(9);

    const submittedAt   = payload.form_response?.submitted_at || new Date().toISOString();
    const responseId    = payload.form_response?.token || '';
    const dateFormatted = new Date(submittedAt).toLocaleDateString('en-US');

    const notes = [
      businessInfo && `Business: ${businessInfo}`,
      timeDrain    && `Time drain: ${timeDrain}`,
      commonQs     && `Common Qs: ${commonQs}`,
      currentFlow  && `Lead flow: ${currentFlow}`,
      tools        && `Tools: ${tools}`,
      leadSources  && `Lead sources: ${leadSources}`,
      wishList     && `Wish list: ${wishList}`,
      hasDocs      && `Has docs: ${hasDocs}`,
      brandVoice   && `Brand voice: ${brandVoice}`,
      extraNotes   && `Extra: ${extraNotes}`,
    ].filter(Boolean).join('\n\n');

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
            'Stage':                '🟠 Applied',
            'Source':               'Typeform',
            'Date Added':           dateFormatted,
            'Typeform Response ID': responseId,
            'Notes':                notes,
          }
        })
      }
    );

    const airtableData = await airtableRes.json();

    if (airtableData.id) {
      return res.status(200).json({ success: true, recordId: airtableData.id });
    } else {
      return res.status(500).json({ success: false, error: airtableData });
    }

  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

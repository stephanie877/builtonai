(function () {
  'use strict';

  const API_URL  = window.BUILTONAI_CHAT_URL || '';
  const ACCENT   = '#6c47ff';
  let visitorEmail = null;
  let emailAsked   = false;
  let history      = [];
  let isOpen       = false;
  let logSent      = false;

  // ─── Styles ────────────────────────────────────────────────────
  const style = document.createElement('style');
  style.textContent = `
    #boa-chat-btn {
      position:fixed;bottom:28px;right:28px;z-index:9999;
      width:58px;height:58px;border-radius:50%;
      background:${ACCENT};border:none;cursor:pointer;
      box-shadow:0 4px 20px rgba(108,71,255,.5);
      display:flex;align-items:center;justify-content:center;
      transition:transform .2s,box-shadow .2s;
    }
    #boa-chat-btn:hover{transform:scale(1.08);box-shadow:0 6px 28px rgba(108,71,255,.7);}
    #boa-notif{
      position:absolute;top:-4px;right:-4px;
      width:16px;height:16px;border-radius:50%;
      background:#fb923c;border:2px solid #0a0a0a;
      font-size:10px;color:white;font-weight:700;
      display:none;align-items:center;justify-content:center;
    }
    #boa-chat-window{
      position:fixed;bottom:100px;right:28px;z-index:9998;
      width:360px;max-width:calc(100vw - 40px);
      background:#0d0d1f;border:1px solid rgba(108,71,255,.35);
      border-radius:16px;overflow:hidden;
      box-shadow:0 20px 60px rgba(0,0,0,.6);
      display:none;flex-direction:column;
      font-family:-apple-system,BlinkMacSystemFont,'Inter',sans-serif;
    }
    #boa-chat-window.open{display:flex;}
    #boa-chat-header{
      background:${ACCENT};padding:16px 18px;
      display:flex;align-items:center;gap:12px;
    }
    #boa-chat-header .avatar{
      width:36px;height:36px;border-radius:50%;
      background:rgba(255,255,255,.2);
      display:flex;align-items:center;justify-content:center;font-size:18px;
    }
    #boa-chat-header .name{font-size:.92rem;font-weight:700;color:white;}
    #boa-chat-header .status{font-size:.75rem;color:rgba(255,255,255,.7);}
    #boa-chat-close{
      margin-left:auto;background:none;border:none;cursor:pointer;
      color:rgba(255,255,255,.8);font-size:20px;line-height:1;padding:4px;
    }
    #boa-chat-messages{
      flex:1;overflow-y:auto;padding:16px;max-height:320px;
      display:flex;flex-direction:column;gap:10px;
    }
    #boa-chat-messages::-webkit-scrollbar{width:4px;}
    #boa-chat-messages::-webkit-scrollbar-thumb{background:rgba(108,71,255,.3);border-radius:2px;}
    .boa-msg{
      max-width:84%;padding:10px 13px;border-radius:12px;
      font-size:.88rem;line-height:1.55;word-wrap:break-word;
    }
    .boa-msg.bot{background:#1a1a35;color:rgba(255,255,255,.9);border-radius:12px 12px 12px 3px;align-self:flex-start;}
    .boa-msg.user{background:${ACCENT};color:white;border-radius:12px 12px 3px 12px;align-self:flex-end;}
    .boa-msg a{color:#a78bfa;text-decoration:underline;}
    .boa-typing{display:flex;gap:4px;padding:10px 13px;background:#1a1a35;border-radius:12px 12px 12px 3px;align-self:flex-start;width:fit-content;}
    .boa-typing span{width:6px;height:6px;border-radius:50%;background:rgba(255,255,255,.4);animation:boaTyping 1.2s infinite;}
    .boa-typing span:nth-child(2){animation-delay:.2s;}
    .boa-typing span:nth-child(3){animation-delay:.4s;}
    @keyframes boaTyping{0%,60%,100%{transform:translateY(0);opacity:.4;}30%{transform:translateY(-5px);opacity:1;}}
    #boa-email-row{
      padding:12px 14px;border-top:1px solid rgba(255,255,255,.07);
      background:#0d0d1f;display:flex;gap:8px;
    }
    #boa-email-input{
      flex:1;background:#1a1a35;border:1px solid rgba(108,71,255,.3);
      border-radius:8px;padding:9px 12px;color:white;
      font-size:.85rem;outline:none;font-family:inherit;
    }
    #boa-email-input::placeholder{color:rgba(255,255,255,.3);}
    #boa-email-input:focus{border-color:rgba(108,71,255,.7);}
    #boa-email-submit{
      background:${ACCENT};border:none;border-radius:8px;
      padding:0 14px;cursor:pointer;color:white;font-size:.82rem;font-weight:600;
      white-space:nowrap;transition:background .2s;
    }
    #boa-email-submit:hover{background:#8b6bff;}
    #boa-email-skip{
      background:none;border:none;color:rgba(255,255,255,.3);
      font-size:.75rem;cursor:pointer;padding:0 4px;text-decoration:underline;
    }
    #boa-chat-input-row{
      display:flex;gap:8px;padding:12px 14px;
      border-top:1px solid rgba(255,255,255,.07);background:#0d0d1f;
    }
    #boa-chat-input{
      flex:1;background:#1a1a35;border:1px solid rgba(108,71,255,.25);
      border-radius:8px;padding:9px 12px;color:white;
      font-size:.88rem;outline:none;resize:none;max-height:80px;font-family:inherit;
    }
    #boa-chat-input::placeholder{color:rgba(255,255,255,.3);}
    #boa-chat-input:focus{border-color:rgba(108,71,255,.6);}
    #boa-chat-send{
      background:${ACCENT};border:none;border-radius:8px;
      width:38px;flex-shrink:0;cursor:pointer;
      display:flex;align-items:center;justify-content:center;transition:background .2s;
    }
    #boa-chat-send:hover{background:#8b6bff;}
  `;
  document.head.appendChild(style);

  // ─── HTML ───────────────────────────────────────────────────────
  const wrapper = document.createElement('div');
  wrapper.innerHTML = `
    <button id="boa-chat-btn" aria-label="Chat with us">
      <span id="boa-notif">1</span>
      <svg fill="white" width="26" height="26" viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z"/></svg>
    </button>
    <div id="boa-chat-window" role="dialog" aria-label="Built On AI Chat">
      <div id="boa-chat-header">
        <div class="avatar">⚡</div>
        <div><div class="name">Built On AI</div><div class="status">Ask me anything</div></div>
        <button id="boa-chat-close" aria-label="Close">×</button>
      </div>
      <div id="boa-chat-messages"></div>
      <div id="boa-email-row" style="display:none;">
        <input id="boa-email-input" type="email" placeholder="Your email (so we can follow up)" />
        <button id="boa-email-submit">Save</button>
        <button id="boa-email-skip">Skip</button>
      </div>
      <div id="boa-chat-input-row">
        <textarea id="boa-chat-input" placeholder="Ask a question..." rows="1"></textarea>
        <button id="boa-chat-send" aria-label="Send">
          <svg fill="white" width="16" height="16" viewBox="0 0 24 24"><path d="M2 21l21-9L2 3v7l15 2-15 2v7z"/></svg>
        </button>
      </div>
    </div>
  `;
  document.body.appendChild(wrapper);

  const btn        = document.getElementById('boa-chat-btn');
  const win        = document.getElementById('boa-chat-window');
  const closeBtn   = document.getElementById('boa-chat-close');
  const input      = document.getElementById('boa-chat-input');
  const sendBtn    = document.getElementById('boa-chat-send');
  const msgs       = document.getElementById('boa-chat-messages');
  const notif      = document.getElementById('boa-notif');
  const emailRow   = document.getElementById('boa-email-row');
  const emailInput = document.getElementById('boa-email-input');
  const emailSave  = document.getElementById('boa-email-submit');
  const emailSkip  = document.getElementById('boa-email-skip');

  // ─── Helpers ────────────────────────────────────────────────────
  function addMsg(text, role) {
    const el = document.createElement('div');
    el.className = 'boa-msg ' + role;
    el.innerHTML = text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1" target="_blank">$1</a>')
      .replace(/\n/g, '<br>');
    msgs.appendChild(el);
    msgs.scrollTop = msgs.scrollHeight;
    return el;
  }

  function showTyping() {
    const el = document.createElement('div');
    el.className = 'boa-typing';
    el.innerHTML = '<span></span><span></span><span></span>';
    msgs.appendChild(el);
    msgs.scrollTop = msgs.scrollHeight;
    return el;
  }

  function showEmailCapture() {
    if (emailAsked || visitorEmail) return;
    emailAsked = true;
    emailRow.style.display = 'flex';
    setTimeout(() => emailInput.focus(), 100);
  }

  function saveEmail(email) {
    visitorEmail = email || null;
    emailRow.style.display = 'none';
  }

  async function logTranscript() {
    if (logSent || history.length < 2) return;
    logSent = true;
    try {
      await fetch(API_URL + '/api/chat-log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: visitorEmail,
          messages: history,
          pageUrl: window.location.href,
        }),
      });
    } catch (e) { /* silent fail */ }
  }

  // ─── Send message ────────────────────────────────────────────────
  async function sendMessage(text) {
    if (!text.trim()) return;
    addMsg(text, 'user');
    history.push({ role: 'user', content: text });
    input.value = '';
    input.style.height = 'auto';

    const typing = showTyping();
    try {
      const res  = await fetch(API_URL + '/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: history }),
      });
      const data = await res.json();
      typing.remove();
      const reply = data.content || "I'm having trouble right now. Email hello@builtonai.co — Stephanie will get back to you shortly.";
      addMsg(reply, 'bot');
      history.push({ role: 'assistant', content: reply });

      // Show email capture after 2nd exchange
      if (history.filter(m => m.role === 'user').length >= 2) {
        showEmailCapture();
      }
    } catch {
      typing.remove();
      addMsg("Connection issue. Email hello@builtonai.co and we'll get back to you within a few hours.", 'bot');
    }
  }

  // ─── Open / Close ────────────────────────────────────────────────
  function openChat() {
    isOpen = true;
    win.classList.add('open');
    notif.style.display = 'none';
    if (history.length === 0) {
      setTimeout(() => {
        const greeting = "Hey! 👋 I'm the Built On AI assistant. Are you looking to automate your lead follow-up, or do you have questions about how the service works?";
        addMsg(greeting, 'bot');
        history.push({ role: 'assistant', content: greeting });
      }, 300);
    }
    setTimeout(() => input.focus(), 400);
  }

  function closeChat() {
    isOpen = false;
    win.classList.remove('open');
    logTranscript();
  }

  // ─── Event listeners ────────────────────────────────────────────
  btn.addEventListener('click', () => isOpen ? closeChat() : openChat());
  closeBtn.addEventListener('click', closeChat);

  sendBtn.addEventListener('click', () => sendMessage(input.value));
  input.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(input.value); }
  });
  input.addEventListener('input', () => {
    input.style.height = 'auto';
    input.style.height = Math.min(input.scrollHeight, 80) + 'px';
  });

  emailSave.addEventListener('click', () => {
    saveEmail(emailInput.value.trim());
    addMsg("Got it — we'll follow up at " + (visitorEmail || 'your email') + " if needed. What else can I help with?", 'bot');
    history.push({ role: 'assistant', content: 'Email captured: ' + visitorEmail });
  });
  emailSkip.addEventListener('click', () => saveEmail(null));
  emailInput.addEventListener('keydown', e => { if (e.key === 'Enter') emailSave.click(); });

  // Log on page unload (catches tab closes)
  window.addEventListener('beforeunload', logTranscript);
  window.addEventListener('pagehide', logTranscript);

  // Notification bubble after 10 seconds if not opened
  setTimeout(() => { if (!isOpen) { notif.style.display = 'flex'; } }, 10000);
})();

(function () {
  'use strict';

  const API_URL = window.BUILTONAI_CHAT_URL || '';
  const ACCENT = '#6c47ff';

  // Styles
  const style = document.createElement('style');
  style.textContent = `
    #boa-chat-btn {
      position: fixed; bottom: 28px; right: 28px; z-index: 9999;
      width: 58px; height: 58px; border-radius: 50%;
      background: ${ACCENT}; border: none; cursor: pointer;
      box-shadow: 0 4px 20px rgba(108,71,255,0.5);
      display: flex; align-items: center; justify-content: center;
      transition: transform 0.2s, box-shadow 0.2s;
    }
    #boa-chat-btn:hover { transform: scale(1.08); box-shadow: 0 6px 28px rgba(108,71,255,0.7); }
    #boa-chat-btn svg { width: 26px; height: 26px; }

    #boa-chat-window {
      position: fixed; bottom: 100px; right: 28px; z-index: 9998;
      width: 360px; max-width: calc(100vw - 40px);
      background: #0d0d1f; border: 1px solid rgba(108,71,255,0.35);
      border-radius: 16px; overflow: hidden;
      box-shadow: 0 20px 60px rgba(0,0,0,0.6);
      display: none; flex-direction: column;
      font-family: -apple-system, BlinkMacSystemFont, 'Inter', sans-serif;
    }
    #boa-chat-window.open { display: flex; }

    #boa-chat-header {
      background: ${ACCENT}; padding: 16px 18px;
      display: flex; align-items: center; gap: 12px;
    }
    #boa-chat-header .avatar {
      width: 36px; height: 36px; border-radius: 50%;
      background: rgba(255,255,255,0.2);
      display: flex; align-items: center; justify-content: center;
      font-size: 18px;
    }
    #boa-chat-header .info .name { font-size: 0.92rem; font-weight: 700; color: white; }
    #boa-chat-header .info .status { font-size: 0.75rem; color: rgba(255,255,255,0.7); }
    #boa-chat-close {
      margin-left: auto; background: none; border: none; cursor: pointer;
      color: rgba(255,255,255,0.8); font-size: 20px; line-height: 1; padding: 4px;
    }

    #boa-chat-messages {
      flex: 1; overflow-y: auto; padding: 16px; max-height: 340px;
      display: flex; flex-direction: column; gap: 10px;
    }
    #boa-chat-messages::-webkit-scrollbar { width: 4px; }
    #boa-chat-messages::-webkit-scrollbar-track { background: transparent; }
    #boa-chat-messages::-webkit-scrollbar-thumb { background: rgba(108,71,255,0.3); border-radius: 2px; }

    .boa-msg {
      max-width: 82%; padding: 10px 13px; border-radius: 12px;
      font-size: 0.88rem; line-height: 1.55; word-wrap: break-word;
    }
    .boa-msg.bot {
      background: #1a1a35; color: rgba(255,255,255,0.9);
      border-radius: 12px 12px 12px 3px; align-self: flex-start;
    }
    .boa-msg.user {
      background: ${ACCENT}; color: white;
      border-radius: 12px 12px 3px 12px; align-self: flex-end;
    }
    .boa-msg a { color: #a78bfa; text-decoration: underline; }

    .boa-typing {
      display: flex; gap: 4px; padding: 10px 13px;
      background: #1a1a35; border-radius: 12px 12px 12px 3px;
      align-self: flex-start; width: fit-content;
    }
    .boa-typing span {
      width: 6px; height: 6px; border-radius: 50%;
      background: rgba(255,255,255,0.4);
      animation: boaTyping 1.2s infinite;
    }
    .boa-typing span:nth-child(2) { animation-delay: 0.2s; }
    .boa-typing span:nth-child(3) { animation-delay: 0.4s; }
    @keyframes boaTyping {
      0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
      30% { transform: translateY(-5px); opacity: 1; }
    }

    #boa-chat-input-row {
      display: flex; gap: 8px; padding: 12px 14px;
      border-top: 1px solid rgba(255,255,255,0.07);
      background: #0d0d1f;
    }
    #boa-chat-input {
      flex: 1; background: #1a1a35; border: 1px solid rgba(108,71,255,0.25);
      border-radius: 8px; padding: 9px 12px; color: white;
      font-size: 0.88rem; outline: none; resize: none; max-height: 80px;
      font-family: inherit;
    }
    #boa-chat-input::placeholder { color: rgba(255,255,255,0.3); }
    #boa-chat-input:focus { border-color: rgba(108,71,255,0.6); }
    #boa-chat-send {
      background: ${ACCENT}; border: none; border-radius: 8px;
      width: 38px; flex-shrink: 0; cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      transition: background 0.2s;
    }
    #boa-chat-send:hover { background: #8b6bff; }
    #boa-chat-send svg { width: 16px; height: 16px; }

    #boa-notif {
      position: absolute; top: -4px; right: -4px;
      width: 16px; height: 16px; border-radius: 50%;
      background: #fb923c; border: 2px solid #0a0a0a;
      font-size: 10px; color: white; font-weight: 700;
      display: flex; align-items: center; justify-content: center;
    }
  `;
  document.head.appendChild(style);

  // HTML
  const wrapper = document.createElement('div');
  wrapper.innerHTML = `
    <button id="boa-chat-btn" aria-label="Chat with us">
      <span id="boa-notif">1</span>
      <svg fill="white" viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z"/></svg>
    </button>
    <div id="boa-chat-window" role="dialog" aria-label="Built On AI Chat">
      <div id="boa-chat-header">
        <div class="avatar">⚡</div>
        <div class="info">
          <div class="name">Built On AI</div>
          <div class="status">Ask me anything</div>
        </div>
        <button id="boa-chat-close" aria-label="Close chat">×</button>
      </div>
      <div id="boa-chat-messages"></div>
      <div id="boa-chat-input-row">
        <textarea id="boa-chat-input" placeholder="Ask a question..." rows="1"></textarea>
        <button id="boa-chat-send" aria-label="Send">
          <svg fill="white" viewBox="0 0 24 24"><path d="M2 21l21-9L2 3v7l15 2-15 2v7z"/></svg>
        </button>
      </div>
    </div>
  `;
  document.body.appendChild(wrapper);

  const btn = document.getElementById('boa-chat-btn');
  const win = document.getElementById('boa-chat-window');
  const closeBtn = document.getElementById('boa-chat-close');
  const input = document.getElementById('boa-chat-input');
  const sendBtn = document.getElementById('boa-chat-send');
  const msgs = document.getElementById('boa-chat-messages');
  const notif = document.getElementById('boa-notif');

  let history = [];
  let isOpen = false;

  function addMsg(text, role) {
    const el = document.createElement('div');
    el.className = 'boa-msg ' + role;
    // Convert URLs to links
    el.innerHTML = text.replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank">$1</a>');
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

  async function sendMessage(text) {
    if (!text.trim()) return;
    addMsg(text, 'user');
    history.push({ role: 'user', content: text });
    input.value = '';
    input.style.height = 'auto';

    const typing = showTyping();

    try {
      const res = await fetch(API_URL + '/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: history }),
      });
      const data = await res.json();
      typing.remove();
      const reply = data.content || "I'm having trouble connecting right now. Email hello@builtonai.co and we'll get back to you shortly.";
      addMsg(reply, 'bot');
      history.push({ role: 'assistant', content: reply });
    } catch {
      typing.remove();
      addMsg("I'm having trouble connecting. Email hello@builtonai.co and Stephanie will get back to you within a few hours.", 'bot');
    }
  }

  function openChat() {
    isOpen = true;
    win.classList.add('open');
    notif.style.display = 'none';
    if (history.length === 0) {
      setTimeout(() => {
        addMsg("Hey! 👋 I'm the Built On AI assistant. What brings you here today — are you looking to automate your lead follow-up, or do you have questions about how the service works?", 'bot');
        history.push({ role: 'assistant', content: "Hey! 👋 I'm the Built On AI assistant. What brings you here today — are you looking to automate your lead follow-up, or do you have questions about how the service works?" });
      }, 300);
    }
    setTimeout(() => input.focus(), 400);
  }

  function closeChat() {
    isOpen = false;
    win.classList.remove('open');
  }

  btn.addEventListener('click', () => isOpen ? closeChat() : openChat());
  closeBtn.addEventListener('click', closeChat);

  sendBtn.addEventListener('click', () => sendMessage(input.value));
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input.value);
    }
  });
  input.addEventListener('input', () => {
    input.style.height = 'auto';
    input.style.height = Math.min(input.scrollHeight, 80) + 'px';
  });

  // Show notification bubble after 8 seconds if not opened
  setTimeout(() => {
    if (!isOpen) notif.style.display = 'flex';
  }, 8000);
})();

// salty.js — Salty the Surfer chatbot
// Photo-based character (bb.png), chat persists across pages via sessionStorage

(function () {
  'use strict';

  // ── Session storage helpers ───────────────────────────────────
  var SESSION_KEY = 'salty-session';

  function loadSession() {
    try {
      var raw = sessionStorage.getItem(SESSION_KEY);
      return raw ? JSON.parse(raw) : { history: [], messages: [], greeted: false };
    } catch(e) { return { history: [], messages: [], greeted: false }; }
  }

  function saveSession(data) {
    try { sessionStorage.setItem(SESSION_KEY, JSON.stringify(data)); } catch(e) {}
  }

  var session = loadSession();

  // ── Inject HTML ──────────────────────────────────────────────
  var wrap = document.createElement('div');
  wrap.id = 'salty-wrap';
  wrap.innerHTML = `
    <div id="salty-chat">
      <div id="salty-chat-header">
        <div id="salty-chat-header-left">
          <div class="salty-header-dot"></div>
          <div>
            <div id="salty-chat-title">Salty 🤙</div>
            <div id="salty-chat-sub">St. Simons Island Guide</div>
          </div>
        </div>
        <button id="salty-close" title="Close">✕</button>
      </div>
      <div id="salty-messages"></div>
      <div id="salty-input-wrap">
        <input id="salty-input" type="text" placeholder="Ask Salty anything..." maxlength="200" />
        <button id="salty-send" title="Send">
          <svg viewBox="0 0 24 24"><path d="M2 21l21-9L2 3v7l15 2-15 2v7z"/></svg>
        </button>
      </div>
    </div>

    <div id="salty-char" title="Chat with Salty!">
      <img src="bb.png" alt="Salty" id="salty-photo" />
    </div>
    <div id="salty-name">Salty 🤙</div>
  `;
  document.body.appendChild(wrap);

  // ── State ────────────────────────────────────────────────────
  var isOpen    = false;
  var isWaiting = false;

  var chat     = document.getElementById('salty-chat');
  var messages = document.getElementById('salty-messages');
  var input    = document.getElementById('salty-input');
  var sendBtn  = document.getElementById('salty-send');
  var closeBtn = document.getElementById('salty-close');
  var charEl   = document.getElementById('salty-char');

  // ── Restore prior messages from session ───────────────────────
  function restoreMessages() {
    session.messages.forEach(function (m) {
      renderBubble(m.role, m.text);
    });
    if (session.messages.length) {
      messages.scrollTop = messages.scrollHeight;
    }
  }

  // ── Render a bubble (no session write) ───────────────────────
  function renderBubble(role, text) {
    var row = document.createElement('div');
    row.className = 'salty-msg ' + (role === 'user' ? 'user' : 'salty');
    var bubble = document.createElement('div');
    bubble.className = 'salty-bubble';
    bubble.textContent = text;
    row.appendChild(bubble);
    messages.appendChild(row);
    return row;
  }

  // ── Add message + persist ─────────────────────────────────────
  function addMessage(role, text) {
    renderBubble(role, text);
    messages.scrollTop = messages.scrollHeight;
    session.messages.push({ role: role, text: text });
    if (session.messages.length > 30) session.messages = session.messages.slice(-30);
    saveSession(session);
  }

  // ── Open / close ─────────────────────────────────────────────
  function openChat() {
    isOpen = true;
    chat.classList.add('open');
    charEl.classList.add('excited');
    setTimeout(function () { charEl.classList.remove('excited'); }, 600);
    input.focus();

    if (!session.greeted) {
      session.greeted = true;
      saveSession(session);

      setTimeout(function () {
        addMessage('salty', "Whoa... you look really familiar. 🤔");
      }, 400);
      setTimeout(function () {
        addMessage('salty', "And you're here before check-in time — nice. Brian must've driven the whole way down in the left lane. I'm guessing there's at least one speeding ticket somewhere in that story. 😄");
      }, 2200);
      setTimeout(function () {
        addMessage('salty', "Anyway — ask me anything about St. Simons. Restaurants, beaches, golf, history, whatever you need.");
      }, 4200);
    }
  }

  function closeChat() {
    isOpen = false;
    chat.classList.remove('open');
  }

  charEl.addEventListener('click', function () {
    if (isOpen) { closeChat(); } else { openChat(); }
  });
  closeBtn.addEventListener('click', closeChat);

  // ── Restore messages, then auto-open on first visit ──────────
  restoreMessages();

  if (!session.greeted) {
    setTimeout(function () {
      if (!isOpen) { openChat(); }
    }, 2500);
  }

  // ── Typing indicator ──────────────────────────────────────────
  function showTyping() {
    var row = document.createElement('div');
    row.className = 'salty-msg salty-typing';
    row.innerHTML = '<div class="salty-bubble"><div class="salty-dots"><span></span><span></span><span></span></div></div>';
    messages.appendChild(row);
    messages.scrollTop = messages.scrollHeight;
    return row;
  }

  // ── Send message ──────────────────────────────────────────────
  function send() {
    var text = input.value.trim();
    if (!text || isWaiting) return;

    input.value = '';
    isWaiting = true;
    addMessage('user', text);

    var historySnapshot = session.history.slice();
    var typing = showTyping();

    fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: text, history: historySnapshot })
    })
    .then(function (res) { return res.json(); })
    .then(function (data) {
      typing.remove();
      var reply = data.reply || "Gnarly — I lost my train of thought. Try again!";
      addMessage('salty', reply);
      session.history.push({ role: 'user',  text: text });
      session.history.push({ role: 'model', text: reply });
      if (session.history.length > 20) session.history = session.history.slice(-20);
      saveSession(session);
    })
    .catch(function () {
      typing.remove();
      addMessage('salty', "Whoa, the wave wiped me out 🌊 — can't reach the server right now. Try again in a sec!");
    })
    .finally(function () {
      isWaiting = false;
    });
  }

  sendBtn.addEventListener('click', send);
  input.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') { send(); }
  });

})();

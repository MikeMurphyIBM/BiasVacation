// salty.js — Salty the Surfer chatbot
// Injects the character + chat UI into every page, calls /api/chat

(function () {
  'use strict';

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

    <!-- Salty the Surfer Dude — pure SVG/CSS character -->
    <div id="salty-char" title="Chat with Salty!">
      <svg viewBox="0 0 72 72" xmlns="http://www.w3.org/2000/svg" width="72" height="72">
        <!-- Surfboard (behind body) -->
        <ellipse cx="36" cy="62" rx="22" ry="6" fill="#e8a020" opacity="0.9"/>
        <ellipse cx="36" cy="62" rx="20" ry="4.5" fill="#f5c842"/>
        <line x1="36" y1="56" x2="36" y2="68" stroke="#e8a020" stroke-width="1.2"/>

        <!-- Body / boardshorts -->
        <rect x="27" y="40" width="18" height="14" rx="4" fill="#1a9be8"/>
        <!-- Shorts pattern -->
        <path d="M27 44 Q36 46 45 44" stroke="#0f7abf" stroke-width="1" fill="none"/>
        <path d="M27 48 Q36 50 45 48" stroke="#0f7abf" stroke-width="1" fill="none"/>

        <!-- Legs -->
        <rect x="28" y="52" width="7" height="10" rx="3" fill="#d4956a"/>
        <rect x="37" y="52" width="7" height="10" rx="3" fill="#d4956a"/>

        <!-- Torso / skin -->
        <rect x="28" y="30" width="16" height="14" rx="4" fill="#d4956a"/>

        <!-- Left arm (waving) -->
        <g id="salty-hand">
          <rect x="14" y="28" width="6" height="14" rx="3" fill="#d4956a"
                transform="rotate(-20 17 28)"/>
          <!-- Hand -->
          <circle cx="12" cy="38" r="4" fill="#d4956a"/>
          <!-- Shaka fingers -->
          <line x1="9" y1="36" x2="7" y2="33" stroke="#c4855a" stroke-width="1.5" stroke-linecap="round"/>
          <line x1="15" y1="41" x2="17" y2="44" stroke="#c4855a" stroke-width="1.5" stroke-linecap="round"/>
        </g>

        <!-- Right arm -->
        <rect x="52" y="30" width="6" height="12" rx="3" fill="#d4956a"
              transform="rotate(15 55 30)"/>

        <!-- Head -->
        <circle cx="36" cy="22" r="12" fill="#d4956a"/>

        <!-- Sun-bleached surfer hair -->
        <path d="M24 18 Q28 10 36 11 Q44 10 48 18 Q46 14 36 15 Q26 14 24 18Z"
              fill="#c8a040"/>
        <!-- Hair tufts -->
        <path d="M24 17 Q22 12 26 11" stroke="#c8a040" stroke-width="2.5"
              fill="none" stroke-linecap="round"/>
        <path d="M48 17 Q50 12 46 11" stroke="#c8a040" stroke-width="2.5"
              fill="none" stroke-linecap="round"/>

        <!-- Sunglasses -->
        <rect x="26" y="21" width="8" height="5" rx="2.5" fill="#1a4d6e" opacity="0.9"/>
        <rect x="38" y="21" width="8" height="5" rx="2.5" fill="#1a4d6e" opacity="0.9"/>
        <line x1="34" y1="23" x2="38" y2="23" stroke="#0a2d42" stroke-width="1.2"/>
        <line x1="26" y1="23" x2="23" y2="22" stroke="#0a2d42" stroke-width="1.2"/>
        <line x1="46" y1="23" x2="49" y2="22" stroke="#0a2d42" stroke-width="1.2"/>

        <!-- Big smile -->
        <path d="M30 30 Q36 35 42 30" stroke="#a06040" stroke-width="1.5"
              fill="none" stroke-linecap="round"/>

        <!-- Nose -->
        <ellipse cx="36" cy="28" rx="1.5" ry="1" fill="#c4855a"/>

        <!-- Zinc sunscreen on nose -->
        <rect x="33" y="26.5" width="6" height="2.5" rx="1.2" fill="white" opacity="0.7"/>
      </svg>
    </div>
    <div id="salty-name">Salty 🤙</div>
  `;
  document.body.appendChild(wrap);

  // ── State ────────────────────────────────────────────────────
  var isOpen    = false;
  var isWaiting = false;
  var greeted   = false;

  var chat     = document.getElementById('salty-chat');
  var messages = document.getElementById('salty-messages');
  var input    = document.getElementById('salty-input');
  var sendBtn  = document.getElementById('salty-send');
  var closeBtn = document.getElementById('salty-close');
  var charEl   = document.getElementById('salty-char');

  // ── Open / close ─────────────────────────────────────────────
  function openChat() {
    isOpen = true;
    chat.classList.add('open');
    charEl.classList.add('excited');
    setTimeout(function () { charEl.classList.remove('excited'); }, 600);
    input.focus();

    // One-time greeting on first open
    if (!greeted) {
      greeted = true;
      setTimeout(function () {
        addMessage('salty', "Hey Bias family! 🤙 Salty here — I'll be freeloading at the house all week, but the least I can do is be your personal island guide. Ask me ANYTHING about St. Simons — restaurants, beaches, golf, history, you name it.");
      }, 400);
      setTimeout(function () {
        addMessage('salty', "Oh, and Brian — did you manage to make it down without any speeding tickets this time? 😂");
      }, 2200);
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

  // Auto-open after 2.5s on first page load
  setTimeout(function () {
    if (!isOpen) { openChat(); }
  }, 2500);

  // ── Add message bubble ────────────────────────────────────────
  function addMessage(role, text) {
    var row = document.createElement('div');
    row.className = 'salty-msg ' + (role === 'user' ? 'user' : 'salty');

    var bubble = document.createElement('div');
    bubble.className = 'salty-bubble';
    bubble.textContent = text;

    row.appendChild(bubble);
    messages.appendChild(row);
    messages.scrollTop = messages.scrollHeight;
    return row;
  }

  // Typing indicator
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

    var typing = showTyping();

    fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: text })
    })
    .then(function (res) { return res.json(); })
    .then(function (data) {
      typing.remove();
      addMessage('salty', data.reply || "Gnarly — I lost my train of thought. Try again!");
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

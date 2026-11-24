(() => {
  "use strict";
  const script = document.currentScript;
  const apiBase = (script?.dataset.apiBase || "").replace(/\/$/, "");
  const suggestions = [
    "What does the evidence say about housing delivery?",
    "Who is responsible for Ireland's housing policy?",
    "How are Government commitments being tracked?",
    "Explain the current climate and energy assessment."
  ];
  const root = document.createElement("div");
  root.className = "ipm-ai";
  root.innerHTML = \`
    <button class="ipm-ai-launch" type="button" aria-expanded="false" aria-controls="ipm-ai-panel">
      <span aria-hidden="true">✦</span><span>Ask Irish Policy Monitor</span>
    </button>
    <section class="ipm-ai-panel" id="ipm-ai-panel" aria-label="Irish Policy Monitor AI assistant" hidden>
      <header class="ipm-ai-header">
        <div class="ipm-ai-brand"><span class="ipm-ai-mark">IPM</span><span><strong>Irish Policy Monitor AI</strong><small>Evidence-led civic intelligence</small></span></div>
        <button class="ipm-ai-close" type="button" aria-label="Close assistant">×</button>
      </header>
      <div class="ipm-ai-messages" aria-live="polite">
        <article class="ipm-ai-message ipm-ai-assistant"><strong>Welcome.</strong><p>Ask about Irish policy, public spending, government commitments or who is responsible. I’ll use the evidence available to Irish Policy Monitor and show the sources I relied on.</p><small>Research snapshot: 24 November 2026 · Check source dates for updates.</small></article>
      </div>
      <div class="ipm-ai-suggestions"><span>Try asking</span>\${suggestions.map(q => \`<button type="button" class="ipm-ai-suggestion">\${escapeHtml(q)}</button>\`).join("")}</div>
      <form class="ipm-ai-form">
        <label class="ipm-ai-sr" for="ipm-ai-question">Ask a policy question</label>
        <textarea id="ipm-ai-question" rows="2" maxlength="1200" placeholder="Ask a question about Irish public policy…" required></textarea>
        <div class="ipm-ai-form-bottom"><small>AI-generated research assistance. Verify important claims against original sources.</small><button type="submit" aria-label="Send question">Send ↑</button></div>
      </form>
    </section>\`;
  document.body.appendChild(root);
  const panel = root.querySelector(".ipm-ai-panel");
  const launch = root.querySelector(".ipm-ai-launch");
  const close = root.querySelector(".ipm-ai-close");
  const form = root.querySelector(".ipm-ai-form");
  const input = root.querySelector("textarea");
  const messages = root.querySelector(".ipm-ai-messages");
  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  }
  function open(value) {
    panel.hidden = !value;
    launch.setAttribute("aria-expanded", String(value));
    if (value) input.focus();
  }
  function addMessage(kind, content, sources = []) {
    const article = document.createElement("article");
    article.className = "ipm-ai-message " + (kind === "user" ? "ipm-ai-user" : "ipm-ai-assistant");
    const body = document.createElement("div");
    body.textContent = content;
    article.appendChild(body);
    if (sources.length) {
      const list = document.createElement("div");
      list.className = "ipm-ai-sources";
      const heading = document.createElement("strong");
      heading.textContent = "Sources";
      list.appendChild(heading);
      sources.forEach((source, index) => {
        if (!source.url || !/^https:\/\//i.test(source.url)) return;
        const a = document.createElement("a");
        a.href = source.url; a.target = "_blank"; a.rel = "noopener noreferrer";
        a.textContent = "[" + (index + 1) + "] " + (source.title || "Original source");
        list.appendChild(a);
      });
      article.appendChild(list);
    }
    messages.appendChild(article);
    messages.scrollTop = messages.scrollHeight;
    return article;
  }
  launch.addEventListener("click", () => open(panel.hidden));
  close.addEventListener("click", () => { open(false); launch.focus(); });
  panel.addEventListener("keydown", event => { if (event.key === "Escape") open(false); });
  root.querySelectorAll(".ipm-ai-suggestion").forEach(button => button.addEventListener("click", () => {
    input.value = button.textContent; form.requestSubmit();
  }));
  form.addEventListener("submit", async event => {
    event.preventDefault();
    const question = input.value.trim();
    if (!question) return;
    addMessage("user", question);
    input.value = "";
    const pending = addMessage("assistant", "Searching the Irish Policy Monitor evidence…");
    const submit = form.querySelector('button[type="submit"]');
    submit.disabled = true;
    try {
      if (!apiBase || apiBase.includes("YOUR-CLOUDFLARE-WORKER")) {
        throw new Error("The assistant interface is installed, but its secure AI service has not been connected yet. The site owner needs to deploy the companion Worker and set its URL in the script tag.");
      }
      const response = await fetch(apiBase + "/api/chat", {
        method: "POST", headers: {"Content-Type":"application/json"},
        body: JSON.stringify({question})
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || "The AI service could not complete the request.");
      pending.textContent = payload.answer || "I couldn't produce an answer from the available evidence.";
      if (payload.sources?.length) {
        const list = document.createElement("div"); list.className = "ipm-ai-sources";
        const heading = document.createElement("strong"); heading.textContent = "Evidence used"; list.appendChild(heading);
        payload.sources.forEach((source, index) => {
          const a = document.createElement("a"); a.href = source.url; a.target = "_blank"; a.rel = "noopener noreferrer";
          a.textContent = "[" + (index + 1) + "] " + (source.title || "Original source"); list.appendChild(a);
        });
        pending.appendChild(list);
      }
    } catch (error) {
      pending.textContent = error.message || "Something went wrong. Please try again.";
      pending.classList.add("ipm-ai-error");
    } finally {
      submit.disabled = false; messages.scrollTop = messages.scrollHeight; input.focus();
    }
  });
})();
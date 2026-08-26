/* ===========================================================================
   Portfolio, konsolidacja i operacje — renderer
   Zero zależności. Wszystkie treści pochodzą z data/portfolio.json; ten plik
   nie zawiera ani jednego zdania o żadnym repozytorium.
   =========================================================================== */
(function () {
  "use strict";

  /* ------------------------------------------------------------- narzędzia */
  const $ = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));

  const esc = (s) =>
    String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");

  // Prose may reference the glossary as {{term:id}} and emphasise with *word*.
  const prose = (s) =>
    esc(s)
      .replace(/\{\{term:([a-z0-9-]+)\|([^}]+)\}\}/g,
        (_, id, label) => `<a class="term" href="#t-${id}" data-term="${id}">${label}</a>`)
      .replace(/\{\{term:([a-z0-9-]+)\}\}/g,
        (_, id) => {
          const g = (DATA.glossary || []).find((x) => x.id === id);
          return `<a class="term" href="#t-${id}" data-term="${id}">${esc(g ? g.term : id)}</a>`;
        })
      .replace(/\*\*([^*]+)\*\*/g, "<b>$1</b>")
      .replace(/`([^`]+)`/g, "<code>$1</code>");

  const html = (strings, ...vals) => strings.reduce((a, s, i) => a + s + (vals[i] == null ? "" : vals[i]), "");
  const list = (arr, cls) => (arr || []).map((x) => `<li${cls ? ` class="${cls}"` : ""}>${prose(x)}</li>`).join("");
  const plural = (n, one, few, many) => (n === 1 ? one : n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 12 || n % 100 > 14) ? few : many);

  let DATA = null;
  const clusterOf = (id) => (DATA.clusters || []).find((c) => c.id === id) || { id, name: id, letter: "?" };
  const repoOf = (slug) => (DATA.repos || []).find((r) => r.slug === slug);

  /* ------------------------------------------------------------------ zakładki */
  function initTabs() {
    const buttons = $$(".tabrow button");
    const show = (name, push) => {
      buttons.forEach((b) => b.setAttribute("aria-selected", String(b.dataset.tab === name)));
      $$(".panel").forEach((p) => { p.hidden = p.id !== `panel-${name}`; });
      const sub = $(`#subnav-${name}`);
      $$(".subnav").forEach((s) => { s.hidden = true; });
      if (sub) sub.hidden = false;
      if (push) history.replaceState(null, "", `#${name}`);
      window.scrollTo({ top: 0, behavior: "instant" in window ? "instant" : "auto" });
      trackSections();
    };
    buttons.forEach((b) => b.addEventListener("click", () => show(b.dataset.tab, true)));
    const initial = (location.hash || "").replace(/^#/, "").split("/")[0];
    show(buttons.some((b) => b.dataset.tab === initial) ? initial : "portfolio", false);
    return show;
  }

  /* -------------------------------------------------------------------- motyw */
  function initTheme() {
    const btn = $("#theme");
    const apply = (t) => {
      if (t === "auto") document.documentElement.removeAttribute("data-theme");
      else document.documentElement.setAttribute("data-theme", t);
      btn.textContent = t === "auto" ? "motyw: auto" : t === "dark" ? "motyw: ciemny" : "motyw: jasny";
      btn.setAttribute("aria-label", `Motyw: ${t}. Kliknij, żeby zmienić.`);
    };
    let cur = "auto";
    try { cur = localStorage.getItem("kc-theme") || "auto"; } catch (e) { /* prywatne okno */ }
    apply(cur);
    btn.addEventListener("click", () => {
      cur = cur === "auto" ? "light" : cur === "light" ? "dark" : "auto";
      apply(cur);
      try { localStorage.setItem("kc-theme", cur); } catch (e) { /* zignoruj */ }
    });
  }

  /* ------------------------------------------------------------------ szuflada */
  const drawer = {
    node: null, scrim: null, lastFocus: null,
    init() {
      this.node = $("#drawer"); this.scrim = $("#scrim");
      $("#drawer-close").addEventListener("click", () => this.close());
      this.scrim.addEventListener("click", () => this.close());
      document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && !this.node.hidden) this.close();
      });
    },
    open(kicker, bodyHtml) {
      $("#drawer-kicker").textContent = kicker;
      $("#drawer-body").innerHTML = bodyHtml;
      this.lastFocus = document.activeElement;
      this.node.hidden = false; this.scrim.hidden = false;
      requestAnimationFrame(() => { this.node.classList.add("show"); this.scrim.classList.add("show"); });
      this.node.scrollTop = 0;
      $("#drawer-close").focus();
      document.body.classList.add("no-scroll");
    },
    close() {
      this.node.classList.remove("show"); this.scrim.classList.remove("show");
      document.body.classList.remove("no-scroll");
      setTimeout(() => { this.node.hidden = true; this.scrim.hidden = true; }, 230);
      if (this.lastFocus && this.lastFocus.focus) this.lastFocus.focus();
    },
  };

  function openTerm(id) {
    const g = (DATA.glossary || []).find((x) => x.id === id);
    if (!g) return;
    drawer.open("Słownik", html`
      <h3>${esc(g.term)}</h3>
      ${g.tag ? `<div class="dbadges"><span class="gtag">${esc(g.tag)}</span></div>` : ""}
      ${(g.body || []).map((p) => `<p>${prose(p)}</p>`).join("")}
      ${g.where ? `<h4>Gdzie w portfolio</h4><p>${prose(g.where)}</p>` : ""}
      ${(g.slugs || []).length ? `<h4>Repozytoria</h4><div class="dlinks">${(g.slugs || []).map(repoChip).join("")}</div>` : ""}
    `);
  }

  const repoChip = (slug) => {
    const r = repoOf(slug);
    return r ? `<a href="#" data-repo="${esc(slug)}">${esc(r.name)}</a>` : `<a href="#" data-repo="${esc(slug)}">${esc(slug)}</a>`;
  };

  function openRepo(slug) {
    const r = repoOf(slug);
    if (!r) return;
    const c = clusterOf(r.cluster);
    const tier = (DATA.ops.tiers || []).find((t) => t.id === r.tier);
    const gh = r.github || {};
    const dep = r.deployment || {};

    const liveLinks = (r.links.live || []).map((l) =>
      `<a href="${esc(l.url)}" target="_blank" rel="noopener">${esc(l.label)}</a>`).join("");
    const docLinks = (r.links.docs || []).map((d) =>
      r.visibility === "private"
        ? `<a class="dead" title="Repozytorium jest prywatne — link zadziała dopiero po otwarciu">${esc(d.label)}</a>`
        : `<a href="${esc(r.links.repo)}/blob/main/${esc(d.path)}" target="_blank" rel="noopener">${esc(d.label)}</a>`
    ).join("");

    drawer.open(`${c.name} · poziom ${esc(r.tier)}`, html`
      <h3>${esc(r.name)}</h3>
      <p class="dsub">${esc(r.slug)}</p>
      <div class="dbadges">
        <span class="badge ${r.visibility === "public" ? "badge-pub" : "badge-priv"}">${r.visibility === "public" ? "publiczne" : "prywatne"}</span>
        <span class="badge badge-mut">${esc(r.state)}</span>
        <span class="badge badge-mut">${esc(r.license)}</span>
        ${tier ? `<span class="badge badge-mut">${esc(tier.name)}</span>` : ""}
      </div>

      <p>${prose(r.summary)}</p>

      <h4>Linki</h4>
      <div class="dlinks">
        <a href="${esc(r.links.repo)}" target="_blank" rel="noopener">GitHub</a>
        ${liveLinks}${docLinks}
      </div>

      ${(r.metrics || []).length ? `<h4>Liczby, które udało się zweryfikować</h4><table class="dtable">${
        (r.metrics || []).map((m) => `<tr><td>${esc(m.label)}</td><td>${esc(m.value)}</td></tr>`).join("")
      }</table>` : ""}

      <h4>Stan repozytorium</h4>
      <table class="dtable">
        <tr><td>Stack</td><td>${esc((r.stack || []).join(" · ")) || "—"}</td></tr>
        <tr><td>Język główny</td><td>${esc(r.primaryLanguage)}</td></tr>
        <tr><td>Commity</td><td>${esc(gh.commits ?? "—")}</td></tr>
        <tr><td>Pliki w repo</td><td>${esc(gh.files ?? "—")}</td></tr>
        <tr><td>Ostatni commit</td><td>${esc(gh.lastCommit ?? "—")}</td></tr>
        <tr><td>Gwiazdki</td><td>${esc(gh.stars ?? "—")}</td></tr>
        <tr><td>Otwarte PR-y</td><td>${esc(gh.openPrs ?? 0)}${gh.dependabotPrs ? ` (w tym ${gh.dependabotPrs} od dependabota)` : ""}</td></tr>
        <tr><td>Otwarte zgłoszenia + PR-y</td><td>${esc(gh.openIssues ?? "—")}</td></tr>
        <tr><td>Testy</td><td>${esc(r.tests || "—")}</td></tr>
        <tr><td>CI</td><td>${esc(r.ci || "—")}</td></tr>
        <tr><td>Wdrożenie</td><td>${[
          dep.fly ? "Fly.io" : null, dep.docker ? "Docker" : null, dep.ghcr ? "GHCR" : null,
          dep.pages ? "GitHub Pages" : null, dep.packages ? "NuGet" : null,
        ].filter(Boolean).join(" · ") || "brak"}</td></tr>
      </table>

      ${(r.components || []).length ? `<h4>Komponenty</h4>${
        (r.components || []).map((k) => html`
          <div class="dcomp ${k.reusable ? "reusable" : ""}">
            <b>${esc(k.name)}</b>${k.reusable ? ' <span class="badge badge-accent">do wydzielenia</span>' : ""}
            <span class="path">${esc(k.path)}</span>
            <span class="d">${prose(k.description)}</span>
          </div>`).join("")
      }` : ""}

      ${(r.highlights || []).length ? `<h4>Co tu jest mocne</h4><ul>${list(r.highlights, "good")}</ul>` : ""}
      ${(r.gaps || []).length ? `<h4>Luki</h4><ul>${list(r.gaps)}</ul>` : ""}
      ${(r.risks || []).length ? `<h4>Ryzyka</h4><ul>${list(r.risks, "bad")}</ul>` : ""}
      ${(r.next || []).length ? `<h4>Następne kroki</h4><ul>${list(r.next)}</ul>` : ""}

      <h4>Pozycja produktowa</h4>
      <p>${prose(r.product)}</p>

      ${(r.overlaps || []).length ? `<h4>Pokrywa się z</h4><ul>${
        (r.overlaps || []).map((o) => {
          const other = repoOf(o.slug);
          return `<li><a href="#" data-repo="${esc(o.slug)}">${esc(other ? other.name : o.slug)}</a> — ${prose(o.reason)}</li>`;
        }).join("")
      }</ul>` : ""}
    `);
  }

  /* ============================== ZAKŁADKA 1 — PORTFOLIO ================== */

  function repoCard(r) {
    const c = clusterOf(r.cluster);
    const reusable = (r.components || []).filter((k) => k.reusable);
    return html`
      <button class="card" data-repo="${esc(r.slug)}" data-cluster="${esc(r.cluster)}"
              data-vis="${esc(r.visibility)}" data-tier="${esc(r.tier)}"
              data-search="${esc([r.slug, r.name, r.oneLiner, (r.stack || []).join(" "), r.primaryLanguage].join(" ").toLowerCase())}">
        <div class="hdr">
          <div>
            <h3>${esc(r.name)}</h3>
            <p class="slug">${esc(r.slug)}</p>
          </div>
          <span class="badge ${r.visibility === "public" ? "badge-pub" : "badge-priv"}">${r.visibility === "public" ? "publiczne" : "prywatne"}</span>
        </div>
        <p class="one">${prose(r.oneLiner)}</p>
        ${reusable.length ? `<ul>${reusable.slice(0, 3).map((k) => `<li class="star">${esc(k.name)}</li>`).join("")}</ul>` : ""}
        <div class="chips">
          ${(r.stack || []).slice(0, 3).map((s) => `<span class="chip-s">${esc(s)}</span>`).join("")}
        </div>
        ${r.headline ? `<p class="flag ${esc(r.headlineTone || "warn")}">${prose(r.headline)}</p>` : ""}
        <p class="meta">${esc(r.state)} · ${esc(r.license)}${(r.metrics || [])[0] ? ` · ${esc(r.metrics[0].label)}: ${esc(r.metrics[0].value)}` : ""}</p>
      </button>`;
  }

  function renderPortfolio() {
    const repos = DATA.repos || [];
    const pub = repos.filter((r) => r.visibility === "public").length;
    const deployed = repos.filter((r) => r.deployment && (r.deployment.fly || r.deployment.pages)).length;
    const prs = repos.reduce((a, r) => a + ((r.github && r.github.openPrs) || 0), 0);
    const bots = repos.reduce((a, r) => a + ((r.github && r.github.dependabotPrs) || 0), 0);

    $("#stats").innerHTML = html`
      <div class="stat"><div class="v">${repos.length}</div><div class="l">repozytoriów na mapie</div></div>
      <div class="stat good"><div class="v">${pub}</div><div class="l">publicznych · ${repos.length - pub} prywatnych</div></div>
      <div class="stat"><div class="v">${(DATA.clusters || []).length}</div><div class="l">${plural((DATA.clusters || []).length, "substrat", "substraty", "substratów")}</div></div>
      <div class="stat"><div class="v">${(DATA.kernels || []).length}</div><div class="l">${plural((DATA.kernels || []).length, "kernel", "kernele", "kerneli")} do wydzielenia</div></div>
      <div class="stat"><div class="v">${deployed}</div><div class="l">z żywym wdrożeniem</div></div>
      <div class="stat ${prs > 40 ? "alert" : prs > 15 ? "warn" : ""}"><div class="v">${prs}</div><div class="l">otwartych PR-ów · ${bots} od bota</div></div>`;

    const byCluster = (DATA.clusters || []).map((c) => {
      const inC = repos.filter((r) => r.cluster === c.id);
      if (!inC.length) return "";
      const barrier = c.barrier
        ? `<div class="barrier"><span class="bx">⟂ nie łączyć</span><p class="bt">${prose(c.barrier)}</p></div>`
        : "";
      return html`
        <div class="substrate" data-c="${esc(c.letter)}">
          <p class="sub-title">${esc(c.name)}</p>
          <p class="sub-note">${prose(c.note)}</p>
          <div class="grid g-auto">${inC.map(repoCard).join("")}</div>
        </div>${barrier}`;
    }).join("");
    $("#clusters").innerHTML = byCluster;
  }

  function initPortfolioFilters() {
    const chips = $$("#pf-filters .chip");
    const search = $("#pf-search");
    const apply = () => {
      const active = chips.filter((c) => c.getAttribute("aria-pressed") === "true").map((c) => c.dataset.f);
      const q = (search.value || "").trim().toLowerCase();
      let shown = 0;
      $$("#clusters .card").forEach((card) => {
        const okFilter = !active.length || active.every((f) => {
          if (f.startsWith("c:")) return card.dataset.cluster === f.slice(2);
          if (f.startsWith("v:")) return card.dataset.vis === f.slice(2);
          if (f === "kernel") return card.querySelector("li.star") !== null;
          return true;
        });
        const okSearch = !q || card.dataset.search.includes(q);
        const on = okFilter && okSearch;
        card.style.display = on ? "" : "none";
        if (on) shown++;
      });
      $$("#clusters .substrate").forEach((s) => {
        s.style.display = $$(".card", s).some((c) => c.style.display !== "none") ? "" : "none";
      });
      $("#pf-count").textContent = `${shown} z ${(DATA.repos || []).length}`;
    };
    chips.forEach((c) => c.addEventListener("click", () => {
      const on = c.getAttribute("aria-pressed") === "true";
      // Cluster and visibility filters are single-choice within their own family.
      if (c.dataset.f.startsWith("c:") || c.dataset.f.startsWith("v:")) {
        const fam = c.dataset.f.slice(0, 2);
        chips.filter((o) => o.dataset.f.startsWith(fam)).forEach((o) => o.setAttribute("aria-pressed", "false"));
      }
      c.setAttribute("aria-pressed", String(!on));
      apply();
    }));
    search.addEventListener("input", apply);
    apply();
  }

  /* ============================ ZAKŁADKA 2 — KONSOLIDACJA ================= */

  function renderConsolidation() {
    $("#kernels").innerHTML = (DATA.kernels || []).map((k) => html`
      <article class="kernel" tabindex="0" data-feeds="${esc((k.consumers || []).join(" "))}">
        <h3>${esc(k.id)} · ${prose(k.name)}</h3>
        <p class="src">${esc(k.sourceSlug)}/${esc(k.sourcePath)}</p>
        <div class="chips">
          <span class="badge ${k.effort === "zrobione" ? "badge-pub" : k.effort === "godziny" ? "badge-accent" : k.effort === "dni" ? "badge-warn" : "badge-alert"}">${esc(k.effort)}</span>
          <span class="chip-s">${esc(k.licence)}</span>
        </div>
        <ul>${list(k.readiness)}</ul>
        <p class="feeds">→ ${(k.consumers || []).map((s) => { const r = repoOf(s); return esc(r ? r.name : s); }).join(", ")}</p>
        ${k.blocker ? `<p class="blocker">${prose(k.blocker)}</p>` : ""}
      </article>`).join("");

    $("#kernels-rejected").innerHTML = (DATA.kernelsRejected || []).map((k) => html`
      <div class="dup" data-sev="niska">
        <p class="p">${prose(k.name)}</p>
        <p class="r">${prose(k.reason)}</p>
      </div>`).join("");

    $("#duplications").innerHTML = (DATA.duplications || []).map((d) => {
      const a = repoOf(d.sideA.slug), b = repoOf(d.sideB.slug);
      return html`
        <div class="dup" data-sev="${esc(d.severity)}">
          <p class="p">${prose(d.problem)}</p>
          <p class="sides">
            <a href="#" data-repo="${esc(d.sideA.slug)}">${esc(a ? a.name : d.sideA.slug)}</a> — ${prose(d.sideA.what)}
            &nbsp;↔&nbsp;
            <a href="#" data-repo="${esc(d.sideB.slug)}">${esc(b ? b.name : d.sideB.slug)}</a> — ${prose(d.sideB.what)}
          </p>
          <p class="r">${prose(d.resolution)}</p>
        </div>`;
    }).join("");

    $("#boundaries").innerHTML = (DATA.boundaries || []).map((b) => html`
      <div class="barrier">
        <span class="bx">⟂ ${esc(b.title)}</span>
        <p class="bt">${prose(b.reason)}</p>
      </div>`).join("");

    const op = DATA.distribution.openPaid;
    $("#rule-line").innerHTML = prose(op.rule);
    $("#pane-open").innerHTML = html`
      <h3>Otwarte</h3>
      <p class="role">${prose(op.openRole)}</p>
      <ul>${(op.open || []).map((x) => `<li>${prose(x)}</li>`).join("")}</ul>`;
    $("#pane-paid").innerHTML = html`
      <h3>Płatne</h3>
      <p class="role">${prose(op.paidRole)}</p>
      <div class="prod">${(op.paid || []).map((p) => html`
        <div class="p">
          <b>${esc(p.name)}</b>
          <span class="who">${prose(p.buyer)}</span>
          <span class="what">${prose(p.what)}</span>
        </div>`).join("")}</div>`;
    $("#pricing-notes").innerHTML = (DATA.distribution.pricingNotes || [])
      .map((n) => `<div class="barrier"><span class="bx">uwaga</span><p class="bt">${prose(n)}</p></div>`).join("");

    $("#axis").innerHTML = (DATA.distribution.rows || []).map((row) => html`
      <div class="flow">
        <div class="node src"><span class="step">${esc(row.step)}</span>${prose(row.artefact)}</div>
        <div class="node">${prose(row.channel)}</div>
        <div class="node">${prose(row.buyer)}</div>
        <div class="node dst ${row.isProduct ? "" : "none"}">${prose(row.product)}</div>
      </div>`).join("");

    // Hovering a kernel dims every card it does not feed.
    $$("#kernels .kernel").forEach((k) => {
      const feeds = (k.dataset.feeds || "").split(/\s+/).filter(Boolean);
      const light = () => {
        document.body.classList.add("linking");
        $$(".card[data-repo]").forEach((c) => c.classList.toggle("is-lit", feeds.includes(c.dataset.repo)));
      };
      const dim = () => {
        document.body.classList.remove("linking");
        $$(".card[data-repo]").forEach((c) => c.classList.remove("is-lit"));
      };
      k.addEventListener("mouseenter", light); k.addEventListener("mouseleave", dim);
      k.addEventListener("focus", light); k.addEventListener("blur", dim);
    });
  }

  /* ============================== ZAKŁADKA 3 — OPERACJE ================== */

  function renderOps() {
    const o = DATA.ops;

    $("#ops-stats").innerHTML = html`
      <div class="stat"><div class="v">${(DATA.repos || []).length}</div><div class="l">repozytoriów pod opieką jednej osoby</div></div>
      <div class="stat"><div class="v">${(o.tiers || []).length}</div><div class="l">${plural((o.tiers || []).length, "poziom uwagi", "poziomy uwagi", "poziomów uwagi")}</div></div>
      <div class="stat"><div class="v">${(o.cadence || []).length}</div><div class="l">${plural((o.cadence || []).length, "rytuał", "rytuały", "rytuałów")} w cyklu</div></div>
      <div class="stat"><div class="v">${(o.healthChecks || []).length}</div><div class="l">${plural((o.healthChecks || []).length, "kontrola zdrowia", "kontrole zdrowia", "kontroli zdrowia")}</div></div>
      <div class="stat"><div class="v">${(o.automation || []).length}</div><div class="l">${plural((o.automation || []).length, "automat", "automaty", "automatów")}</div></div>
      <div class="stat"><div class="v">${(o.quarterPlan || []).length}</div><div class="l">${plural((o.quarterPlan || []).length, "horyzont", "horyzonty", "horyzontów")}</div></div>`;

    $("#principles").innerHTML = (o.principles || []).map((p, i) => html`
      <article class="principle">
        <span class="num">Z${String(i + 1).padStart(2, "0")}</span>
        <h3>${prose(p.title)}</h3>
        <p>${prose(p.body)}</p>
      </article>`).join("");

    $("#tiers").innerHTML = (o.tiers || []).map((t, i) => html`
      <div class="tier" data-t="${i + 1}">
        <h3>${esc(t.id)} · ${prose(t.name)}
          <span class="chip-s">${(t.slugs || []).length} ${plural((t.slugs || []).length, "repo", "repa", "repozytoriów")}</span>
        </h3>
        <p class="def">${prose(t.definition)}</p>
        <div class="slo">
          <div><b>Poziom obsługi</b>${prose(t.slo)}</div>
          <div><b>Budżet czasu</b>${prose(t.budget)}</div>
        </div>
        <div class="members">${(t.slugs || []).map((s) => {
          const r = repoOf(s);
          return `<button data-repo="${esc(s)}">${esc(r ? r.name : s)}</button>`;
        }).join("")}</div>
      </div>`).join("");

    $("#cadence").innerHTML = (o.cadence || []).map((c) => html`
      <article class="rit">
        <p class="when">${prose(c.when)}</p>
        <p class="what">${prose(c.what)}</p>
        <p class="out"><b>Wynik</b>${prose(c.output)}</p>
        <p class="tb">${prose(c.timebox)}</p>
      </article>`).join("");

    $("#health").innerHTML =
      `<div class="check-head"><span>sygnał</span><span>skąd go bierzesz</span><span>próg</span><span>co robisz po przekroczeniu</span></div>` +
      (o.healthChecks || []).map((h) => html`
        <div class="check">
          <div class="n">${prose(h.name)}</div>
          <div class="s">${prose(h.signal)}</div>
          <div class="t">${prose(h.threshold)}</div>
          <div class="a">${prose(h.action)}</div>
        </div>`).join("");

    $("#wip").innerHTML = `<ol>${(o.wipRules || []).map((w) => `<li>${prose(w)}</li>`).join("")}</ol>`;

    $("#automation").innerHTML = (o.automation || []).map((a) => html`
      <article class="auto">
        <h3>${prose(a.name)}</h3>
        <p>${prose(a.how)}</p>
        <p class="where">${esc(a.where)}</p>
      </article>`).join("");

    $("#plan").innerHTML = (o.quarterPlan || []).map((q) => html`
      <div class="horizon">
        <p class="h">${prose(q.horizon)}</p>
        <p class="goal">${prose(q.goal)}</p>
        <ol>${(q.steps || []).map((s) => `<li>${prose(s)}</li>`).join("")}</ol>
        <p class="done"><b>Gotowe, gdy</b> ${prose(q.doneWhen)}</p>
      </div>`).join("");
  }

  /* =============================== ZAKŁADKA 4 — INDEKS ==================== */

  let sortKey = "name", sortDir = 1;

  function renderIndex() {
    const rows = (DATA.repos || []).slice().sort((a, b) => {
      const get = (r) => {
        switch (sortKey) {
          case "cluster": return clusterOf(r.cluster).name;
          case "tier": return r.tier;
          case "state": return r.state;
          case "vis": return r.visibility;
          case "commits": return (r.github && r.github.commits) || 0;
          case "prs": return (r.github && r.github.openPrs) || 0;
          case "last": return (r.github && r.github.lastCommit) || "";
          default: return r.name.toLowerCase();
        }
      };
      const x = get(a), y = get(b);
      return (x < y ? -1 : x > y ? 1 : 0) * sortDir;
    });

    $("#index-body").innerHTML = rows.map((r) => {
      const c = clusterOf(r.cluster);
      const gh = r.github || {};
      return html`
        <tr class="row" data-repo="${esc(r.slug)}"
            data-search="${esc([r.slug, r.name, r.oneLiner, (r.stack || []).join(" "), r.tier, r.state].join(" ").toLowerCase())}"
            data-vis="${esc(r.visibility)}" data-cluster="${esc(r.cluster)}">
          <td class="n"><span class="dot" data-c="${esc(c.letter)}"></span>${esc(r.name)}
            <div class="muted" style="font-size:11px">${esc(r.slug)}</div></td>
          <td>${esc(c.name)}</td>
          <td>${prose(r.oneLiner)}</td>
          <td class="n">${esc(r.tier)}</td>
          <td>${esc(r.state)}</td>
          <td>${r.visibility === "public" ? '<span class="badge badge-pub">pub</span>' : '<span class="badge badge-priv">priv</span>'}</td>
          <td class="num">${esc(gh.commits ?? "—")}</td>
          <td class="num ${(gh.openPrs || 0) > 5 ? "" : "muted"}">${esc(gh.openPrs ?? 0)}</td>
          <td class="num muted">${esc(gh.lastCommit ?? "—")}</td>
        </tr>`;
    }).join("");

    $$("#panel-indeks th.sortable").forEach((th) => {
      th.setAttribute("aria-sort", th.dataset.k === sortKey ? (sortDir === 1 ? "ascending" : "descending") : "none");
    });
    filterIndex();
  }

  function filterIndex() {
    const q = ($("#ix-search").value || "").trim().toLowerCase();
    const active = $$("#ix-filters .chip").filter((c) => c.getAttribute("aria-pressed") === "true").map((c) => c.dataset.f);
    let shown = 0;
    $$("#index-body tr").forEach((tr) => {
      const okF = !active.length || active.every((f) =>
        f.startsWith("c:") ? tr.dataset.cluster === f.slice(2) :
        f.startsWith("v:") ? tr.dataset.vis === f.slice(2) : true);
      const on = okF && (!q || tr.dataset.search.includes(q));
      tr.style.display = on ? "" : "none";
      if (on) shown++;
    });
    $("#ix-count").textContent = `${shown} z ${(DATA.repos || []).length}`;
  }

  function initIndex() {
    $$("#panel-indeks th.sortable").forEach((th) => th.addEventListener("click", () => {
      if (sortKey === th.dataset.k) sortDir = -sortDir; else { sortKey = th.dataset.k; sortDir = 1; }
      renderIndex();
    }));
    $("#ix-search").addEventListener("input", filterIndex);
    $$("#ix-filters .chip").forEach((c) => c.addEventListener("click", () => {
      const on = c.getAttribute("aria-pressed") === "true";
      const fam = c.dataset.f.slice(0, 2);
      $$("#ix-filters .chip").filter((o) => o.dataset.f.startsWith(fam)).forEach((o) => o.setAttribute("aria-pressed", "false"));
      c.setAttribute("aria-pressed", String(!on));
      filterIndex();
    }));
  }

  /* =============================== ZAKŁADKA 5 — SŁOWNIK =================== */

  function renderGlossary() {
    const sorted = (DATA.glossary || []).slice().sort((a, b) => a.term.localeCompare(b.term, "pl"));
    $("#glossary").innerHTML = sorted.map((g) => html`
      <article class="gloss" id="t-${esc(g.id)}">
        <h3>${esc(g.term)}${g.tag ? ` <span class="gtag">${esc(g.tag)}</span>` : ""}</h3>
        ${(g.body || []).map((p) => `<p>${prose(p)}</p>`).join("")}
        ${g.where ? `<p class="where"><b>Gdzie:</b> ${prose(g.where)}</p>` : ""}
      </article>`).join("");

    const search = $("#gl-search");
    const tally = (n) => { $("#gl-count").textContent = `${n} ${plural(n, "termin", "terminy", "terminów")}`; };
    tally(sorted.length);
    search.addEventListener("input", () => {
      const q = search.value.trim().toLowerCase();
      let n = 0;
      $$("#glossary .gloss").forEach((el) => {
        const hit = !q || el.textContent.toLowerCase().includes(q);
        el.hidden = !hit; if (hit) n++;
      });
      tally(n);
    });
  }

  /* --------------------------------------------------------- nawigacja sekcji */
  function trackSections() {
    if (!("IntersectionObserver" in window)) return;
    if (trackSections._io) trackSections._io.disconnect();
    const panel = $$(".panel").find((p) => !p.hidden);
    if (!panel) return;
    const sub = $(`#subnav-${panel.id.replace("panel-", "")}`);
    if (!sub) return;
    const links = $$("a", sub);
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (en.isIntersecting) {
          links.forEach((a) => a.setAttribute("aria-current", String(a.getAttribute("href") === `#${en.target.id}`)));
        }
      });
    }, { rootMargin: "-25% 0px -65% 0px" });
    links.forEach((a) => { const s = $(a.getAttribute("href")); if (s) io.observe(s); });
    trackSections._io = io;
  }

  /* --------------------------------------------------------------- delegacja */
  function initDelegation(showTab) {
    document.addEventListener("click", (e) => {
      const term = e.target.closest("[data-term]");
      if (term) { e.preventDefault(); openTerm(term.dataset.term); return; }
      const repo = e.target.closest("[data-repo]");
      if (repo) { e.preventDefault(); openRepo(repo.dataset.repo); return; }
      const jump = e.target.closest("[data-goto]");
      if (jump) {
        e.preventDefault();
        const [tab, sec] = jump.dataset.goto.split("/");
        showTab(tab, true);
        if (sec) setTimeout(() => { const el = $(`#${sec}`); if (el) el.scrollIntoView({ block: "start" }); }, 30);
      }
    });
  }

  /* -------------------------------------------------------------------- start */
  async function boot() {
    const showTab = initTabs();
    drawer.init();
    try {
      const res = await fetch("data/portfolio.json", { cache: "no-cache" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      DATA = await res.json();
    } catch (err) {
      $("#boot").innerHTML =
        `<div class="err"><b>Nie udało się wczytać <code>data/portfolio.json</code>.</b><br>${esc(err.message)}
         <br><br>Strona jest statyczna i czyta ten jeden plik. Jeśli otwierasz ją z dysku przez
         <code>file://</code>, przeglądarka zablokuje odczyt — uruchom <code>python3 -m http.server</code>
         w katalogu <code>site/</code> i wejdź na <code>http://localhost:8000</code>.</div>`;
      return;
    }

    const plain = (s) => String(s).replace(/&nbsp;/g, " ").replace(/<[^>]+>/g, "");
    document.title = `${plain(DATA.meta.title)} — ${DATA.meta.owner}`;
    $("#mast-title").innerHTML = prose(DATA.meta.title);
    $("#mast-sub").innerHTML = prose(DATA.meta.subtitle);
    $("#mast-stamp").textContent = DATA.meta.stamp;
    $("#mast-links").innerHTML = (DATA.meta.links || [])
      .map((l) => `<a href="${esc(l.url)}" target="_blank" rel="noopener">${esc(l.label)}</a>`).join("")
      + `<button class="theme-btn" id="theme" type="button">motyw</button>`;
    initTheme();

    $("#boot").remove();
    renderPortfolio();
    initPortfolioFilters();
    renderConsolidation();
    renderOps();
    renderIndex();
    initIndex();
    renderGlossary();
    initDelegation(showTab);

    $$(".tabrow button").forEach((b) => {
      const n = { portfolio: (DATA.repos || []).length, konsolidacja: (DATA.kernels || []).length + (DATA.duplications || []).length,
        operacje: (DATA.ops.quarterPlan || []).length, indeks: (DATA.repos || []).length, slownik: (DATA.glossary || []).length }[b.dataset.tab];
      if (n != null) b.insertAdjacentHTML("beforeend", ` <span class="n">${n}</span>`);
    });

    trackSections();
    if (location.hash.startsWith("#t-")) openTerm(location.hash.slice(3));
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();

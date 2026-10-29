/* =====================================================
   main.js — apenas comportamento. O conteúdo fica no index.html.
   Tudo roda dentro de uma função para não poluir o escopo global.
   ===================================================== */
(function () {
  "use strict";

  const $ = (seletor, raiz = document) => raiz.querySelector(seletor);
  const $$ = (seletor, raiz = document) => Array.from(raiz.querySelectorAll(seletor));

  const reduzirMovimento = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Ano no rodapé ---------- */
  const ano = $("#ano");
  if (ano) ano.textContent = new Date().getFullYear();

  /* ---------- Tema (Escuro / Claro / Mono) ---------- */
  const botoesTema = $$(".temas button");

  function aplicarTema(tema) {
    document.documentElement.dataset.tema = tema;
    botoesTema.forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.tema === tema)));
    try { localStorage.setItem("tema", tema); } catch (e) { /* storage indisponível: ignora */ }
    document.dispatchEvent(new Event("tema-alterado"));
  }

  botoesTema.forEach((b) => b.addEventListener("click", () => aplicarTema(b.dataset.tema)));

  let temaSalvo = "escuro";
  try { temaSalvo = localStorage.getItem("tema") || "escuro"; } catch (e) { /* ignora */ }
  aplicarTema(temaSalvo);

  /* ---------- Menu móvel ---------- */
  const botaoMenu = $(".menu-btn");
  const menu = $("#menu");

  if (botaoMenu && menu) {
    const fecharMenu = () => {
      menu.classList.remove("aberto");
      botaoMenu.setAttribute("aria-expanded", "false");
    };

    botaoMenu.addEventListener("click", () => {
      const aberto = menu.classList.toggle("aberto");
      botaoMenu.setAttribute("aria-expanded", String(aberto));
    });

    menu.addEventListener("click", (e) => { if (e.target.closest("a")) fecharMenu(); });
    document.addEventListener("keydown", (e) => { if (e.key === "Escape") fecharMenu(); });
  }

  /* ---------- Texto digitado no hero ---------- */
  const alvoDigitacao = $("#digitando");
  const frases = ($(".digitando")?.dataset.frases || "").split("|").map((f) => f.trim()).filter(Boolean);

  if (alvoDigitacao && frases.length) {
    if (reduzirMovimento) {
      alvoDigitacao.textContent = frases[0];
    } else {
      let fraseAtual = 0, letras = 0, apagando = false;

      const digitar = () => {
        const frase = frases[fraseAtual];
        letras += apagando ? -1 : 1;
        alvoDigitacao.textContent = frase.slice(0, letras);

        let espera = apagando ? 40 : 90;
        if (!apagando && letras === frase.length) {
          apagando = true;
          espera = 1500;
        } else if (apagando && letras === 0) {
          apagando = false;
          fraseAtual = (fraseAtual + 1) % frases.length;
          espera = 400;
        }
        setTimeout(digitar, espera);
      };

      alvoDigitacao.textContent = "";
      digitar();
    }
  }

  /* ---------- Revelar ao rolar + link ativo no menu ---------- */
  if ("IntersectionObserver" in window) {
    const revelador = new IntersectionObserver((entradas) => {
      entradas.forEach((entrada) => {
        if (entrada.isIntersecting) {
          entrada.target.classList.add("visivel");
          revelador.unobserve(entrada.target);
        }
      });
    }, { threshold: 0.15 });
    $$(".revela").forEach((el) => revelador.observe(el));

    const linksMenu = $$(".menu a");
    const observadorSecoes = new IntersectionObserver((entradas) => {
      entradas.forEach((entrada) => {
        if (!entrada.isIntersecting) return;
        linksMenu.forEach((a) => a.classList.toggle("ativo", a.getAttribute("href") === "#" + entrada.target.id));
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    $$("main section[id]").forEach((s) => observadorSecoes.observe(s));
  } else {
    // Navegador muito antigo: mostra tudo sem animação
    $$(".revela").forEach((el) => el.classList.add("visivel"));
  }

  /* ---------- Formulário: abre o app de e-mail ---------- */
  const form = $("#form");
  const aviso = $("#aviso");

  if (form && aviso) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();

      if (!form.checkValidity()) {
        aviso.textContent = "Preencha todos os campos com um e-mail válido.";
        aviso.className = "aviso erro";
        return;
      }

      const destino = form.dataset.email;
      const corpo = `${form.elements.mensagem.value}\n\n— ${form.elements.nome.value} (${form.elements.email.value})`;
      const assunto = encodeURIComponent(form.elements.assunto.value);

      window.location.href = `mailto:${destino}?subject=${assunto}&body=${encodeURIComponent(corpo)}`;

      aviso.textContent = "Abrimos seu programa de e-mail. A mensagem só é enviada quando você clicar em enviar por lá.";
      aviso.className = "aviso";
    });
  }

  /* ---------- Fundo interativo (grade de pontos no canvas) ---------- */
  const canvas = $("#fundo");
  const ctx = canvas && canvas.getContext ? canvas.getContext("2d") : null;

  if (ctx) {
    const ESPACO = 34;   // distância entre pontos
    const RAIO = 170;    // raio de influência do mouse
    const mouse = { x: -999, y: -999 };
    let largura = 0, altura = 0, pontos = [], ondas = [], rgb = "168,85,247";

    const lerCor = () => {
      rgb = getComputedStyle(document.documentElement).getPropertyValue("--ponto").trim() || rgb;
    };

    const medir = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      largura = window.innerWidth;
      altura = window.innerHeight;
      canvas.width = largura * dpr;
      canvas.height = altura * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      pontos = [];
      for (let x = ESPACO / 2; x < largura; x += ESPACO) {
        for (let y = ESPACO / 2; y < altura; y += ESPACO) {
          pontos.push({ ox: x, oy: y, x, y, vx: 0, vy: 0 });
        }
      }
    };

    const desenharEstatico = () => {
      ctx.clearRect(0, 0, largura, altura);
      ctx.fillStyle = `rgba(${rgb},.18)`;
      pontos.forEach((p) => { ctx.beginPath(); ctx.arc(p.x, p.y, 1.1, 0, Math.PI * 2); ctx.fill(); });
    };

    const quadro = () => {
      ctx.clearRect(0, 0, largura, altura);

      if (mouse.x > 0) { // halo suave sob o cursor
        const halo = ctx.createRadialGradient(mouse.x, mouse.y, 0, mouse.x, mouse.y, 260);
        halo.addColorStop(0, `rgba(${rgb},.16)`);
        halo.addColorStop(1, `rgba(${rgb},0)`);
        ctx.fillStyle = halo;
        ctx.fillRect(mouse.x - 260, mouse.y - 260, 520, 520);
      }

      ondas.forEach((o) => { o.r += 7; });
      ondas = ondas.filter((o) => o.r < 900);

      for (const p of pontos) {
        let alvoX = p.ox, alvoY = p.oy, forca = 0;

        const dx = p.ox - mouse.x, dy = p.oy - mouse.y;
        const dist = Math.hypot(dx, dy) || 1;
        if (dist < RAIO) {
          forca = 1 - dist / RAIO;
          alvoX += (dx / dist) * forca * 38;
          alvoY += (dy / dist) * forca * 38;
        }

        for (const o of ondas) {
          const ox = p.ox - o.x, oy = p.oy - o.y;
          const od = Math.hypot(ox, oy) || 1;
          const k = 1 - Math.abs(od - o.r) / 50;
          if (k > 0) {
            alvoX += (ox / od) * k * 22;
            alvoY += (oy / od) * k * 22;
            forca = Math.max(forca, k * 0.8);
          }
        }

        p.vx = (p.vx + (alvoX - p.x) * 0.12) * 0.78;
        p.vy = (p.vy + (alvoY - p.y) * 0.12) * 0.78;
        p.x += p.vx;
        p.y += p.vy;

        ctx.fillStyle = `rgba(${rgb},${0.16 + forca * 0.84})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 1.1 + forca * 2.4, 0, Math.PI * 2);
        ctx.fill();
      }

      requestAnimationFrame(quadro);
    };

    medir();
    lerCor();

    let timerResize;
    window.addEventListener("resize", () => {
      clearTimeout(timerResize);
      timerResize = setTimeout(() => { medir(); if (reduzirMovimento) desenharEstatico(); }, 150);
    });

    document.addEventListener("tema-alterado", () => { lerCor(); if (reduzirMovimento) desenharEstatico(); });

    if (reduzirMovimento) {
      desenharEstatico();
    } else {
      window.addEventListener("pointermove", (e) => { mouse.x = e.clientX; mouse.y = e.clientY; });
      window.addEventListener("pointerdown", (e) => ondas.push({ x: e.clientX, y: e.clientY, r: 0 }));
      document.addEventListener("pointerleave", () => { mouse.x = mouse.y = -999; });
      quadro();
    }
  }

  /* ---------- Brilho que segue o mouse + botões "magnéticos" ---------- */
  const comBrilho = $$(".btn, .card");
  const magneticos = $$(".btn, .redes a");

  window.addEventListener("pointermove", (e) => {
    comBrilho.forEach((el) => {
      const r = el.getBoundingClientRect();
      const dentro = e.clientX > r.left - 4 && e.clientX < r.right + 4 &&
                     e.clientY > r.top - 4 && e.clientY < r.bottom + 4;
      if (dentro) {
        el.style.setProperty("--mx", e.clientX - r.left + "px");
        el.style.setProperty("--my", e.clientY - r.top + "px");
      }
    });

    if (reduzirMovimento || e.pointerType === "touch") return;

    magneticos.forEach((el) => {
      const r = el.getBoundingClientRect();
      const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
      const dx = e.clientX - cx, dy = e.clientY - cy;
      const alcance = Math.max(r.width, r.height) / 2 + 70;
      el.style.transform = Math.hypot(dx, dy) < alcance ? `translate(${dx * 0.22}px, ${dy * 0.22}px)` : "";
    });
  });
})();

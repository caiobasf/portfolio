/**
 * Estilo "suico": tecla G para a grade e animações mínimas e exatas.
 * Tudo é legível sem JS; as entradas partem de gsap.from e só rodam sem
 * prefers-reduced-motion.
 */
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';

gsap.registerPlugin(ScrollTrigger, SplitText);

/* ── grade: tecla G (ignora campos de texto e atalhos com modificador) ── */
const grade = document.getElementById('s-grade') as HTMLInputElement | null;
document.addEventListener('keydown', (e) => {
  if (!grade || e.key.toLowerCase() !== 'g' || e.ctrlKey || e.metaKey || e.altKey) return;
  const alvo = e.target as HTMLElement | null;
  if (alvo && (alvo.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(alvo.tagName))) return;
  grade.checked = !grade.checked;
});

const EASE = 'expo.out';

function mascarar(els: Element[]) {
  els.forEach((el) => el.classList.add('mascara'));
  return () => els.forEach((el) => el.classList.remove('mascara'));
}

function iniciar() {
  const mm = gsap.matchMedia();

  mm.add('(prefers-reduced-motion: no-preference)', () => {
    /* cartaz: linhas da grade descem, nome sobe das máscaras */
    const tl = gsap.timeline({ defaults: { ease: EASE } });
    tl.from('.s-linhas span', {
      scaleY: 0,
      transformOrigin: '50% 0%',
      duration: 1.1,
      ease: 'power3.inOut',
      stagger: 0.035,
    });
    tl.from('.s-topo .s-marca, .s-indice li', { yPercent: 60, autoAlpha: 0, duration: 0.8, stagger: 0.04 }, 0.15);
    tl.from('.s-meta > div', { y: 16, autoAlpha: 0, duration: 0.9, stagger: 0.06 }, 0.35);
    tl.from('.s-meta > div', { borderTopColor: 'transparent', duration: 0.6, stagger: 0.06 }, 0.35);

    const linhasNome = gsap.utils.toArray<HTMLElement>('.s-nome .s-linha');
    const soltar = mascarar(linhasNome);
    tl.from(
      '.s-nome .s-tinta',
      { yPercent: 105, duration: 1.3, stagger: 0.12, onComplete: soltar },
      0.3,
    );
    tl.from('.s-forma-giro', { scale: 0, rotation: -90, duration: 1.6, ease: 'expo.inOut' }, 0.2);
    tl.from('.s-lide > *', { y: 24, autoAlpha: 0, duration: 1, stagger: 0.1 }, 0.9);
    tl.from('.s-vertical', { autoAlpha: 0, duration: 1 }, 1);

    /* a forma vermelha gira e encolhe com a rolagem do cartaz */
    gsap.to('.s-forma', {
      rotation: 135,
      scale: 0.62,
      yPercent: 18,
      ease: 'none',
      scrollTrigger: { trigger: '.s-cartaz', start: 'top top', end: 'bottom top', scrub: 0.6 },
    });

    /* cabeças de seção: régua desenha, numeral sobe, título em palavras */
    gsap.utils.toArray<HTMLElement>('.s-secao').forEach((secao) => {
      const st = { trigger: secao, start: 'top 82%', once: true };
      const regua = secao.querySelector('.s-regua');
      const numeral = secao.querySelector<HTMLElement>('.s-numeral');
      const titulo = secao.querySelector('.s-titulo');
      const sub = secao.querySelector('.s-sub');
      const t = gsap.timeline({ scrollTrigger: st, defaults: { ease: EASE } });
      if (regua) t.from(regua, { scaleX: 0, duration: 1.2, ease: 'power4.inOut' }, 0);
      if (numeral) {
        const solta = mascarar([numeral]);
        t.from(numeral.firstElementChild, { yPercent: 100, duration: 1.2, onComplete: solta }, 0.25);
      }
      if (titulo) {
        SplitText.create(titulo, {
          type: 'words',
          mask: 'words',
          onSplit: (self) =>
            t.from(self.words, { yPercent: 110, duration: 1, stagger: 0.06, onComplete: () => self.revert() }, 0.4),
        });
      }
      if (sub) t.from(sub, { autoAlpha: 0, y: 10, duration: 0.8 }, 0.7);
    });

    /* parágrafos: linhas sobem das máscaras */
    gsap.utils.toArray<HTMLElement>('.s-revela, .s-lide-t, .s-construo-lide').forEach((el) => {
      if (el.classList.contains('s-lide-t')) return;
      SplitText.create(el, {
        type: 'lines',
        mask: 'lines',
        aria: 'none',
        onSplit: (self) =>
          gsap.from(self.lines, {
            yPercent: 105,
            duration: 1.1,
            ease: EASE,
            stagger: 0.07,
            onComplete: () => self.revert(),
            scrollTrigger: { trigger: el, start: 'top 85%', once: true },
          }),
      });
    });

    /* listas e linhas de tabela: deslizam uma a uma, com a régua desenhando */
    const blocos: [string, string][] = [
      ['.s-resumo', '.s-resumo > div'],
      ['.s-construo', '.s-construo li'],
      ['.s-tabela', '.s-tabela-linha'],
      ['.s-traj', '.s-traj-linha'],
      ['.s-redes', '.s-redes li'],
    ];
    for (const [pai, filhos] of blocos) {
      const el = document.querySelector(pai);
      if (!el) continue;
      gsap.from(filhos, {
        y: 28,
        autoAlpha: 0,
        duration: 0.9,
        ease: EASE,
        stagger: 0.07,
        scrollTrigger: { trigger: el, start: 'top 85%', once: true },
      });
    }

    /* projetos: bloco geométrico escala a partir do canto, nome sobe */
    gsap.utils.toArray<HTMLElement>('.s-proj').forEach((p) => {
      const t = gsap.timeline({
        defaults: { ease: EASE },
        scrollTrigger: { trigger: p, start: 'top 80%', once: true },
      });
      const b = p.classList.contains('s-proj-b');
      t.from(p.querySelector('.s-proj-bloco'), {
        scale: 0,
        transformOrigin: b ? '0% 100%' : '100% 100%',
        duration: 1.1,
        ease: 'expo.inOut',
      });
      const linha = p.querySelector<HTMLElement>('.s-proj-nome .s-linha');
      if (linha) {
        const solta = mascarar([linha]);
        t.from(linha.firstElementChild, { yPercent: 105, duration: 1.2, onComplete: solta }, 0.2);
      }
      t.from(p.querySelectorAll('.s-proj-meta, .s-proj-itens li, .s-proj-tags'), {
        y: 24,
        autoAlpha: 0,
        duration: 0.9,
        stagger: 0.06,
      }, 0.4);
    });

    /* o grande e-mail: letras sobem das máscaras */
    const email = document.querySelector<HTMLElement>('.s-email');
    if (email) {
      SplitText.create(email, {
        type: 'chars',
        mask: 'chars',
        onSplit: (self) =>
          gsap.from(self.chars, {
            yPercent: 110,
            duration: 0.9,
            ease: EASE,
            stagger: 0.018,
            onComplete: () => self.revert(),
            scrollTrigger: { trigger: email, start: 'top 90%', once: true },
          }),
      });
    }
  });
}

if (document.fonts?.ready) document.fonts.ready.then(iniciar);
else iniciar();

/**
 * Chat de /conversa: respostas prontas por palavra-chave, sem IA e sem backend.
 * Tudo é montado com textContent (nada de innerHTML com texto do usuário).
 */
import { reconhecer, respostas, type ItemLista, type Topico } from './chat-data';

const TYPING_DELAY = 650;
const VOLTAR_DELAY = 1000;

function el<K extends keyof HTMLElementTagNameMap>(tag: K, className?: string, text?: string) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function itemLista(item: ItemLista): HTMLLIElement {
  const li = el('li');
  if (typeof item === 'string') {
    li.textContent = item;
    return li;
  }
  li.append(item.prefixo);
  const a = el('a', 'msg__link', item.rotulo);
  a.href = item.href;
  if (item.externo) {
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
  }
  li.append(a);
  return li;
}

export function initChat(root: HTMLElement): void {
  const log = root.querySelector<HTMLElement>('[data-chat-log]');
  const scroller = root.querySelector<HTMLElement>('[data-chat-scroll]');
  const typing = root.querySelector<HTMLElement>('[data-chat-typing]');
  const form = root.querySelector<HTMLFormElement>('[data-chat-form]');
  const input = root.querySelector<HTMLInputElement>('[data-chat-input]');
  const chipButtons = root.querySelectorAll<HTMLButtonElement>('[data-chat-chip]');
  if (!log || !scroller || !typing || !form || !input) return;

  root.classList.add('is-ready');

  const scrollToEnd = () => {
    scroller.scrollTo({ top: scroller.scrollHeight, behavior: 'smooth' });
  };

  const addSystem = (text: string) => {
    log.append(el('div', 'msg msg--sys', `> ${text}`));
  };

  const addUser = (text: string) => {
    const wrap = el('div', 'msg msg--user');
    wrap.append(el('span', 'msg__who', 'Você'), el('p', 'msg__bubble', text));
    log.append(wrap);
  };

  const addCaio = (topico: Topico) => {
    const r = respostas[topico];
    const wrap = el('div', 'msg msg--caio');
    const bubble = el('div', 'msg__bubble');
    if (r.texto) bubble.append(el('p', undefined, r.texto));
    if (r.lista?.length) {
      const ul = el('ul', 'msg__list');
      r.lista.forEach((i) => ul.append(itemLista(i)));
      bubble.append(ul);
    }
    if (r.depois) bubble.append(el('p', undefined, r.depois));
    wrap.append(el('span', 'msg__who', 'Caio'), bubble);
    log.append(wrap);
  };

  let pending = 0;

  const perguntar = (topico: Topico, rotulo: string) => {
    addUser(rotulo);
    pending++;
    typing.hidden = false;
    scrollToEnd();

    window.setTimeout(() => {
      pending--;
      typing.hidden = pending === 0;
      addSystem(respostas[topico].sys);
      addCaio(topico);
      scrollToEnd();
      if (topico === 'voltar') {
        window.setTimeout(() => window.location.assign('/'), VOLTAR_DELAY);
      }
    }, TYPING_DELAY);
  };

  chipButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      perguntar(btn.dataset.chatChip as Topico, btn.textContent?.trim() ?? '');
    });
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const texto = input.value.trim();
    if (!texto) return;
    input.value = '';
    perguntar(reconhecer(texto), texto);
  });
}

// A deal finder: every deal and a page for each, on hash routes, with
// search and filters that live in the hash so any view can be linked.
//   #/                              the board, with search and filters
//   #/?cat=Audio&min=40&sort=saving  a filtered view of the board
//   #/deal/<id>                     one deal
//   #/how                           how a deal gets checked
//
// window.__shotReady is false while a page renders and true once it is on
// screen, so a screenshot script knows when to capture.

import { deals, saleWindows } from './data.js';
import { deal, how, list, missing, rows } from './views.js';

const app = document.getElementById('app');

function parseHash() {
  const raw = location.hash.replace(/^#/, '');
  const [path, query = ''] = raw.split('?');
  const params = new URLSearchParams(query);
  const dealMatch = path.match(/^\/deal\/([^/?]+)/);
  if (dealMatch) return { view: 'deal', id: decodeURIComponent(dealMatch[1]) };
  if (path === '/how') return { view: 'how' };
  return {
    view: 'list',
    filters: {
      q: params.get('q') || '',
      cat: params.get('cat') || '',
      store: params.get('store') || '',
      min: params.get('min') ? Number(params.get('min')) : '',
      verdict: params.get('verdict') || '',
      sort: params.get('sort') || 'discount',
    },
  };
}

function render() {
  window.__shotReady = false;
  const route = parseHash();
  if (route.view === 'deal') {
    const found = deals.find((d) => d.id === route.id);
    document.title = `${found ? found.title : 'Not found'} | Black Friday Board`;
    app.innerHTML = found ? deal(found, deals) : missing();
  } else if (route.view === 'how') {
    document.title = 'How deals are checked | Black Friday Board';
    app.innerHTML = how(saleWindows);
  } else {
    document.title = 'Black Friday Board — real deals, checked';
    app.innerHTML = list(deals, route.filters, deals);
    wireFilters(route.filters);
  }
  updateCount();
  window.scrollTo(0, 0);
  window.__shotReady = true;
}

function updateCount() {
  const el = document.getElementById('count');
  if (!el) return;
  const n = document.querySelectorAll('#deal-list .card').length;
  el.textContent = n === 1 ? '1 deal shown.' : `${n} deals shown.`;
}

function wireFilters(filters) {
  const form = document.getElementById('filters');
  if (!form) return;
  const apply = () => {
    const data = new FormData(form);
    const params = new URLSearchParams();
    for (const key of ['q', 'cat', 'store', 'min', 'verdict', 'sort']) {
      const v = String(data.get(key) || '').trim();
      if (v && !(key === 'sort' && v === 'discount')) params.set(key, v);
    }
    const qs = params.toString();
    const target = qs ? `#/?${qs}` : '#/';
    const shown = document.getElementById('deal-list');
    if (shown) {
      const next = {
        q: String(data.get('q') || ''),
        cat: String(data.get('cat') || ''),
        store: String(data.get('store') || ''),
        min: data.get('min') ? Number(data.get('min')) : '',
        verdict: String(data.get('verdict') || ''),
        sort: String(data.get('sort') || 'discount'),
      };
      shown.innerHTML = rows(deals, next);
      updateCount();
    }
    if (location.hash !== target) history.replaceState(null, '', target);
  };
  form.addEventListener('input', apply);
  form.addEventListener('change', apply);
}

window.addEventListener('hashchange', render);
render();

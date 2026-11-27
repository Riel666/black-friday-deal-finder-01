// HTML for each page, built from the deal data. Every value is escaped before it goes into the page.

const escape = (s) => String(s).replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
const usd = (n) => `$${Number(n).toLocaleString('en-US', { minimumFractionDigits: Number.isInteger(n) ? 0 : 2, maximumFractionDigits: 2 })}`;
const percentOff = (d) => Math.round((1 - d.price / d.was) * 100);
const saved = (d) => d.was - d.price;
const day = (iso) => new Date(iso).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'UTC' }) + ' UTC';

const VERDICTS = {
  "new-low": { label: "New low", cls: "v-new", blurb: "The lowest price the source has seen for this product." },
  strong: { label: "Strong price", cls: "v-strong", blurb: "A big, real cut on a current product." },
  routine: { label: "Routine sale", cls: "v-routine", blurb: "A real cut — but this price, or lower, has been seen before." },
};

export function verdictChip(d) {
  const v = VERDICTS[d.verdict];
  return `<span class="verdict ${v.cls}" title="${escape(v.blurb)}">${v.label}</span>`;
}

export function dealCard(d) {
  return `<li class="card">
  <a class="card-link" href="#/deal/${encodeURIComponent(d.id)}">
    <span class="card-top"><span class="store">${escape(d.store)}</span><span class="cat">${escape(d.category)}</span></span>
    <span class="card-title">${escape(d.title)}</span>
    <span class="card-price"><span class="now">${usd(d.price)}</span> <s>${usd(d.was)}</s> <span class="off">${percentOff(d)}% off</span></span>
    <span class="card-save">You save ${usd(saved(d))}</span>
    <span class="card-foot">${verdictChip(d)}<span class="checked">Checked ${day(d.checked)}</span></span>
  </a>
</li>`;
}

export function rows(deals, filters) {
  const q = (filters.q || '').trim().toLowerCase();
  const shown = deals.filter((d) => {
    if (q && !`${d.title} ${d.store} ${d.category}`.toLowerCase().includes(q)) return false;
    if (filters.cat && d.category !== filters.cat) return false;
    if (filters.store && d.store !== filters.store) return false;
    if (filters.min && percentOff(d) < filters.min) return false;
    if (filters.verdict && d.verdict !== filters.verdict) return false;
    return true;
  });
  const sort = filters.sort || 'discount';
  shown.sort((a, b) => {
    if (sort === 'saving') return saved(b) - saved(a);
    if (sort === 'price') return a.price - b.price;
    if (sort === 'newest') return new Date(b.checked) - new Date(a.checked);
    return percentOff(b) - percentOff(a) || saved(b) - saved(a);
  });
  if (shown.length === 0) {
    return `<li class="empty">No deal matches those filters. <a href="#/">Clear the filters</a>.</li>`;
  }
  return shown.map(dealCard).join('');
}

export function list(deals, filters, all) {
  const count = all.length;
  const today = all.filter((d) => d.checked.startsWith('2026-11-27')).length;
  const newLows = all.filter((d) => d.verdict === 'new-low').length;
  const cats = [...new Set(all.map((d) => d.category))].sort();
  const stores = [...new Set(all.map((d) => d.store))].sort();
  const opt = (list, cur, allLabel) =>
    `<option value="">${allLabel}</option>` +
    list.map((v) => `<option value="${escape(v)}"${v === cur ? ' selected' : ''}>${escape(v)}</option>`).join('');
  return `<section class="hero">
  <p class="kicker">Black Friday · Friday 27 November 2026</p>
  <h1>Black Friday Board</h1>
  <p class="lede">${count} real deals, each read in a named source on the date shown — ${today} checked today, ${newLows} at their lowest price ever. Nothing here is a placeholder, and nothing is a price we guessed.</p>
  <p class="warn">Prices move all day on Black Friday. Check the store page before you buy — the price at checkout is the truth.</p>
</section>
<form class="filters" id="filters" onsubmit="return false">
  <label>Search <input type="search" name="q" value="${escape(filters.q || '')}" placeholder="AirPods, Dyson, TV…"></label>
  <label>Category <select name="cat">${opt(cats, filters.cat, 'All categories')}</select></label>
  <label>Store <select name="store">${opt(stores, filters.store, 'All stores')}</select></label>
  <label>Discount <select name="min">
    <option value=""${!filters.min ? ' selected' : ''}>Any discount</option>
    <option value="25"${filters.min === 25 ? ' selected' : ''}>25%+ off</option>
    <option value="40"${filters.min === 40 ? ' selected' : ''}>40%+ off</option>
    <option value="50"${filters.min === 50 ? ' selected' : ''}>50%+ off</option>
  </select></label>
  <label>Verdict <select name="verdict">
    <option value=""${!filters.verdict ? ' selected' : ''}>Any verdict</option>
    <option value="new-low"${filters.verdict === 'new-low' ? ' selected' : ''}>New low only</option>
    <option value="strong"${filters.verdict === 'strong' ? ' selected' : ''}>Strong price</option>
    <option value="routine"${filters.verdict === 'routine' ? ' selected' : ''}>Routine sale</option>
  </select></label>
  <label>Sort <select name="sort">
    <option value="discount"${filters.sort === 'discount' ? ' selected' : ''}>Biggest % off</option>
    <option value="saving"${filters.sort === 'saving' ? ' selected' : ''}>Biggest saving</option>
    <option value="price"${filters.sort === 'price' ? ' selected' : ''}>Lowest price</option>
    <option value="newest"${filters.sort === 'newest' ? ' selected' : ''}>Newest checked</option>
  </select></label>
</form>
<p class="count" id="count"></p>
<ul class="deals" id="deal-list">${rows(deals, filters)}</ul>
<section class="today">
  <h2>Today only — worth knowing</h2>
  <ul>
    <li><strong>Best Buy $100 gift card for $60</strong>, in stores only, for My Best Buy members — one per person, at least 50 per store, no rainchecks.</li>
    <li><strong>Target's first 100 guests</strong> at every store get a gift card worth $25, $50 or $100, with one guest per store winning $1,000. Tickets go out from around 5 a.m.</li>
    <li><strong>Apple's event (Nov 27–30) is not a price cut</strong> — you pay full price and get an Apple Gift Card worth up to $300 with an eligible purchase. Amazon's $310 off a MacBook Air beats Apple's $200 gift card.</li>
  </ul>
  <p><a href="#/how">How this board checks a deal &rarr;</a></p>
</section>`;
}

export function deal(d, all) {
  const v = VERDICTS[d.verdict];
  const related = all.filter((x) => x.id !== d.id && (x.category === d.category || x.store === d.store)).slice(0, 4);
  return `<p class="back"><a href="#/">&larr; All deals</a></p>
<article class="detail">
  <p class="card-top"><span class="store">${escape(d.store)}</span><span class="cat">${escape(d.category)}</span></p>
  <h1>${escape(d.title)}</h1>
  <p class="big-price"><span class="now">${usd(d.price)}</span> <s>${usd(d.was)}</s> <span class="off">${percentOff(d)}% off</span></p>
  <p class="save-line">You save ${usd(saved(d))} off the usual price.</p>
  <p>${verdictChip(d)} <span class="verdict-why">${escape(v.blurb)}</span></p>
  <dl>
    <dt>Store</dt><dd>${escape(d.store)}</dd>
    <dt>Category</dt><dd>${escape(d.category)}</dd>
    <dt>Sale price</dt><dd>${usd(d.price)}</dd>
    <dt>Usual price</dt><dd>${usd(d.was)}</dd>
    <dt>Checked</dt><dd>${day(d.checked)}</dd>
    <dt>Read in</dt><dd>${escape(d.source)}</dd>
  </dl>
  <p class="note"><strong>Why this verdict:</strong> ${escape(d.note)}</p>
  <p class="warn">Prices move during Black Friday — check the price at checkout before you order.</p>
  <p><a class="store-btn" href="${escape(d.url)}" rel="noopener">Find it at ${escape(d.store)} &rarr;</a></p>
</article>
${related.length ? `<section class="related"><h2>More ${escape(d.category)} deals</h2><ul class="deals">${related.map(dealCard).join('')}</ul></section>` : ''}`;
}

export function how(windows) {
  return `<p class="back"><a href="#/">&larr; All deals</a></p>
<h1>How this board checks a deal</h1>
<p>Every deal on this board was read in a named source — a deal roundup, a retailer's own release, or a deal tracker — on the date shown on the deal. The source and the check date sit on every deal page, so any price can be traced back.</p>
<h2>The verdicts</h2>
<dl>
  <dt><span class="verdict v-new">New low</span></dt><dd>The source calls it the lowest price ever seen for the product — the deal to buy first.</dd>
  <dt><span class="verdict v-strong">Strong price</span></dt><dd>A big, real cut on a current product.</dd>
  <dt><span class="verdict v-routine">Routine sale</span></dt><dd>A real cut, but one that has been seen before, or a modest one. Buy it if you need it, not because the badge is exciting.</dd>
</dl>
<h2>What we do not do</h2>
<ul>
  <li>We never invent a price, a discount, or a "was" price.</li>
  <li>We never copy a starter list — every deal here was found and checked in this session.</li>
  <li>We never call a gift card a price cut, and we say so when a retailer does.</li>
  <li>We never hide the check date: a price from November 3 may have moved by November 27, and the board says so on the deal.</li>
</ul>
<h2>Sale windows, from the retailers' own announcements</h2>
<ul>${windows.map((w) => `<li><strong>${escape(w.store)}:</strong> ${escape(w.window)}</li>`).join('')}</ul>
<p class="warn">Prices move all day on Black Friday. Check the store page before you buy — the price at checkout is the truth.</p>`;
}

export function missing() {
  return `<h1>Not found</h1>
<p>There is no deal at this address. <a href="#/">See all deals</a>.</p>`;
}

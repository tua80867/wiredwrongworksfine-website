(() => {
  const root = '/snap-circuits/catalog/';
  const disclosure = 'As an Amazon Associate I earn from qualifying purchases.';
  const labels = {
    'Exact kit': 'View on Amazon',
    'Catalog kit association': 'View kit on Amazon (check contents)',
    'Conditional kit part': 'View kit on Amazon (check contents)',
    'Model manual reference': 'View associated kit on Amazon',
    'Multipack': 'View bundle on Amazon',
    'Likely kit': 'View possible match on Amazon',
    'Used with': 'View related item on Amazon',
    'Related or similar': 'View related item on Amazon',
  };
  const node = (tag, text) => {
    const element = document.createElement(tag);
    if (text) element.textContent = text;
    return element;
  };

  function purchase(offer, label = 'View on Amazon') {
    const line = node('span');
    const link = node('a', label);
    link.href = offer.url;
    link.rel = 'sponsored';
    const note = node('small', '(affiliate link)');
    note.className = 'affiliate-label';
    line.append(link, ' ', note);
    return line;
  }

  function itemLinks(offers, path) {
    const relevant = offers.flatMap(offer => {
      const match = offer.matches.find(match => match.path === path);
      return match ? [{offer, match}] : [];
    }).sort((a, b) => Number(b.match.kind === 'Exact kit') - Number(a.match.kind === 'Exact kit')
      || Number(a.offer.pending) - Number(b.offer.pending));
    if (!relevant.length) return null;
    const section = node('section');
    section.className = 'shop-item';
    section.append(node('h2', 'Amazon listings'), node('p', 'I may earn a commission from purchases through these links.'));
    const list = node('ul');
    for (const {offer, match} of relevant) {
      const item = node('li');
      item.append(node('strong', offer.title), node('br'), purchase(offer, labels[match.kind] || 'View similar item on Amazon'));
      if (offer.pending) item.append(' · Availability to check');
      list.append(item);
    }
    section.append(list, node('p', disclosure));
    return section;
  }

  function renderShop(content, offers, matching, query, hasFilters) {
    const byPath = new Set(matching.map(record => record.page_url));
    const listed = offers.filter(offer => {
      if (!query && !hasFilters) return true;
      const titleMatch = query && window.InventoryFilters.searchMatches(offer.searchRecord, query);
      return offer.matches.some(match => byPath.has(match.path)) || (!hasFilters && titleMatch);
    });
    const available = node('div');
    available.className = 'shop-grid';
    const pending = node('details');
    pending.className = 'shop-pending';
    const pendingGrid = node('div');
    pendingGrid.className = 'shop-grid';
    for (const offer of listed) {
      const card = node('article');
      card.className = 'shop-card';
      if (offer.image) {
        const image = node('img');
        image.src = root + offer.image.path;
        image.alt = '';
        image.loading = 'lazy';
        card.append(image);
        const credit = node('a', (offer.image.reference ? 'Catalog reference image · ' : '') + (offer.image.credit || 'Image source'));
        credit.href = offer.image.source;
        credit.className = 'shop-credit';
        card.append(credit);
      } else {
        const placeholder = node('div', 'See listing for photos');
        placeholder.className = 'shop-image-placeholder';
        card.append(placeholder);
      }
      card.append(node('div', offer.type), node('h3', offer.title));
      const matched = (query || hasFilters) && offer.matches.find(match => byPath.has(match.path));
      const reference = matched || offer.matches[0];
      if (reference) {
        const details = node('a', 'Catalog details · ' + reference.code);
        details.href = reference.path;
        card.append(details);
        if (matched && matched.kind !== 'Exact kit') {
          card.append(node('p', labels[matched.kind]?.replace(/^View /, '').replace(/ on Amazon/, '') || 'Similar option'));
        }
      }
      card.append(purchase(offer));
      (offer.pending ? pendingGrid : available).append(card);
    }
    content.append(node('p', 'I may earn a commission from purchases through Amazon links. Check Amazon for current price and availability.'));
    if (!listed.length) content.append(node('p', 'No matching Amazon listings.'));
    content.append(available);
    if (pendingGrid.childElementCount) {
      pending.append(node('summary', 'Availability to check (' + pendingGrid.childElementCount + ')'), pendingGrid);
      content.append(pending);
    }
    content.append(node('p', disclosure));
    return listed.length;
  }

  window.CatalogShop = {renderShop, itemLinks};
  if (location.pathname.startsWith(root + 'items/')) {
    fetch(root + 'shop-offers.json').then(response => {
      if (!response.ok) throw new Error('Shop listings unavailable');
      return response.json();
    }).then(offers => {
      const path = location.pathname.replace(/index\.html$/, '').replace(/\/?$/, '/');
      const section = itemLinks(offers, path);
      if (section) document.querySelector('.item-note').before(section);
    }).catch(error => console.warn(error));
  }
})();

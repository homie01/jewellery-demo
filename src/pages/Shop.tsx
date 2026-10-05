import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowRight, ChevronDown, Search, SlidersHorizontal, X } from 'lucide-react';
import { useCart, useStore } from '../contexts/CommerceContext';
import { ProductGrid } from '../components/ProductCard';
import { Button, EmptyState, Modal } from '../components/ui';
import { money } from '../lib/storage';

export default function Shop() {
  const [params, setParams] = useSearchParams();
  const [filtersOpen, setFiltersOpen] = useState(false);
  const { catalog } = useStore();
  const { wishlist } = useCart();
  const category = params.get('category') ?? 'All Jewellery';
  const collection = params.get('collection') ?? '';
  const material = params.get('material') ?? '';
  const search = params.get('q') ?? '';
  const maxPrice = Number(params.get('price')) || 60000;
  const onlyAvailable = params.get('available') === '1';
  const isNew = params.get('new') === '1';
  const isSaved = params.get('saved') === '1';
  const sort = params.get('sort') ?? 'featured';
  const setFilter = (key: string, value: string) => {
    setParams((current) => { const next = new URLSearchParams(current); if (value) next.set(key, value); else next.delete(key); return next; }, { replace: true });
  };
  const filtered = useMemo(() => {
    const result = catalog.filter((product) =>
      (category === 'All Jewellery' || product.category === category) &&
      (!collection || product.collection === collection) &&
      (!material || product.material === material) &&
      (!search || `${product.name} ${product.category} ${product.material}`.toLowerCase().includes(search.toLowerCase())) &&
      product.price <= maxPrice && (!onlyAvailable || product.available) && (!isNew || product.isNew) && (!isSaved || wishlist.includes(product.id)),
    );
    if (sort === 'price-low') result.sort((a, b) => a.price - b.price);
    if (sort === 'price-high') result.sort((a, b) => b.price - a.price);
    if (sort === 'name') result.sort((a, b) => a.name.localeCompare(b.name));
    if (sort === 'newest') result.sort((a, b) => Number(Boolean(b.isNew)) - Number(Boolean(a.isNew)));
    return result;
  }, [catalog, category, collection, material, search, maxPrice, onlyAvailable, isNew, isSaved, wishlist, sort]);
  const activeCount = [collection, material, category !== 'All Jewellery', maxPrice < 60000, onlyAvailable, isNew].filter(Boolean).length;
  return <div className="shop-page"><div className="shop-intro"><div className="breadcrumbs"><Link to="/">HOME</Link><span>/</span><span>{isSaved ? 'SAVED PIECES' : 'THE COLLECTION'}</span></div><p className="eyebrow">CONSIDERED. CRAFTED. CHERISHED.</p><h1>{isSaved ? <>Your <em>forever favourites.</em></> : isNew ? <>A beautiful <em>new chapter.</em></> : <>The <em>collection.</em></>}</h1><p>{isSaved ? 'The pieces you have your heart set on, all in one place.' : 'For the big moments, the little rituals, and everything in between.'}</p></div>
    <div className="shop-category-tabs" role="group" aria-label="Product category">{['All Jewellery', 'Rings', 'Necklaces', 'Earrings', 'Bracelets', 'Bangles'].map((item) => <button key={item} onClick={() => setFilter('category', item === 'All Jewellery' ? '' : item)} className={category === item ? 'active' : ''} aria-pressed={category === item}>{item}</button>)}</div>
    <div className="shop-toolbar"><div><button className={`filter-trigger ${activeCount ? 'has-filters' : ''}`} onClick={() => setFiltersOpen(true)}><SlidersHorizontal size={16} strokeWidth={1.4} /> FILTER {activeCount > 0 && `(${activeCount})`}</button><span className="product-count" aria-live="polite">{filtered.length} considered pieces</span></div><div><label className="shop-search"><Search size={16} strokeWidth={1.4} /><input value={search} onChange={(event) => setFilter('q', event.target.value)} placeholder="Find a piece" aria-label="Search the collection" />{search && <button onClick={() => setFilter('q', '')} aria-label="Clear search"><X size={13} /></button>}</label><label className="sort-label"><span>SORT BY</span><select value={sort} onChange={(event) => setFilter('sort', event.target.value)} aria-label="Sort products"><option value="featured">Featured</option><option value="newest">New arrivals</option><option value="price-low">Price: low to high</option><option value="price-high">Price: high to low</option><option value="name">Name: A to Z</option></select><ChevronDown size={13} /></label></div></div>
    {activeCount > 0 && <div className="active-filters">{collection && <button onClick={() => setFilter('collection', '')}>{collection}<X size={12} /></button>}{material && <button onClick={() => setFilter('material', '')}>{material}<X size={12} /></button>}{isNew && <button onClick={() => setFilter('new', '')}>New arrivals<X size={12} /></button>}{maxPrice < 60000 && <button onClick={() => setFilter('price', '')}>Under {money(maxPrice)}<X size={12} /></button>}{onlyAvailable && <button onClick={() => setFilter('available', '')}>In stock<X size={12} /></button>}<button className="clear-filters" onClick={() => setParams(isSaved ? { saved: '1' } : {})}>CLEAR FILTERS</button></div>}
    {filtered.length ? <ProductGrid products={filtered} /> : <EmptyState title={isSaved && wishlist.length === 0 ? 'Follow your heart.' : 'A little more room to explore.'} description={isSaved && wishlist.length === 0 ? 'Tap the heart on any piece to save it here for another moment.' : 'No pieces match these filters. Let us show you a little more.'}><Button variant="outline" onClick={() => setParams({})}>EXPLORE ALL JEWELLERY <ArrowRight size={16} /></Button></EmptyState>}
    {filtered.length > 0 && <div className="shop-end"><span className="small-asterisk">*</span><p>Every piece, a possibility. Every detail, considered.</p></div>}
    <Modal open={filtersOpen} onClose={() => setFiltersOpen(false)} title="A more personal edit" drawer className="filter-drawer"><div className="filter-content"><fieldset><legend>CATEGORY</legend>{['All Jewellery', 'Rings', 'Necklaces', 'Earrings', 'Bracelets', 'Bangles'].map((item) => <label className="filter-option" key={item}><input type="radio" name="category" checked={category === item} onChange={() => setFilter('category', item === 'All Jewellery' ? '' : item)} />{item}<span>{item === 'All Jewellery' ? catalog.length : catalog.filter((product) => product.category === item).length}</span></label>)}</fieldset><fieldset><legend>PRICE RANGE <span>UP TO {money(maxPrice)}</span></legend><input type="range" aria-label="Maximum price" min="15000" max="60000" step="1000" value={maxPrice} onChange={(event) => setFilter('price', event.target.value)} /><div className="range-labels"><span>{money(15000)}</span><span>{money(60000)}</span></div></fieldset><label className="field"><span>MATERIAL</span><select value={material} onChange={(event) => setFilter('material', event.target.value)}><option value="">All materials</option><option>18K Gold</option><option>Gold & Diamond</option><option>Gold & Pearl</option></select></label><label className="field"><span>COLLECTION</span><select value={collection} onChange={(event) => setFilter('collection', event.target.value)}><option value="">All collections</option><option>Signature</option><option>Everyday Heirlooms</option><option>The Pearl Edit</option></select></label><label className="filter-option"><input type="checkbox" checked={onlyAvailable} onChange={(event) => setFilter('available', event.target.checked ? '1' : '')} />Available now</label><label className="filter-option"><input type="checkbox" checked={isNew} onChange={(event) => setFilter('new', event.target.checked ? '1' : '')} />New arrivals only</label></div><div className="filter-footer"><Button onClick={() => setFiltersOpen(false)}>SHOW {filtered.length} PIECES <ArrowRight size={16} /></Button><Button variant="text" onClick={() => setParams(isSaved ? { saved: '1' } : {})}>RESET FILTERS</Button></div></Modal>
  </div>;
}
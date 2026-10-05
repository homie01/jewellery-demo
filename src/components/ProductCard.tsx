import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Heart, Plus, ShoppingBag } from 'lucide-react';
import { useCart } from '../contexts/CommerceContext';
import { useUI } from '../contexts/UIContext';
import { money } from '../lib/storage';
import { Button, ButtonLink, Modal, Quantity } from './ui';
import type { Product } from '../types';

export function ProductCard({ product, index = 0 }: { product: Product; index?: number }) {
  const { wishlist, toggleWishlist, addItem } = useCart();
  const { setQuickView, setCartOpen } = useUI();
  const saved = wishlist.includes(product.id);
  return <motion.article layout className="product-card" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96 }} transition={{ duration: 0.35, delay: Math.min(index * 0.035, 0.2) }}>
    <div className="product-card-image">
      <Link to={`/product/${product.id}`} aria-label={`Discover ${product.name}`}><img src={product.image} alt={product.name} loading="lazy" width="800" height="800" /></Link>
      {product.isNew && <span className="product-new-label">JUST ARRIVED</span>}
      {!product.available && <span className="product-new-label">COMING BACK SOON</span>}
      <motion.button className={`product-wishlist ${saved ? 'is-saved' : ''}`} whileTap={{ scale: 0.8 }} onClick={() => toggleWishlist(product.id)} aria-label={`${saved ? 'Remove' : 'Save'} ${product.name} ${saved ? 'from' : 'to'} wishlist`} aria-pressed={saved}><Heart size={18} strokeWidth={1.35} fill={saved ? 'currentColor' : 'none'} /></motion.button>
      <button className="product-quick-view" onClick={() => setQuickView(product)}>QUICK VIEW <Plus size={13} /></button>
    </div>
    <div className="product-card-details"><div><p className="product-category">{product.material}</p><Link to={`/product/${product.id}`} className="product-name">{product.name}</Link><p className="product-price">{money(product.price)}</p></div><button className="product-add" disabled={!product.available} aria-label={`Add ${product.name} to bag`} onClick={() => { addItem(product); setCartOpen(true); }}><Plus size={18} strokeWidth={1.4} /></button></div>
  </motion.article>;
}

export function ProductGrid({ products, className = '' }: { products: Product[]; className?: string }) {
  return <div className={`product-grid ${className}`}>{products.map((product, index) => <ProductCard key={product.id} product={product} index={index} />)}</div>;
}

function QuickViewContent({ product }: { product: Product }) {
  const [size, setSize] = useState(product.sizes[0]);
  const [quantity, setQuantity] = useState(1);
  const { addItem } = useCart();
  const { setCartOpen, setQuickView } = useUI();
  return <div className="quick-view-content"><img src={product.image} alt={product.name} /><div className="quick-view-info"><p className="eyebrow">{product.collection} COLLECTION</p><h3>{product.name}</h3><p className="detail-price">{money(product.price)}</p><p className="muted leading-relaxed">{product.description}</p><label className="field"><span>SIZE</span><select value={size} onChange={(event) => setSize(event.target.value)}>{product.sizes.map((value) => <option key={value}>{value}</option>)}</select></label><Quantity value={quantity} onDecrease={() => setQuantity((value) => value - 1)} onIncrease={() => setQuantity((value) => value + 1)} /><Button className="w-full" disabled={!product.available} onClick={() => { addItem(product, quantity, size); setQuickView(null); setCartOpen(true); }}><ShoppingBag size={16} />{product.available ? 'ADD TO BAG' : 'CURRENTLY UNAVAILABLE'}</Button><ButtonLink to={`/product/${product.id}`} variant="text" onClick={() => setQuickView(null)}>EXPLORE THE DETAILS <ArrowRight size={15} /></ButtonLink></div></div>;
}

export function QuickView() {
  const { quickView, setQuickView } = useUI();
  return <Modal open={Boolean(quickView)} onClose={() => setQuickView(null)} title="A closer look" className="quick-view-modal">{quickView && <QuickViewContent key={quickView.id} product={quickView} />}</Modal>;
}
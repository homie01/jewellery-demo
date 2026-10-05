import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, ShoppingBag, X } from 'lucide-react';
import { useCart, useStore } from '../contexts/CommerceContext';
import { useAuth } from '../contexts/AuthContext';
import { useUI } from '../contexts/UIContext';
import { money } from '../lib/storage';
import { Button, ButtonLink, EmptyState, Modal, Quantity } from './ui';
import type { CartItem } from '../types';

export function CartRow({ item, onNavigate }: { item: CartItem; onNavigate?: () => void }) {
  const { catalog } = useStore();
  const product = catalog.find((entry) => entry.id === item.productId);
  const { increaseQuantity, decreaseQuantity, removeItem } = useCart();
  if (!product) return null;
  return <div className="cart-row"><Link onClick={onNavigate} to={`/product/${product.id}`} className="cart-row-image"><img src={product.image} alt={product.name} /></Link><div className="cart-row-info"><p className="product-category">{product.material}</p><Link onClick={onNavigate} to={`/product/${product.id}`} className="cart-product-name">{product.name}</Link><p className="cart-size">Size: {item.size}</p><div className="cart-row-bottom"><Quantity value={item.quantity} onIncrease={() => increaseQuantity(item.key)} onDecrease={() => decreaseQuantity(item.key)} /><span>{money(product.price * item.quantity)}</span></div></div><button className="cart-remove" onClick={() => removeItem(item.key)} aria-label={`Remove ${product.name}`}><X size={16} strokeWidth={1.4} /></button></div>;
}

export function CartDrawer() {
  const { items, count, subtotal } = useCart();
  const { customerUser } = useAuth();
  const { cartOpen, setCartOpen } = useUI();
  const navigate = useNavigate();
  const close = () => setCartOpen(false);

  const handleCheckoutClick = () => {
    close();
    if (!customerUser) {
      navigate('/login?redirect=/checkout&reason=order');
    } else {
      navigate('/checkout');
    }
  };

  return <Modal open={cartOpen} onClose={close} title={`Your bag (${count})`} drawer className="cart-drawer">{items.length ? <><p className="bag-note">Something beautiful is coming your way.</p><div className="cart-drawer-items">{items.map((item) => <CartRow key={item.key} item={item} onNavigate={close} />)}</div><div className="cart-drawer-footer"><p className="flex justify-between"><span>Subtotal</span><strong>{money(subtotal)}</strong></p><p className="muted text-xs">Complimentary standard delivery. All taxes included.</p><Button onClick={handleCheckoutClick} className="w-full">PROCEED TO CHECKOUT <ArrowRight size={16} /></Button><ButtonLink to="/cart" onClick={close} variant="outline">VIEW YOUR BAG</ButtonLink><p className="bag-security"><ShoppingBag size={13} /> Thoughtfully wrapped, always.</p></div></> : <EmptyState title="A little room for something lovely." description="Your bag is waiting for its first forever piece."><ButtonLink to="/shop" onClick={close}>EXPLORE THE COLLECTION <ArrowRight size={16} /></ButtonLink></EmptyState>}</Modal>;
}
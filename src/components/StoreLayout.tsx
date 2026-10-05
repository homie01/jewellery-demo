import { useEffect, useLayoutEffect, useState, type FormEvent } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import gsap from 'gsap';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, Heart, Search, ShoppingBag, UserRound } from 'lucide-react';
import { useCart, useStore } from '../contexts/CommerceContext';
import { useAuth } from '../contexts/AuthContext';
import { useUI } from '../contexts/UIContext';
import { money, readStorage, writeStorage } from '../lib/storage';
import { Button, Logo, Modal } from './ui';
import { PageTransition } from './Motion';

const links = [
  { label: 'Collections', to: '/shop?collection=Signature' },
  { label: 'Jewellery', to: '/shop' },
  { label: 'New Arrivals', to: '/shop?new=1' },
  { label: 'Our Story', to: '/about' },
  { label: 'Journal', to: '/journal' },
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');
  const { count, wishlist } = useCart();
  const { catalog } = useStore();
  const { customerUser, customerSignOut } = useAuth();
  const { setCartOpen } = useUI();
  const location = useLocation();
  const navigate = useNavigate();
  useLayoutEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const ctx = gsap.context(() => {
      gsap.fromTo('.nav-inner', { opacity: 0 }, { opacity: 1, duration: 0.8, delay: document.querySelector('.preloader') ? 1.3 : 0.05, clearProps: 'opacity' });
    });
    return () => ctx.revert();
  }, []);
  useEffect(() => {
    const onScroll = () => setScrolled((current) => window.scrollY > 70 ? true : window.scrollY < 20 ? false : current);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  useEffect(() => { setMenuOpen(false); setSearchOpen(false); }, [location.pathname, location.search]);
  const results = catalog.filter((product) => `${product.name} ${product.category} ${product.material}`.toLowerCase().includes(query.toLowerCase())).slice(0, 5);
  const search = (event: FormEvent) => { event.preventDefault(); setSearchOpen(false); navigate(`/shop?q=${encodeURIComponent(query)}`); };
  return (
    <>
      <div className="announcement">
        THOUGHTFULLY CRAFTED. FOREVER CHERISHED.
        <span>COMPLIMENTARY SHIPPING ON ALL ORDERS</span>
      </div>
      <header className={`store-header ${scrolled ? 'is-scrolled' : ''}`}>
        <div className="nav-inner">
          <button
            className={`mobile-menu-button ${menuOpen ? 'is-open' : ''}`}
            aria-label="Open navigation menu"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen(true)}
          >
            <span />
            <span />
          </button>
          <Logo />
          <nav className="desktop-nav" aria-label="Main navigation">
            {links.map((link) => (
              <Link
                to={link.to}
                key={link.label}
                className="nav-link"
                aria-current={`${location.pathname}${location.search}` === link.to ? 'page' : undefined}
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <div className="nav-actions">
            <button className="icon-button" onClick={() => setSearchOpen(true)} aria-label="Search jewellery">
              <Search size={20} strokeWidth={1.4} />
            </button>
            <Link to="/shop?saved=1" className="icon-button wishlist-nav" aria-label={`Wishlist, ${wishlist.length} pieces`}>
              <Heart size={20} strokeWidth={1.4} />
              {wishlist.length > 0 && <span className="wishlist-dot" />}
            </Link>
            <Link
              to="/login"
              className={`icon-button account-nav ${customerUser ? 'is-authenticated' : ''}`}
              aria-label={customerUser ? `Logged in as ${customerUser.name}` : 'Sign in or create account'}
            >
              <UserRound size={19} strokeWidth={1.4} />
              {customerUser && <span className="user-active-dot" title={`Signed in as ${customerUser.name}`} />}
            </Link>
            <button className="bag-button" onClick={() => setCartOpen(true)} aria-label={`Shopping bag, ${count} items`}>
              <ShoppingBag size={19} strokeWidth={1.4} />
              <AnimatePresence mode="popLayout">
                <motion.span
                  key={count}
                  initial={{ y: 8, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: -8, opacity: 0 }}
                  className="bag-count"
                >
                  {count}
                </motion.span>
              </AnimatePresence>
            </button>
          </div>
        </div>
      </header>
      <Modal open={menuOpen} onClose={() => setMenuOpen(false)} title="AUREL." className="mobile-menu-modal">
        <nav aria-label="Mobile navigation">
          {links.map((link, index) => (
            <motion.div key={link.label} initial={{ opacity: 0, x: -15 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.05 }}>
              <Link to={link.to} onClick={() => setMenuOpen(false)}>
                <span>0{index + 1}</span>
                {link.label}
                <ArrowRight size={22} />
              </Link>
            </motion.div>
          ))}
        </nav>
        <div className="mobile-menu-bottom">
          {customerUser ? (
            <>
              <div className="mobile-user-info">
                Signed in as <strong>{customerUser.name}</strong>
              </div>
              <Link to="/orders" onClick={() => setMenuOpen(false)}>
                MY ORDERS
              </Link>
              <button
                className="text-link mobile-sign-out"
                onClick={() => {
                  customerSignOut();
                  setMenuOpen(false);
                }}
              >
                SIGN OUT
              </button>
            </>
          ) : (
            <Link to="/login" onClick={() => setMenuOpen(false)}>
              SIGN IN / CREATE ACCOUNT
            </Link>
          )}
          <Link to="/shop?saved=1" onClick={() => setMenuOpen(false)}>
            SAVED PIECES ({wishlist.length})
          </Link>
          <p>Considered jewellery. A life well lived.</p>
        </div>
      </Modal>
      <Modal open={searchOpen} onClose={() => setSearchOpen(false)} title="Find your forever piece" className="search-modal">
        <form onSubmit={search} className="search-form">
          <Search size={21} strokeWidth={1.4} />
          <input
            type="search"
            aria-label="Search products"
            placeholder="A name, a material, a little inspiration..."
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            autoFocus
          />
          <button aria-label="Submit search">
            <ArrowRight size={21} />
          </button>
        </form>
        <p className="eyebrow search-label">{query ? `${results.length} SUGGESTED PIECES` : 'A FEW OF OUR FAVOURITES'}</p>
        <div className="search-results">
          {results.map((product) => (
            <Link key={product.id} to={`/product/${product.id}`} onClick={() => setSearchOpen(false)}>
              <img src={product.image} alt={product.name} />
              <div>
                <span>{product.name}</span>
                <small>{product.material}</small>
              </div>
              <span>{money(product.price)}</span>
              <ArrowRight size={16} />
            </Link>
          ))}
          {results.length === 0 && <p className="muted py-6">No pieces found. Try "gold", "pearl", or "ring".</p>}
        </div>
        <Button
          variant="text"
          onClick={() => {
            navigate(`/shop?q=${encodeURIComponent(query)}`);
            setSearchOpen(false);
          }}
        >
          EXPLORE ALL PIECES <ArrowRight size={15} />
        </Button>
      </Modal>
    </>
  );
}

export function Footer() {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const { settings } = useStore();
  const subscribe = (event: FormEvent) => {
    event.preventDefault();
    const subscribers = readStorage<string[]>('aurel.subscribers', []);
    if (!subscribers.includes(email.toLowerCase())) writeStorage('aurel.subscribers', [...subscribers, email.toLowerCase()]);
    setSubscribed(true);
  };
  return <footer className="footer"><div className="footer-main"><div className="footer-brand"><Logo /><p>Jewellery for a life well lived.<br />Made to become part of your story.</p><a href={`mailto:${settings.email}`} className="footer-contact">{settings.email}</a></div><div className="footer-links"><div><p className="eyebrow">EXPLORE</p><Link to="/shop">All Jewellery</Link><Link to="/shop?collection=Signature">The Signature Collection</Link><Link to="/shop?new=1">New Arrivals</Link><Link to="/about">Our Story</Link><Link to="/journal">The Journal</Link></div><div><p className="eyebrow">HERE FOR YOU</p><Link to="/care">Jewellery Care</Link><Link to="/care?topic=delivery">Delivery & Returns</Link><Link to="/orders">Your Orders</Link><Link to="/care?topic=sizing">Size Guide</Link><a href={`mailto:${settings.email}`}>Get in Touch</a></div></div><div className="footer-newsletter"><p className="eyebrow">LET SOMETHING BEAUTIFUL FIND YOU</p><h3>The Aurel letter.</h3><p>New chapters, considered stories, and a little inspiration.</p>{subscribed ? <div className="newsletter-success" role="status">You're on the list. Welcome to our world.</div> : <form onSubmit={subscribe}><label className="sr-only" htmlFor="newsletter-email">Your email address</label><input id="newsletter-email" type="email" required placeholder="Your email address" value={email} onChange={(event) => setEmail(event.target.value)} /><button type="submit" aria-label="Subscribe to the Aurel letter"><ArrowRight size={21} strokeWidth={1.4} /></button></form>}<small>Thoughtful notes, never too often. Demo signup, saved locally.</small></div></div><div className="footer-bottom"><span>&copy; {new Date().getFullYear()} AUREL FINE JEWELLERY</span><div><Link to="/care?topic=privacy">Privacy</Link><Link to="/care?topic=terms">Terms</Link><Link to="/admin">Atelier Admin <ArrowRight size={12} /></Link></div><span>CRAFTED WITH INTENTION.</span></div></footer>;
}

export default function StoreLayout() {
  return <><a className="skip-link" href="#main-content">Skip to content</a><Navbar /><main id="main-content"><PageTransition><Outlet /></PageTransition></main><Footer /></>;
}
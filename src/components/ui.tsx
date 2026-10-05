import { useEffect, useId, useRef, useState, type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Link, type LinkProps } from 'react-router-dom';
import { AnimatePresence, motion, useMotionValue, useReducedMotion, useSpring } from 'framer-motion';
import { ArrowRight, Check, ChevronDown, Minus, Plus, X } from 'lucide-react';
import { useUI } from '../contexts/UIContext';

export function Logo({ compact = false, light = false }: { compact?: boolean; light?: boolean }) {
  return <Link to="/" className={`wordmark ${compact ? 'wordmark-compact' : ''} ${light ? 'wordmark-light' : ''}`} aria-label="Aurel homepage">
    <span>AUREL<span className="wordmark-dot">.</span></span>
    {!compact && <small>FINE JEWELLERY</small>}
  </Link>;
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'outline' | 'text'; loading?: boolean; children: ReactNode };
export function Button({ variant = 'primary', loading, children, className = '', disabled, ...props }: ButtonProps) {
  return <button type="button" className={`button button-${variant} ${className}`} disabled={disabled || loading} {...props}>
    {loading ? <span className="button-spinner" aria-hidden="true" /> : null}{children}
  </button>;
}

export function ButtonLink({ variant = 'primary', children, className = '', ...props }: LinkProps & { variant?: 'primary' | 'outline' | 'text' }) {
  return <Link className={`button button-${variant} ${className}`} {...props}>{children}</Link>;
}

export function MagneticLink({ children, to, className = '' }: { children: ReactNode; to: string; className?: string }) {
  const reduceMotion = useReducedMotion();
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, { stiffness: 220, damping: 20 });
  const springY = useSpring(y, { stiffness: 220, damping: 20 });
  return <motion.div className={`magnetic-wrap ${className}`} style={{ x: springX, y: springY }}
    onMouseMove={(event) => {
      if (reduceMotion || !window.matchMedia('(pointer: fine)').matches) return;
      const rect = event.currentTarget.getBoundingClientRect();
      x.set((event.clientX - rect.left - rect.width / 2) * 0.12);
      y.set((event.clientY - rect.top - rect.height / 2) * 0.16);
    }} onMouseLeave={() => { x.set(0); y.set(0); }}>
    <Link to={to} className="button button-primary">{children}<ArrowRight size={16} strokeWidth={1.4} /></Link>
  </motion.div>;
}

let overlayCount = 0;

export function Modal({ open, onClose, title, children, className = '', drawer = false }: {
  open: boolean; onClose: () => void; title: string; children: ReactNode; className?: string; drawer?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  const id = useId();
  const reducedMotion = useReducedMotion();
  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    overlayCount += 1;
    document.documentElement.style.overflow = 'hidden';
    const root = document.getElementById('root');
    if (root) root.inert = true;
    window.dispatchEvent(new CustomEvent('aurel:scroll-lock', { detail: true }));
    const timer = window.setTimeout(() => {
      const target = ref.current?.querySelector<HTMLElement>('input:not([type="checkbox"]):not([type="radio"]), textarea, select') ?? ref.current?.querySelector<HTMLElement>('button, a');
      (target ?? ref.current)?.focus();
    }, 60);
    const keydown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeRef.current();
      if (event.key !== 'Tab' || !ref.current) return;
      const focusable = Array.from(ref.current.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), input:not([disabled]), select, textarea, [tabindex="0"]')).filter((node) => node.getClientRects().length);
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    };
    document.addEventListener('keydown', keydown);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener('keydown', keydown);
      overlayCount -= 1;
      if (overlayCount === 0) {
        document.documentElement.style.overflow = '';
        if (root) root.inert = false;
        window.dispatchEvent(new CustomEvent('aurel:scroll-lock', { detail: false }));
        previous?.focus({ preventScroll: true });
      }
    };
  }, [open]);
  return createPortal(<AnimatePresence>
    {open && <motion.div className={`modal-layer ${drawer ? 'drawer-layer' : ''}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.22 }}>
      <button type="button" className="modal-backdrop" onClick={onClose} aria-label="Close dialog" tabIndex={-1} />
      <motion.div ref={ref} role="dialog" aria-modal="true" aria-labelledby={id} tabIndex={-1} data-lenis-prevent
        className={`modal-panel ${drawer ? 'drawer-panel' : ''} ${className}`}
        initial={reducedMotion ? { opacity: 0 } : drawer ? { x: '100%' } : { y: 24, opacity: 0 }}
        animate={{ x: 0, y: 0, opacity: 1 }} exit={drawer ? { x: '100%' } : { y: 15, opacity: 0 }}
        transition={{ duration: reducedMotion ? 0.1 : 0.4, ease: [0.22, 1, 0.36, 1] }}>
        <div className="modal-heading"><h2 id={id}>{title}</h2><button className="icon-button" onClick={onClose} aria-label="Close dialog"><X size={22} strokeWidth={1.4} /></button></div>
        {children}
      </motion.div>
    </motion.div>}
  </AnimatePresence>, document.body);
}

export function Field({ label, className = '', ...props }: InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  const id = useId();
  return <label className={`field ${className}`} htmlFor={props.id ?? id}><span>{label}</span><input id={id} {...props} /></label>;
}

export function Quantity({ value, onDecrease, onIncrease, max = 10 }: { value: number; onDecrease: () => void; onIncrease: () => void; max?: number }) {
  return <div className="quantity-control"><button type="button" onClick={onDecrease} disabled={value <= 1} aria-label="Decrease quantity"><Minus size={13} /></button><span aria-live="polite">{value}</span><button type="button" onClick={onIncrease} disabled={value >= max} aria-label="Increase quantity"><Plus size={13} /></button></div>;
}

export function Badge({ children, status }: { children?: ReactNode; status: string }) {
  return <span className={`status-badge status-${status.toLowerCase().replace(/\s/g, '-')}`}><span />{children ?? status}</span>;
}

export function Accordion({ title, children, defaultOpen = false }: { title: string; children: ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  const id = useId();
  return <div className="accordion"><button onClick={() => setOpen(!open)} aria-expanded={open} aria-controls={id}>{title}<ChevronDown size={16} className={open ? 'rotated' : ''} /></button><AnimatePresence initial={false}>{open && <motion.div id={id} initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }}><div className="accordion-content">{children}</div></motion.div>}</AnimatePresence></div>;
}

export function SectionHeading({ eyebrow, title, description, action }: { eyebrow: string; title: ReactNode; description?: string; action?: ReactNode }) {
  return <div className="section-heading" data-reveal><div><p className="eyebrow">{eyebrow}</p><h2>{title}</h2>{description && <p className="section-description">{description}</p>}</div>{action}</div>;
}

export function EmptyState({ title, description, children }: { title: string; description: string; children?: ReactNode }) {
  return <div className="empty-state"><div className="asterisk" aria-hidden="true">*</div><h2>{title}</h2><p>{description}</p>{children}</div>;
}

export function SuccessMark() {
  return <div className="success-mark"><motion.svg viewBox="0 0 52 52" aria-hidden="true"><motion.circle cx="26" cy="26" r="24" fill="none" stroke="currentColor" strokeWidth="1" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.7 }} /><motion.path d="m15 26 7 7 15-16" fill="none" stroke="currentColor" strokeWidth="1.6" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.45, delay: 0.4 }} /></motion.svg></div>;
}

export function Toasts() {
  const { toasts, dismissToast } = useUI();
  return createPortal(<div className="toast-stack" aria-live="polite" aria-atomic="false"><AnimatePresence>{toasts.map((toast) => <motion.div key={toast.id} className="toast" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -30 }}><Check size={17} /><span>{toast.message}</span><button onClick={() => dismissToast(toast.id)} aria-label="Dismiss notification"><X size={15} /></button></motion.div>)}</AnimatePresence></div>, document.body);
}
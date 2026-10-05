import { useEffect, useLayoutEffect, useRef, useState, type ReactNode, type RefObject } from 'react';
import { useLocation } from 'react-router-dom';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import 'lenis/dist/lenis.css';
import { readStorage, writeStorage } from '../lib/storage';

gsap.registerPlugin(ScrollTrigger);

export function SmoothScroll() {
  const { pathname, hash } = useLocation();
  const instance = useRef<Lenis | null>(null);
  useEffect(() => {
    const lenis = new Lenis({ autoRaf: false, duration: 1.1, smoothWheel: true, syncTouch: false, anchors: true });
    instance.current = lenis;
    lenis.on('scroll', ScrollTrigger.update);
    const tick = (time: number) => lenis.raf(time * 1000);
    const lock = (event: Event) => (event as CustomEvent<boolean>).detail ? lenis.stop() : lenis.start();
    const linkNavigation = (event: MouseEvent) => {
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      if (!(event.target instanceof Element)) return;
      const anchor = event.target.closest<HTMLAnchorElement>('a[href]');
      if (anchor?.getAttribute('href')?.startsWith('/') && anchor.target !== '_blank') lenis.scrollTo(0, { immediate: true, force: true });
    };
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);
    window.addEventListener('aurel:scroll-lock', lock);
    document.addEventListener('click', linkNavigation, true);
    return () => {
      gsap.ticker.remove(tick);
      lenis.off('scroll', ScrollTrigger.update);
      window.removeEventListener('aurel:scroll-lock', lock);
      document.removeEventListener('click', linkNavigation, true);
      lenis.destroy();
      instance.current = null;
    };
  }, []);
  useLayoutEffect(() => {
    instance.current?.scrollTo(0, { immediate: true, force: true });
    window.scrollTo(0, 0);
    const timer = window.setTimeout(() => {
      ScrollTrigger.refresh();
      if (hash) {
        const target = document.getElementById(decodeURIComponent(hash.slice(1)));
        if (target) instance.current?.scrollTo(target, { immediate: true, offset: -95 });
      }
    }, 100);
    return () => window.clearTimeout(timer);
  }, [pathname, hash]);
  return null;
}

export function PageTransition({ children }: { children: ReactNode }) {
  const location = useLocation();
  const ref = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const ctx = gsap.context(() => gsap.fromTo(ref.current, { opacity: 0.6 }, { opacity: 1, duration: 0.45, ease: 'power2.out', clearProps: 'opacity' }), ref);
    return () => ctx.revert();
  }, [location.pathname]);
  return <div ref={ref}>{children}</div>;
}

export function useScrollReveal(ref: RefObject<HTMLElement | null>, dependency?: string) {
  useLayoutEffect(() => {
    const media = gsap.matchMedia();
    media.add('(prefers-reduced-motion: no-preference)', () => {
      const ctx = gsap.context(() => {
        gsap.utils.toArray<HTMLElement>('[data-reveal]').forEach((element) => {
          gsap.fromTo(element, { y: 32, opacity: 0 }, { y: 0, opacity: 1, duration: 0.9, ease: 'power3.out', scrollTrigger: { trigger: element, start: 'top 94%', once: true } });
        });
      }, ref);
      return () => ctx.revert();
    });
    return () => media.revert();
  }, [ref, dependency]);
}

export function Preloader() {
  const [show, setShow] = useState(() => !readStorage('aurel.intro', false, sessionStorage) && window.location.pathname === '/');
  const root = useRef<HTMLDivElement>(null);
  const number = useRef<HTMLSpanElement>(null);
  useLayoutEffect(() => {
    if (!show) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const progress = { value: 0 };
    const ctx = gsap.context(() => {
      const timeline = gsap.timeline({ onComplete: () => { writeStorage('aurel.intro', true, sessionStorage); setShow(false); } });
      timeline.to(progress, { value: 100, duration: reduced ? 0.1 : 0.95, ease: 'power1.inOut', onUpdate: () => { if (number.current) number.current.textContent = String(Math.round(progress.value)).padStart(2, '0'); } })
        .fromTo('.preloader-line span', { scaleX: 0 }, { scaleX: 1, duration: reduced ? 0.1 : 0.95, ease: 'power1.inOut' }, 0)
        .to('.preloader-content', { scale: 0.93, opacity: 0, duration: reduced ? 0.1 : 0.3 })
        .to(root.current, { yPercent: -100, duration: reduced ? 0.1 : 0.6, ease: 'power3.inOut' }, '-=0.12');
    }, root);
    return () => ctx.revert();
  }, [show]);
  if (!show) return null;
  return <div ref={root} className="preloader" aria-label="Loading Aurel"><div className="preloader-content"><div className="preloader-logo">AUREL.</div><p className="eyebrow">CRAFTED WITH INTENTION</p><div className="preloader-line"><span /></div><p className="preloader-progress"><span ref={number}>00</span><span>%</span></p></div></div>;
}
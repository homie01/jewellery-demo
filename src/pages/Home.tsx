import { useLayoutEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ArrowDownRight, ArrowRight, ArrowUpRight, ChevronLeft, ChevronRight } from 'lucide-react';
import gsap from 'gsap';
import { categories } from '../data/products';
import { useStore } from '../contexts/CommerceContext';
import { readStorage } from '../lib/storage';
import { MagneticLink, SectionHeading } from '../components/ui';
import { ProductCard } from '../components/ProductCard';
import { useScrollReveal } from '../components/Motion';

export default function Home() {
  const root = useRef<HTMLDivElement>(null);
  const categoryTrack = useRef<HTMLDivElement>(null);
  const { catalog } = useStore();
  useScrollReveal(root);
  useLayoutEffect(() => {
    const media = gsap.matchMedia();
    media.add('(prefers-reduced-motion: no-preference)', () => {
      const delay = readStorage('aurel.intro', false, sessionStorage) || !document.querySelector('.preloader') ? 0.05 : 1.4;
      const ctx = gsap.context(() => {
        gsap.fromTo('[data-hero]', { y: 35, opacity: 0 }, { y: 0, opacity: 1, stagger: 0.12, duration: 1.15, delay, ease: 'power3.out' });
        gsap.fromTo('.hero-image', { scale: 1.045 }, { scale: 1, duration: 2.2, delay: delay - 0.05, ease: 'power2.out' });
        gsap.to('.hero-image-plane', { yPercent: 9, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
        gsap.to('.marquee-track', { xPercent: -50, duration: 38, ease: 'none', repeat: -1 });
        gsap.utils.toArray<HTMLElement>('.category-image').forEach((image) => {
          gsap.fromTo(image, { clipPath: 'inset(9% 0 9% 0)' }, { clipPath: 'inset(0% 0 0% 0)', duration: 1.2, ease: 'power3.out', scrollTrigger: { trigger: image, start: 'top 94%', once: true } });
        });
        gsap.fromTo('.story-photo img', { yPercent: -5, scale: 1.12 }, { yPercent: 5, ease: 'none', scrollTrigger: { trigger: '.story-section', start: 'top bottom', end: 'bottom top', scrub: true } });
      }, root);
      return () => ctx.revert();
    });
    return () => media.revert();
  }, []);
  const scrollCategories = (direction: number) => categoryTrack.current?.scrollBy({ left: categoryTrack.current.clientWidth * 0.65 * direction, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
  return <div ref={root}>
    <section className="hero" aria-labelledby="hero-title">
      <div className="hero-image-plane"><img className="hero-image" src="/images/aurel-hero.jpg" alt="Sculptural 18K gold and diamond bands resting on warm ivory travertine" fetchPriority="high" width="1568" height="882" /></div>
      <div className="hero-wash" />
      <div className="hero-copy"><p className="eyebrow hero-eyebrow" data-hero>THE ART OF TIMELESS BEAUTY</p><h1 id="hero-title" className="hero-wordmark" data-hero>AUREL<span>.</span></h1><h2 data-hero>Jewellery that lives<br />beyond <em>the moment.</em></h2><p className="hero-description" data-hero>Meticulously crafted pieces.<br className="mobile-only" /> A lifetime of stories to tell.</p><div className="hero-actions" data-hero><MagneticLink to="/shop">EXPLORE THE COLLECTION</MagneticLink><Link to="/about" className="story-link">DISCOVER OUR STORY <ArrowUpRight size={15} strokeWidth={1.4} /></Link></div></div>
    </section>
    <div className="marquee" aria-label="Crafted with precision. Timeless by design. Exceptional in every detail. Made to be remembered."><div className="marquee-track" aria-hidden="true">{[0, 1].map((repeat) => <div className="marquee-set" key={repeat}>{['CRAFTED WITH PRECISION', 'TIMELESS BY DESIGN', 'EXCEPTIONAL IN EVERY DETAIL', 'MADE TO BE REMEMBERED'].map((text) => <span key={text}>{text}<svg width="13" height="13" viewBox="0 0 20 20" fill="none"><path d="M10 0c0 7-3 10-10 10 7 0 10 3 10 10 0-7 3-10 10-10-7 0-10-3-10-10Z" fill="currentColor" /></svg></span>)}</div>)}</div></div>
    <section className="section-space category-section" aria-labelledby="category-heading"><div className="section-heading" data-reveal><div><p className="eyebrow">FIND YOUR FOREVER</p><h2 id="category-heading">Little things. <em>Lasting feelings.</em></h2></div><div className="category-controls"><button className="circle-control" onClick={() => scrollCategories(-1)} aria-label="Previous categories"><ChevronLeft size={18} strokeWidth={1.3} /></button><button className="circle-control" onClick={() => scrollCategories(1)} aria-label="More categories"><ChevronRight size={18} strokeWidth={1.3} /></button></div></div><div className="category-track" ref={categoryTrack} data-lenis-prevent-horizontal>{categories.map((category, index) => <Link className="category-tile" to={`/shop?${category.query}`} key={category.name} data-reveal><div className="category-image"><img src={category.image} alt={`${category.name} from Aurel`} loading="lazy" width="800" height="800" /><span className="category-hover-arrow"><ArrowUpRight size={24} strokeWidth={1.1} /></span></div><div className="category-caption"><h3>{category.name}</h3><span>0{index + 1}</span></div><p>{category.note}</p></Link>)}</div></section>
    <section className="signature-section section-space"><SectionHeading eyebrow="THE SIGNATURE COLLECTION" title={<>Some things are <em>simply forever.</em></>} description="A considered collection of pieces designed for every chapter." action={<Link to="/shop?collection=Signature" className="text-link">EXPLORE THE EDIT <ArrowRight size={17} strokeWidth={1.3} /></Link>} /><div className="signature-grid">{catalog.filter((product) => product.featured).map((product, index) => <div key={product.id} data-reveal className={`signature-item signature-item-${index + 1}`}><ProductCard product={product} /></div>)}</div></section>
    <section className="story-section"><div className="story-photo"><img src="/images/aurel-story.jpg" alt="Aurel gold jewellery, worn close to the heart" loading="lazy" width="864" height="1152" /></div><div className="story-copy" data-reveal><p className="eyebrow">MORE THAN SOMETHING BEAUTIFUL</p><h2>Made with intention.<br />Worn with <em>feeling.</em></h2><div className="story-rule" /><p>We believe the most precious things aren't just worn. They're lived in. They hold a memory, mark a beginning, and become a part of who you are.</p><p>From the first sketch to the final polish, every Aurel piece is an expression of thoughtful design and patient craftsmanship.</p><Link to="/about" className="text-link">MEET THE WORLD OF AUREL <ArrowUpRight size={17} strokeWidth={1.4} /></Link><span className="story-signature">Always, Aurel.</span></div></section>
    <section className="journal-preview section-space"><SectionHeading eyebrow="NOTES FROM OUR WORLD" title={<>A little <em>inspiration.</em></>} action={<Link to="/journal" className="text-link">THE JOURNAL <ArrowRight size={17} strokeWidth={1.3} /></Link>} /><div className="journal-preview-grid"><Link to="/journal/the-art-of-everyday" className="journal-preview-feature" data-reveal><img src="/images/aurel-story.jpg" alt="The art of wearing fine gold every day" loading="lazy" /><div><p className="eyebrow">THE ART OF LIVING</p><h3>Your everyday deserves<br />a little extraordinary.</h3><span className="text-link">READ THE STORY <ArrowUpRight size={16} /></span></div></Link><div className="journal-notes"><Link to="/journal/a-modern-heirloom" data-reveal><span className="eyebrow">01 / CRAFT & CULTURE</span><h3>What makes a<br /><em>modern heirloom?</em></h3><ArrowDownRight size={26} strokeWidth={1} /></Link><Link to="/journal/forever-in-your-care" data-reveal><span className="eyebrow">02 / THE CARE GUIDE</span><h3>Keep your beautiful<br /><em>things beautiful.</em></h3><ArrowDownRight size={26} strokeWidth={1} /></Link></div></div></section>
    <section className="closing-note" data-reveal><span className="asterisk" aria-hidden="true">*</span><p className="eyebrow">NOT JUST FOR AN OCCASION. FOR A LIFETIME.</p><h2>Your story. <em>Set in gold.</em></h2><MagneticLink to="/shop">FIND YOUR AUREL</MagneticLink></section>
  </div>;
}
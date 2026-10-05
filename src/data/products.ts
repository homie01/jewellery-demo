import type { Product } from '../types';

export const products: Product[] = [
  {
    id: 'celeste-diamond-ring', name: 'Celeste Diamond Ring', category: 'Rings', price: 24999,
    image: '/images/celeste-ring.jpg', collection: 'Signature', material: 'Gold & Diamond',
    description: 'A quiet kind of brilliance. A natural solitaire diamond rests in a delicate six-prong setting, held by a fine 18K gold band. Made for the moments you never want to forget.',
    weight: '4.2 g', stone: 'Natural diamond, 0.30 ct', sizes: ['10', '12', '14', '16', '18'], available: true, featured: true,
  },
  {
    id: 'aurelia-gold-necklace', name: 'Aurelia Gold Necklace', category: 'Necklaces', price: 32900,
    image: '/images/aurelia-necklace.jpg', collection: 'Signature', material: '18K Gold',
    description: 'An organic, golden teardrop suspended from a whisper-fine chain. Inspired by sunlight on still water, Aurelia brings a little warmth to the everyday.',
    weight: '5.8 g', stone: 'Solid gold', sizes: ['16 inches', '18 inches', '20 inches'], available: true, featured: true, isNew: true,
  },
  {
    id: 'elara-pearl-earrings', name: 'Elara Pearl Earrings', category: 'Earrings', price: 18400,
    image: '/images/elara-earrings.jpg', collection: 'The Pearl Edit', material: 'Gold & Pearl',
    description: 'No two pearls are quite alike. Lustrous freshwater pearls meet gently sculpted gold in a pair of earrings that celebrates the beauty of being yourself.',
    weight: '3.6 g', stone: 'Freshwater baroque pearls', sizes: ['One size'], available: true, featured: true,
  },
  {
    id: 'solene-gold-bracelet', name: 'Solene Gold Bracelet', category: 'Bracelets', price: 38750,
    image: '/images/solene-bracelet.jpg', collection: 'Everyday Heirlooms', material: '18K Gold',
    description: 'Fluid, sculptural links catch the light with every gesture. Solene is a contemporary heirloom: beautifully substantial, effortlessly wearable, unmistakably yours.',
    weight: '7.2 g', stone: 'Solid gold', sizes: ['Small', 'Medium', 'Large'], available: true, featured: true, isNew: true,
  },
  {
    id: 'elan-diamond-pendant', name: 'Elan Diamond Pendant', category: 'Necklaces', price: 27500,
    image: '/images/elan-pendant.jpg', collection: 'Signature', material: 'Gold & Diamond',
    description: 'The simplest expression of light. A brilliant-cut diamond, framed in warm gold, floats on a delicate chain. An intimate piece to keep close, always.',
    weight: '3.1 g', stone: 'Natural diamond, 0.25 ct', sizes: ['16 inches', '18 inches'], available: true, isNew: true,
  },
  {
    id: 'aria-gold-bangle', name: 'Aria Gold Bangle', category: 'Bangles', price: 45900,
    image: '/images/aria-bangle.jpg', collection: 'Everyday Heirlooms', material: '18K Gold',
    description: 'An unbroken line, a beautiful possibility. Hand-finished curves and a single diamond detail turn this sculptural gold cuff into a personal signature.',
    weight: '8.4 g', stone: 'Diamond accent, 0.02 ct', sizes: ['2.2', '2.4', '2.6', '2.8'], available: true, isNew: true,
  },
  {
    id: 'celeste-pearl-ring', name: 'Celeste Pearl Ring', category: 'Rings', price: 16900,
    image: '/images/celeste-pearl.jpg', collection: 'The Pearl Edit', material: 'Gold & Pearl',
    description: 'A luminous pearl and a tiny diamond meet in an open embrace. The softly curved gold band is a study in balance, lightness, and effortless elegance.',
    weight: '3.2 g', stone: 'Freshwater pearl & diamond', sizes: ['Adjustable'], available: true,
  },
  {
    id: 'aurelia-diamond-earrings', name: 'Aurelia Diamond Earrings', category: 'Earrings', price: 28900,
    image: '/images/aurelia-earrings.jpg', collection: 'Signature', material: 'Gold & Diamond',
    description: 'A fine line of natural diamonds follows the curve of polished gold. These intimate, close-fitting hoops move effortlessly from your everyday to your extraordinary.',
    weight: '4.1 g', stone: 'Pave diamonds, 0.20 ct', sizes: ['One size'], available: true,
  },
  {
    id: 'solene-petite-bracelet', name: 'Solene Petite Bracelet', category: 'Bracelets', price: 25900,
    image: '/images/solene-bracelet.jpg', collection: 'Everyday Heirlooms', material: '18K Gold',
    description: 'Our signature Solene links, reimagined in a lighter weight. A considered finishing touch, lovely alone or layered with the pieces that tell your story.',
    weight: '4.8 g', stone: 'Solid gold', sizes: ['Small', 'Medium'], available: true,
  },
  {
    id: 'elan-grand-pendant', name: 'Elan Grand Pendant', category: 'Necklaces', price: 54900,
    image: '/images/elan-pendant.jpg', collection: 'Signature', material: 'Gold & Diamond',
    description: 'A bolder expression of our beloved Elan. A half-carat natural diamond is cradled in a fine gold bezel, a lasting celebration of your most meaningful chapters.',
    weight: '4.6 g', stone: 'Natural diamond, 0.50 ct', sizes: ['18 inches', '20 inches'], available: false,
  },
];

export const categories = [
  { name: 'Rings', image: '/images/celeste-ring.jpg', query: 'category=Rings', note: 'A promise, beautifully kept.' },
  { name: 'Necklaces', image: '/images/aurelia-necklace.jpg', query: 'category=Necklaces', note: 'Always close to your heart.' },
  { name: 'Earrings', image: '/images/elara-earrings.jpg', query: 'category=Earrings', note: 'A little light, every day.' },
  { name: 'Bracelets', image: '/images/solene-bracelet.jpg', query: 'category=Bracelets', note: 'For every graceful gesture.' },
  { name: 'Bangles', image: '/images/aria-bangle.jpg', query: 'category=Bangles', note: 'An endless kind of beauty.' },
  { name: 'New Arrivals', image: '/images/aurelia-earrings.jpg', query: 'new=1', note: 'Your next forever piece.' },
];

export const findProduct = (id: string) => products.find((product) => product.id === id);
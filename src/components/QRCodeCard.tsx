import { QRCodeSVG } from 'qrcode.react';
import { Check, Copy, ExternalLink, ShieldCheck } from 'lucide-react';
import { cardUrl, useClipboard } from '../lib/storage';
import { useUI } from '../contexts/UIContext';
import { Button, ButtonLink } from './ui';

export default function QRCodeCard({ cardId, actions = true }: { cardId: string; actions?: boolean }) {
  const url = cardUrl(cardId);
  const { copy, copied } = useClipboard();
  const { toast } = useUI();
  return <div className="qr-code-card"><div className="qr-code-frame"><QRCodeSVG value={url} size={180} level="M" marginSize={4} bgColor="#fffdf9" fgColor="#51412c" title={`Protected purchase card ${cardId}`} /></div><p className="eyebrow">A SMALL CODE. A LASTING CONNECTION.</p><p>Scan to open the verification page.<br />Customer details remain protected by the demo passcode.</p>{actions && <><div className="qr-link-field"><label htmlFor={`link-${cardId}`}>PROTECTED CARD LINK</label><input id={`link-${cardId}`} readOnly value={url} onFocus={(event) => event.target.select()} /></div><div className="qr-actions"><Button variant="outline" onClick={async () => { if (!await copy(url)) toast('Please select and copy the link above.'); }}>{copied ? <Check size={14} /> : <Copy size={14} />}{copied ? 'LINK COPIED' : 'COPY LINK'}</Button><ButtonLink to={`/card/${cardId}`} target="_blank" rel="noopener noreferrer">VIEW CARD <ExternalLink size={14} /></ButtonLink></div></>}<span className="qr-privacy"><ShieldCheck size={13} /> No customer data is encoded in this QR.</span></div>;
}
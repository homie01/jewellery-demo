import type { PaymentMethod } from '../types';

const delay = (ms: number) => new Promise<void>((resolve) => window.setTimeout(resolve, ms));

// Replace these adapters with server endpoints before handling real customer data.
export const demoAuthService = {
  async signIn(email: string, password: string) {
    await delay(650);
    return email.trim().toLowerCase() === 'admin@jewellerydemo.com' && password === 'admin123';
  },
};

export const demoOtpService = {
  async verify(cardId: string, passcode: string) {
    await delay(650);
    return Boolean(cardId) && passcode === '123456';
  },
};

export const demoPaymentService = {
  async authorize(method: PaymentMethod) {
    await delay(1200);
    return { success: true, status: method === 'Cash on Delivery' ? 'Pending' as const : 'Paid' as const };
  },
};
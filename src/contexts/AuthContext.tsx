import { createContext, useContext, useState, type ReactNode } from 'react';
import { readStorage, writeStorage } from '../lib/storage';
import { demoAuthService } from '../services/demo';
import type { CustomerUser, CustomerSignUpData } from '../types';

export interface StoredCustomerAccount extends CustomerUser {
  password?: string;
}

const defaultDemoUser: StoredCustomerAccount = {
  id: 'CUST-VIP-001',
  name: 'Rahul Patel',
  email: 'rahul@example.com',
  phone: '9876543210',
  password: 'password123',
  address: '24, Riverfront Residences, Adajan',
  city: 'Surat',
  state: 'Gujarat',
  pincode: '395009',
};

interface AuthValue {
  // Admin authentication
  authenticated: boolean;
  signIn: (email: string, password: string) => Promise<boolean>;
  signOut: () => void;

  // Customer authentication
  customerUser: CustomerUser | null;
  customerSignIn: (email: string, password: string) => Promise<{ success: boolean; message?: string }>;
  customerSignUp: (data: CustomerSignUpData) => Promise<{ success: boolean; message?: string }>;
  customerSignOut: () => void;
  updateCustomerUser: (data: Partial<CustomerUser>) => void;
}

const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  // Admin state
  const [authenticated, setAuthenticated] = useState(() => readStorage('aurel.admin', false, sessionStorage));

  // Customer state
  const [customerUser, setCustomerUser] = useState<CustomerUser | null>(() => readStorage<CustomerUser | null>('aurel.customer_user', null));

  const signIn = async (email: string, password: string) => {
    const valid = await demoAuthService.signIn(email, password);
    if (valid) {
      setAuthenticated(true);
      writeStorage('aurel.admin', true, sessionStorage);
    }
    return valid;
  };

  const signOut = () => {
    setAuthenticated(false);
    writeStorage('aurel.admin', false, sessionStorage);
  };

  // Customer Auth Methods
  const getRegisteredCustomers = (): StoredCustomerAccount[] => {
    const saved = readStorage<StoredCustomerAccount[]>('aurel.registered_customers', []);
    if (!saved.some((user) => user.email.toLowerCase() === defaultDemoUser.email.toLowerCase())) {
      const initial = [defaultDemoUser, ...saved];
      writeStorage('aurel.registered_customers', initial);
      return initial;
    }
    return saved;
  };

  const customerSignIn = async (email: string, password: string) => {
    await new Promise((r) => setTimeout(r, 500)); // Smooth loading simulation
    const trimmedEmail = email.trim().toLowerCase();
    const registered = getRegisteredCustomers();
    const found = registered.find((user) => user.email.toLowerCase() === trimmedEmail);

    if (!found) {
      return { success: false, message: 'No account found with this email address. Please check or sign up.' };
    }

    if (found.password && found.password !== password) {
      return { success: false, message: 'Incorrect password. Please try again.' };
    }

    const userProfile: CustomerUser = {
      id: found.id,
      name: found.name,
      email: found.email,
      phone: found.phone,
      address: found.address,
      city: found.city,
      state: found.state,
      pincode: found.pincode,
    };

    setCustomerUser(userProfile);
    writeStorage('aurel.customer_user', userProfile);
    return { success: true };
  };

  const customerSignUp = async (data: CustomerSignUpData) => {
    await new Promise((r) => setTimeout(r, 600)); // Smooth loading simulation
    const trimmedEmail = data.email.trim().toLowerCase();
    const registered = getRegisteredCustomers();

    if (registered.some((user) => user.email.toLowerCase() === trimmedEmail)) {
      return { success: false, message: 'An account with this email address already exists. Please sign in.' };
    }

    const newCustomerAccount: StoredCustomerAccount = {
      id: `CUST-${Date.now().toString(36).toUpperCase()}`,
      name: data.name.trim(),
      email: trimmedEmail,
      phone: data.phone.trim(),
      password: data.password || 'password123',
      address: data.address?.trim() || '',
      city: data.city?.trim() || '',
      state: data.state?.trim() || '',
      pincode: data.pincode?.trim() || '',
    };

    const updatedList = [newCustomerAccount, ...registered];
    writeStorage('aurel.registered_customers', updatedList);

    const userProfile: CustomerUser = {
      id: newCustomerAccount.id,
      name: newCustomerAccount.name,
      email: newCustomerAccount.email,
      phone: newCustomerAccount.phone,
      address: newCustomerAccount.address,
      city: newCustomerAccount.city,
      state: newCustomerAccount.state,
      pincode: newCustomerAccount.pincode,
    };

    setCustomerUser(userProfile);
    writeStorage('aurel.customer_user', userProfile);
    return { success: true };
  };

  const customerSignOut = () => {
    setCustomerUser(null);
    writeStorage('aurel.customer_user', null);
  };

  const updateCustomerUser = (data: Partial<CustomerUser>) => {
    if (!customerUser) return;
    const updated = { ...customerUser, ...data };
    setCustomerUser(updated);
    writeStorage('aurel.customer_user', updated);

    // Also update in registered list
    const registered = getRegisteredCustomers();
    const updatedList = registered.map((user) => (user.id === updated.id ? { ...user, ...data } : user));
    writeStorage('aurel.registered_customers', updatedList);
  };

  return (
    <AuthContext.Provider
      value={{
        authenticated,
        signIn,
        signOut,
        customerUser,
        customerSignIn,
        customerSignUp,
        customerSignOut,
        updateCustomerUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('AuthProvider is required');
  return context;
}
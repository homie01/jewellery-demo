import { useMemo, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Check, History, Plus, Search, ShieldCheck, ShoppingBag, Trash2, UserCheck, UserPlus, Users } from 'lucide-react';
import { useCards, useOrders, useStore } from '../../contexts/CommerceContext';
import { useUI } from '../../contexts/UIContext';
import { money } from '../../lib/storage';
import { AdminPageHeading } from './Dashboard';
import { Button, Field } from '../../components/ui';
import type { Customer, OrderItem, OrderStatus, PaymentMethod, Product } from '../../types';

export default function AdminCreateOrder() {
  const { orders, createManualOrder } = useOrders();
  const { catalog } = useStore();
  const { generateCard } = useCards();
  const { toast } = useUI();
  const navigate = useNavigate();

  // Wizard Step State: 1 = Customer Details, 2 = Select Products, 3 = Review & Complete
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);

  // Extract unique customers from existing orders & demo data
  const existingCustomers = useMemo(() => {
    const customerMap = new Map<string, Customer>();
    orders.forEach((o) => {
      if (o.customer && o.customer.email && !customerMap.has(o.customer.email.toLowerCase())) {
        customerMap.set(o.customer.email.toLowerCase(), o.customer);
      }
    });
    return Array.from(customerMap.values());
  }, [orders]);

  // Customer State: Defaults to 'new' for creating a new customer order
  const [customerMode, setCustomerMode] = useState<'new' | 'existing'>('new');
  const [selectedCustomerEmail, setSelectedCustomerEmail] = useState<string>(
    existingCustomers[0]?.email || ''
  );

  const selectedExistingCustomer = useMemo(() => {
    return existingCustomers.find((c) => c.email.toLowerCase() === selectedCustomerEmail.toLowerCase()) || null;
  }, [existingCustomers, selectedCustomerEmail]);

  // New Customer Form State
  const [newCustomer, setNewCustomer] = useState<Customer>({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
  });

  // Get current active customer object
  const activeCustomer = useMemo<Customer | null>(() => {
    if (customerMode === 'existing') {
      return selectedExistingCustomer;
    }
    return newCustomer;
  }, [customerMode, selectedExistingCustomer, newCustomer]);

  // Items previously purchased by the selected customer
  const customerPastItems = useMemo(() => {
    const emailToMatch = activeCustomer?.email?.toLowerCase();
    if (!emailToMatch) return [];
    const past: Array<{ product: Product; count: number; lastSize: string }> = [];
    const seen = new Set<string>();

    orders
      .filter((o) => o.customer.email.toLowerCase() === emailToMatch && o.status !== 'Cancelled')
      .forEach((o) => {
        o.items.forEach((item) => {
          if (!seen.has(item.productId)) {
            seen.add(item.productId);
            const foundProd = catalog.find((p) => p.id === item.productId);
            if (foundProd) {
              past.push({ product: foundProd, count: item.quantity, lastSize: item.size });
            }
          }
        });
      });
    return past;
  }, [orders, catalog, activeCustomer]);

  // Order Items Draft
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);

  // Product Selector Filter State
  const [productQuery, setProductQuery] = useState('');
  const [productCategory, setProductCategory] = useState('All categories');

  // Selected piece to add (temporary selection state)
  const [selectedProdId, setSelectedProdId] = useState<string>(catalog[0]?.id || '');
  const [selectedProdSize, setSelectedProdSize] = useState<string>('');
  const [selectedProdQty, setSelectedProdQty] = useState<number>(1);

  // Order Settings State
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Credit / Debit Card');
  const [paymentStatus, setPaymentStatus] = useState<'Paid' | 'Pending'>('Paid');
  const [orderStatus, setOrderStatus] = useState<OrderStatus>('Confirmed');
  const [deliveryMethod, setDeliveryMethod] = useState<'Standard' | 'Express'>('Standard');
  const [autoGenerateCard, setAutoGenerateCard] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filter catalog products for search/selector
  const filteredCatalog = useMemo(() => {
    return catalog.filter((product) => {
      const matchesSearch = `${product.name} ${product.material} ${product.category}`
        .toLowerCase()
        .includes(productQuery.toLowerCase());
      const matchesCategory =
        productCategory === 'All categories' || product.category === productCategory;
      return matchesSearch && matchesCategory;
    });
  }, [catalog, productQuery, productCategory]);

  // Handler to add a item to draft
  const addItemToOrder = (product: Product, size?: string, quantity = 1) => {
    const chosenSize = size || product.sizes[0] || 'Standard';
    setOrderItems((current) => {
      const existingIndex = current.findIndex(
        (item) => item.productId === product.id && item.size === chosenSize
      );
      if (existingIndex > -1) {
        const updated = [...current];
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: Math.min(10, updated[existingIndex].quantity + quantity),
        };
        return updated;
      }
      return [
        ...current,
        {
          productId: product.id,
          name: product.name,
          image: product.image,
          price: product.price,
          quantity,
          size: chosenSize,
        },
      ];
    });
    toast(`Added "${product.name}" (${chosenSize}) to order draft.`);
  };

  const updateItemQty = (productId: string, size: string, delta: number) => {
    setOrderItems((current) =>
      current
        .map((item) => {
          if (item.productId === productId && item.size === size) {
            const nextQty = item.quantity + delta;
            return nextQty > 0 ? { ...item, quantity: nextQty } : null;
          }
          return item;
        })
        .filter(Boolean) as OrderItem[]
    );
  };

  const removeItem = (productId: string, size: string) => {
    setOrderItems((current) =>
      current.filter((item) => !(item.productId === productId && item.size === size))
    );
  };

  // Calculations
  const subtotal = orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const shipping = deliveryMethod === 'Express' ? 499 : 0;
  const total = subtotal + shipping;

  // Step 1 Validation
  const validateStep1 = () => {
    if (customerMode === 'existing') {
      if (!selectedExistingCustomer) {
        toast('Please select an existing customer.');
        return false;
      }
    } else {
      if (!newCustomer.name.trim()) {
        toast('Please enter customer full name.');
        return false;
      }
      if (!newCustomer.email.trim()) {
        toast('Please enter customer email address.');
        return false;
      }
      if (!newCustomer.phone.trim()) {
        toast('Please enter customer phone number.');
        return false;
      }
    }
    return true;
  };

  // Step 2 Validation
  const validateStep2 = () => {
    if (orderItems.length === 0) {
      toast('Please select at least one product purchased by the customer.');
      return false;
    }
    return true;
  };

  const handleNextToStep2 = (e?: FormEvent) => {
    if (e) e.preventDefault();
    if (validateStep1()) {
      setCurrentStep(2);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleNextToStep3 = () => {
    if (validateStep2()) {
      setCurrentStep(3);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Final Submission Handler
  const handleFinalSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!validateStep1() || !validateStep2()) return;

    const customerToUse: Customer = customerMode === 'existing' ? selectedExistingCustomer! : newCustomer;

    setIsSubmitting(true);
    try {
      const createdOrder = createManualOrder({
        customer: customerToUse,
        items: orderItems,
        paymentMethod,
        paymentStatus,
        status: orderStatus,
        deliveryMethod,
        owner: 'atelier_admin',
      });

      let cardId = '';
      if (autoGenerateCard || (orderStatus !== 'Pending' && orderStatus !== 'Cancelled')) {
        try {
          const card = generateCard(createdOrder.id);
          cardId = card.id;
        } catch {
          // Card effect will handle if needed
        }
      }

      toast(`Order #${createdOrder.id} created & Digital Business Card generated!`);
      if (cardId) {
        navigate(`/admin/cards/${cardId}`);
      } else {
        navigate(`/admin/orders/${createdOrder.id}`);
      }
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Could not create order.');
      setIsSubmitting(false);
    }
  };

  const activeProductForSelect = catalog.find((p) => p.id === selectedProdId) || catalog[0];

  return (
    <>
      <Link to="/admin/orders" className="admin-back">
        <ArrowLeft size={14} /> ALL ORDERS
      </Link>

      <AdminPageHeading
        eyebrow="ATELIER ORDER CREATION WORKFLOW"
        title="Add Order & Generate Card"
        description="First enter customer details, select products purchased, review settings, and carry out the entire process."
      />

      {/* Step Wizard Progress Bar */}
      <div className="order-wizard-progress">
        <div
          className={`wizard-step-item ${currentStep === 1 ? 'active' : currentStep > 1 ? 'completed' : ''}`}
          onClick={() => {
            if (currentStep > 1) setCurrentStep(1);
          }}
        >
          <div className="wizard-step-circle">{currentStep > 1 ? <Check size={16} /> : '1'}</div>
          <div className="wizard-step-info">
            <strong>1. Customer Details</strong>
            <span>Enter customer info</span>
          </div>
        </div>

        <div className="wizard-step-line" />

        <div
          className={`wizard-step-item ${currentStep === 2 ? 'active' : currentStep > 2 ? 'completed' : ''}`}
          onClick={() => {
            if (currentStep > 2 || (currentStep === 1 && validateStep1())) setCurrentStep(2);
          }}
        >
          <div className="wizard-step-circle">{currentStep > 2 ? <Check size={16} /> : '2'}</div>
          <div className="wizard-step-info">
            <strong>2. Select Products</strong>
            <span>Choose purchased pieces</span>
          </div>
        </div>

        <div className="wizard-step-line" />

        <div className={`wizard-step-item ${currentStep === 3 ? 'active' : ''}`}>
          <div className="wizard-step-circle">3</div>
          <div className="wizard-step-info">
            <strong>3. Review & Complete</strong>
            <span>Generate digital card</span>
          </div>
        </div>
      </div>

      {/* STEP 1: CUSTOMER DETAILS */}
      {currentStep === 1 && (
        <form onSubmit={handleNextToStep2} className="admin-panel wizard-panel">
          <div className="admin-panel-heading">
            <div>
              <h2>Step 1: Enter Customer Information</h2>
              <p>Enter the new customer details or select an existing customer from the database.</p>
            </div>
            <div className="customer-mode-toggle">
              <button
                type="button"
                className={customerMode === 'new' ? 'active' : ''}
                onClick={() => setCustomerMode('new')}
              >
                <UserPlus size={14} /> New Customer
              </button>
              <button
                type="button"
                className={customerMode === 'existing' ? 'active' : ''}
                onClick={() => setCustomerMode('existing')}
              >
                <UserCheck size={14} /> Existing Customer
              </button>
            </div>
          </div>

          <div className="admin-panel-body">
            {customerMode === 'new' ? (
              <div className="form-grid new-customer-form">
                <Field
                  className="form-full"
                  label="Customer Full Name"
                  placeholder="e.g. Ananya Sharma"
                  required
                  value={newCustomer.name}
                  onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
                />
                <Field
                  label="Email Address"
                  type="email"
                  placeholder="ananya@example.com"
                  required
                  value={newCustomer.email}
                  onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}
                />
                <Field
                  label="Phone Number"
                  type="tel"
                  placeholder="+91 98201 23456"
                  required
                  value={newCustomer.phone}
                  onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                />
                <Field
                  className="form-full"
                  label="Shipping / Delivery Address"
                  placeholder="18, Sea View Apartments, Bandra West"
                  required
                  value={newCustomer.address}
                  onChange={(e) => setNewCustomer({ ...newCustomer, address: e.target.value })}
                />
                <Field
                  label="City"
                  placeholder="Mumbai"
                  required
                  value={newCustomer.city}
                  onChange={(e) => setNewCustomer({ ...newCustomer, city: e.target.value })}
                />
                <Field
                  label="State"
                  placeholder="Maharashtra"
                  required
                  value={newCustomer.state}
                  onChange={(e) => setNewCustomer({ ...newCustomer, state: e.target.value })}
                />
                <Field
                  label="Pincode"
                  placeholder="400050"
                  required
                  value={newCustomer.pincode}
                  onChange={(e) => setNewCustomer({ ...newCustomer, pincode: e.target.value })}
                />
              </div>
            ) : (
              <div className="existing-customer-block">
                <label className="field">
                  <span>SELECT CUSTOMER FROM DATABASE</span>
                  <select
                    value={selectedCustomerEmail}
                    onChange={(e) => setSelectedCustomerEmail(e.target.value)}
                    className="admin-select-full"
                  >
                    {existingCustomers.map((c) => (
                      <option key={c.email} value={c.email}>
                        {c.name} — {c.email} ({c.city}, {c.state})
                      </option>
                    ))}
                  </select>
                </label>

                {selectedExistingCustomer && (
                  <div className="selected-customer-card">
                    <div className="customer-avatar-name">
                      <span>
                        {selectedExistingCustomer.name
                          .split(' ')
                          .map((n) => n[0])
                          .slice(0, 2)
                          .join('')}
                      </span>
                      <div>
                        <h3>{selectedExistingCustomer.name}</h3>
                        <p>{selectedExistingCustomer.email} • {selectedExistingCustomer.phone}</p>
                        <small>
                          {selectedExistingCustomer.address}, {selectedExistingCustomer.city},{' '}
                          {selectedExistingCustomer.state} {selectedExistingCustomer.pincode}
                        </small>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="wizard-action-row">
              <Button type="submit" className="wizard-next-btn">
                NEXT: SELECT PRODUCTS <ArrowRight size={16} />
              </Button>
            </div>
          </div>
        </form>
      )}

      {/* STEP 2: SELECT PRODUCTS PURCHASED */}
      {currentStep === 2 && (
        <div className="wizard-step-container">
          {/* Active Customer Summary Bar */}
          <div className="active-customer-banner">
            <div className="customer-banner-info">
              <Users size={18} />
              <div>
                <strong>Customer: {activeCustomer?.name || 'Customer'}</strong>
                <span>{activeCustomer?.email} • {activeCustomer?.city}, {activeCustomer?.state}</span>
              </div>
            </div>
            <button
              type="button"
              className="change-customer-btn"
              onClick={() => setCurrentStep(1)}
            >
              Edit Customer Info
            </button>
          </div>

          {/* Cart / Selected Items Summary Panel */}
          <section className="admin-panel margin-bottom-24">
            <div className="admin-panel-heading">
              <div>
                <h2>Selected Products ({orderItems.reduce((sum, i) => sum + i.quantity, 0)})</h2>
                <p>Products selected for this customer order.</p>
              </div>
              <span className="item-count-badge">Subtotal: {money(subtotal)}</span>
            </div>

            <div className="admin-panel-body">
              {orderItems.length === 0 ? (
                <div className="empty-draft-state">
                  <ShoppingBag size={32} strokeWidth={1.2} />
                  <p>No products added yet.</p>
                  <span>Select items from the catalog below or previous purchases to add to this order.</span>
                </div>
              ) : (
                <div className="draft-items-list">
                  {orderItems.map((item) => (
                    <div key={`${item.productId}-${item.size}`} className="draft-item-row">
                      <img src={item.image} alt={item.name} />
                      <div className="draft-item-details">
                        <h3>{item.name}</h3>
                        <p>Size: {item.size}</p>
                        <span>{money(item.price)} each</span>
                      </div>
                      <div className="draft-item-qty-controls">
                        <button
                          type="button"
                          onClick={() => updateItemQty(item.productId, item.size, -1)}
                          aria-label="Decrease quantity"
                        >
                          -
                        </button>
                        <span>{item.quantity}</span>
                        <button
                          type="button"
                          onClick={() => updateItemQty(item.productId, item.size, 1)}
                          aria-label="Increase quantity"
                        >
                          +
                        </button>
                      </div>
                      <div className="draft-item-subtotal">
                        <strong>{money(item.price * item.quantity)}</strong>
                        <button
                          type="button"
                          className="remove-draft-item-btn"
                          onClick={() => removeItem(item.productId, item.size)}
                          title="Remove product"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>

          {/* Customer's Previous Purchases (If any) */}
          {customerPastItems.length > 0 && (
            <section className="admin-panel margin-bottom-24">
              <div className="admin-panel-heading">
                <div>
                  <h2>Previously Purchased by {activeCustomer?.name}</h2>
                  <p>Click to quick-add pieces this customer previously bought.</p>
                </div>
                <History size={18} />
              </div>
              <div className="admin-panel-body">
                <div className="past-items-grid">
                  {customerPastItems.map(({ product, lastSize }) => (
                    <div key={product.id} className="past-item-card">
                      <img src={product.image} alt={product.name} />
                      <div className="past-item-info">
                        <strong>{product.name}</strong>
                        <span>Size: {lastSize} • {money(product.price)}</span>
                      </div>
                      <button
                        type="button"
                        className="add-past-item-btn"
                        onClick={() => addItemToOrder(product, lastSize, 1)}
                      >
                        <Plus size={13} /> ADD
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* Store Catalog Product Selector */}
          <section className="admin-panel">
            <div className="admin-panel-heading">
              <div>
                <h2>Select Products from Collection</h2>
                <p>Browse products to add to customer&apos;s purchase list.</p>
              </div>
            </div>

            <div className="admin-panel-body">
              {/* Quick Add Dropdown Bar */}
              <div className="quick-add-bar">
                <label className="field flex-1">
                  <span>CHOOSE PRODUCT</span>
                  <select
                    value={selectedProdId}
                    onChange={(e) => {
                      setSelectedProdId(e.target.value);
                      const p = catalog.find((item) => item.id === e.target.value);
                      if (p && p.sizes.length) setSelectedProdSize(p.sizes[0]);
                    }}
                    className="admin-select-full"
                  >
                    {catalog.map((prod) => (
                      <option key={prod.id} value={prod.id}>
                        {prod.name} ({prod.category}) — {money(prod.price)}
                      </option>
                    ))}
                  </select>
                </label>

                {activeProductForSelect && activeProductForSelect.sizes.length > 0 && (
                  <label className="field width-120">
                    <span>SIZE</span>
                    <select
                      value={selectedProdSize || activeProductForSelect.sizes[0]}
                      onChange={(e) => setSelectedProdSize(e.target.value)}
                      className="admin-select-full"
                    >
                      {activeProductForSelect.sizes.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </label>
                )}

                <label className="field width-90">
                  <span>QTY</span>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={selectedProdQty}
                    onChange={(e) => setSelectedProdQty(Math.max(1, Number(e.target.value)))}
                    className="admin-input-full"
                  />
                </label>

                <Button
                  type="button"
                  onClick={() => {
                    if (activeProductForSelect) {
                      addItemToOrder(
                        activeProductForSelect,
                        selectedProdSize || activeProductForSelect.sizes[0],
                        selectedProdQty
                      );
                    }
                  }}
                >
                  <Plus size={15} /> ADD PRODUCT
                </Button>
              </div>

              {/* Grid Product Catalog */}
              <div className="catalog-browser">
                <div className="admin-table-toolbar">
                  <label className="admin-table-search">
                    <Search size={16} strokeWidth={1.3} />
                    <input
                      placeholder="Search product name, category, or material..."
                      value={productQuery}
                      onChange={(e) => setProductQuery(e.target.value)}
                    />
                  </label>
                  <select
                    value={productCategory}
                    onChange={(e) => setProductCategory(e.target.value)}
                  >
                    {[
                      'All categories',
                      'Rings',
                      'Necklaces',
                      'Earrings',
                      'Bracelets',
                      'Bangles',
                    ].map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="catalog-grid">
                  {filteredCatalog.map((product) => (
                    <div key={product.id} className="catalog-product-card">
                      <img src={product.image} alt={product.name} />
                      <div className="catalog-card-details">
                        <span className="catalog-category-tag">{product.category}</span>
                        <h4>{product.name}</h4>
                        <p>{product.material}</p>
                        <strong>{money(product.price)}</strong>
                        <div className="catalog-card-actions">
                          <select
                            className="size-mini-select"
                            id={`size-select-${product.id}`}
                            defaultValue={product.sizes[0]}
                          >
                            {product.sizes.map((sz) => (
                              <option key={sz} value={sz}>
                                {sz}
                              </option>
                            ))}
                          </select>
                          <button
                            type="button"
                            className="add-catalog-btn"
                            onClick={() => {
                              const sizeEl = document.getElementById(
                                `size-select-${product.id}`
                              ) as HTMLSelectElement;
                              addItemToOrder(product, sizeEl?.value || product.sizes[0], 1);
                            }}
                          >
                            <Plus size={13} /> Add
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="wizard-action-row justify-between">
              <Button type="button" variant="outline" onClick={() => setCurrentStep(1)}>
                <ArrowLeft size={16} /> BACK TO CUSTOMER INFO
              </Button>
              <Button type="button" onClick={handleNextToStep3}>
                PROCEED TO REVIEW & GENERATE CARD <ArrowRight size={16} />
              </Button>
            </div>
          </section>
        </div>
      )}

      {/* STEP 3: REVIEW & COMPLETE ENTIRE PROCESS */}
      {currentStep === 3 && (
        <form onSubmit={handleFinalSubmit} className="admin-panel wizard-panel">
          <div className="admin-panel-heading">
            <div>
              <h2>Step 3: Review Order & Complete Process</h2>
              <p>Verify customer details, selected products, payment options, and generate the digital card.</p>
            </div>
            <ShieldCheck size={24} strokeWidth={1.2} />
          </div>

          <div className="admin-panel-body">
            <div className="admin-order-detail-grid">
              {/* Order & Customer Summary */}
              <div className="admin-create-main">
                {/* Customer Summary Card */}
                <div className="selected-customer-card">
                  <div className="customer-avatar-name">
                    <span>
                      {activeCustomer?.name
                        ?.split(' ')
                        .map((n) => n[0])
                        .slice(0, 2)
                        .join('') || 'CU'}
                    </span>
                    <div>
                      <h3>{activeCustomer?.name}</h3>
                      <p>{activeCustomer?.email} • {activeCustomer?.phone}</p>
                      <small>
                        {activeCustomer?.address}, {activeCustomer?.city}, {activeCustomer?.state}{' '}
                        {activeCustomer?.pincode}
                      </small>
                    </div>
                  </div>
                </div>

                {/* Selected Products Table */}
                <div className="review-items-summary">
                  <h3 className="section-subheading">Selected Purchased Products</h3>
                  <div className="draft-items-list">
                    {orderItems.map((item) => (
                      <div key={`${item.productId}-${item.size}`} className="draft-item-row">
                        <img src={item.image} alt={item.name} />
                        <div className="draft-item-details">
                          <h3>{item.name}</h3>
                          <p>Size: {item.size} • Qty: {item.quantity}</p>
                        </div>
                        <div className="draft-item-subtotal">
                          <strong>{money(item.price * item.quantity)}</strong>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Settings & Final Action */}
              <div className="admin-create-sidebar">
                <div className="sidebar-settings-body">
                  <label className="field">
                    <span>ORDER STATUS</span>
                    <select
                      value={orderStatus}
                      onChange={(e) => setOrderStatus(e.target.value as OrderStatus)}
                      className="admin-select-full"
                    >
                      <option value="Confirmed">Confirmed (Default)</option>
                      <option value="Processing">Processing</option>
                      <option value="Pending">Pending Review</option>
                    </select>
                  </label>

                  <label className="field">
                    <span>PAYMENT METHOD</span>
                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                      className="admin-select-full"
                    >
                      <option value="Credit / Debit Card">Credit / Debit Card</option>
                      <option value="UPI">UPI (GPay / PhonePe / Paytm)</option>
                      <option value="Cash on Delivery">Cash on Delivery</option>
                    </select>
                  </label>

                  <label className="field">
                    <span>PAYMENT STATUS</span>
                    <select
                      value={paymentStatus}
                      onChange={(e) => setPaymentStatus(e.target.value as 'Paid' | 'Pending')}
                      className="admin-select-full"
                    >
                      <option value="Paid">Paid</option>
                      <option value="Pending">Pending Payment</option>
                    </select>
                  </label>

                  <label className="field">
                    <span>DELIVERY METHOD</span>
                    <select
                      value={deliveryMethod}
                      onChange={(e) => setDeliveryMethod(e.target.value as 'Standard' | 'Express')}
                      className="admin-select-full"
                    >
                      <option value="Standard">Standard Delivery (Complimentary - ₹0)</option>
                      <option value="Express">Express Delivery (₹499)</option>
                    </select>
                  </label>

                  <label className="settings-card-toggle">
                    <div className="toggle-info">
                      <ShieldCheck size={18} strokeWidth={1.3} />
                      <div>
                        <strong>Digital Business Card</strong>
                        <p>Generate card with QR code automatically.</p>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={autoGenerateCard}
                      onChange={(e) => setAutoGenerateCard(e.target.checked)}
                    />
                  </label>

                  <dl className="totals admin-order-totals margin-top-12">
                    <div>
                      <dt>Subtotal</dt>
                      <dd>{money(subtotal)}</dd>
                    </div>
                    <div>
                      <dt>{deliveryMethod} Delivery</dt>
                      <dd>{shipping === 0 ? 'Complimentary' : money(shipping)}</dd>
                    </div>
                    <div className="total-line">
                      <dt>Total Amount</dt>
                      <dd>{money(total)}</dd>
                    </div>
                  </dl>
                </div>
              </div>
            </div>

            <div className="wizard-action-row justify-between margin-top-24">
              <Button type="button" variant="outline" onClick={() => setCurrentStep(2)}>
                <ArrowLeft size={16} /> BACK TO PRODUCTS
              </Button>
              <Button type="submit" loading={isSubmitting} className="submit-create-order-btn">
                <Check size={16} /> COMPLETE ORDER & GENERATE DIGITAL CARD
              </Button>
            </div>
          </div>
        </form>
      )}
    </>
  );
}

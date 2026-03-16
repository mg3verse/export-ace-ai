import { Product, Lead, Order, Conversation, Message, DashboardData } from '@/types/domain';

export const PRODUCTS: Product[] = [
  { id: '1', sku: 'AMX500', name: 'Amoxicillin', dosage: '500mg', pricePerBox: 12, unitsPerBox: 100, minOrderQty: 50, stockStatus: 'in_stock', category: 'Antibiotics' },
  { id: '2', sku: 'PCM500', name: 'Paracetamol', dosage: '500mg', pricePerBox: 8, unitsPerBox: 100, minOrderQty: 100, stockStatus: 'in_stock', category: 'Analgesics' },
  { id: '3', sku: 'MET850', name: 'Metformin', dosage: '850mg', pricePerBox: 15, unitsPerBox: 60, minOrderQty: 50, stockStatus: 'in_stock', category: 'Antidiabetics' },
  { id: '4', sku: 'AZI250', name: 'Azithromycin', dosage: '250mg', pricePerBox: 22, unitsPerBox: 6, minOrderQty: 100, stockStatus: 'low_stock', category: 'Antibiotics' },
  { id: '5', sku: 'OMP020', name: 'Omeprazole', dosage: '20mg', pricePerBox: 18, unitsPerBox: 28, minOrderQty: 50, stockStatus: 'in_stock', category: 'Gastrointestinal' },
];

export const LEADS: Lead[] = [
  { id: '1', companyName: 'PharmaCo Nigeria', contactName: 'Adebayo Okonkwo', country: 'Nigeria', phone: '+234-801-234-5678', email: 'adebayo@pharmaco.ng', licenseNumber: 'NG-PHARMA-2024-1234', isQualified: true, tier: 'vip', createdAt: '2024-01-15', lastContactAt: '2024-03-14' },
  { id: '2', companyName: 'Gulf Medical Supplies', contactName: 'Ahmed Al-Rashid', country: 'UAE', phone: '+971-50-123-4567', email: 'ahmed@gulfmed.ae', licenseNumber: 'UAE-IMP-2024-5678', isQualified: true, tier: 'active', createdAt: '2024-02-01', lastContactAt: '2024-03-13' },
  { id: '3', companyName: 'Manila Health Distributors', contactName: 'Maria Santos', country: 'Philippines', phone: '+63-917-123-4567', email: 'maria@mhd.ph', licenseNumber: 'PH-FDA-2024-9012', isQualified: true, tier: 'active', createdAt: '2024-02-10', lastContactAt: '2024-03-12' },
  { id: '4', companyName: 'Nairobi Pharma Ltd', contactName: 'James Kipchoge', country: 'Kenya', phone: '+254-722-123-456', email: 'james@nairobipharma.co.ke', isQualified: false, tier: 'new', createdAt: '2024-03-10', lastContactAt: '2024-03-10' },
  { id: '5', companyName: 'Saudi Drug Co.', contactName: 'Khalid Al-Saud', country: 'Saudi Arabia', phone: '+966-55-123-4567', email: 'khalid@saudidrug.sa', licenseNumber: 'SA-SFDA-2024-3456', isQualified: true, tier: 'qualified', createdAt: '2024-03-01', lastContactAt: '2024-03-11' },
];

export const ORDERS: Order[] = [
  { id: 'ORD-001', leadId: '1', companyName: 'PharmaCo Nigeria', items: [{ productId: '1', sku: 'AMX500', productName: 'Amoxicillin 500mg', quantity: 300, unitPrice: 12, discount: 0.05, lineTotal: 3420 }, { productId: '2', sku: 'PCM500', productName: 'Paracetamol 500mg', quantity: 500, unitPrice: 8, discount: 0.05, lineTotal: 3800 }], totalValue: 7220, status: 'shipped', shippingAddress: '12 Marina Road, Lagos', country: 'Nigeria', createdAt: '2024-03-01', updatedAt: '2024-03-08' },
  { id: 'ORD-002', leadId: '2', companyName: 'Gulf Medical Supplies', items: [{ productId: '3', sku: 'MET850', productName: 'Metformin 850mg', quantity: 200, unitPrice: 15, discount: 0, lineTotal: 3000 }], totalValue: 3000, status: 'confirmed', shippingAddress: 'Dubai Healthcare City', country: 'UAE', createdAt: '2024-03-10', updatedAt: '2024-03-10' },
  { id: 'ORD-003', leadId: '3', companyName: 'Manila Health Distributors', items: [{ productId: '4', sku: 'AZI250', productName: 'Azithromycin 250mg', quantity: 600, unitPrice: 22, discount: 0.10, lineTotal: 11880 }], totalValue: 11880, status: 'pending', shippingAddress: 'Makati City, Metro Manila', country: 'Philippines', createdAt: '2024-03-12', updatedAt: '2024-03-12' },
  { id: 'ORD-004', leadId: '5', companyName: 'Saudi Drug Co.', items: [{ productId: '5', sku: 'OMP020', productName: 'Omeprazole 20mg', quantity: 100, unitPrice: 18, discount: 0, lineTotal: 1800 }], totalValue: 1800, status: 'delivered', shippingAddress: 'Riyadh Pharma District', country: 'Saudi Arabia', createdAt: '2024-02-20', updatedAt: '2024-03-05' },
];

export const SAMPLE_MESSAGES: Message[] = [
  { id: '1', conversationId: 'conv-1', role: 'user', content: 'Hi, I need pricing for Amoxicillin 500mg. We need 300 boxes.', timestamp: '2024-03-14T09:00:00Z' },
  { id: '2', conversationId: 'conv-1', role: 'assistant', content: "Hello! 👋 I'm Aria from MedSource International.\n\nBefore I quote pricing, could you share:\n• Your company name?\n• Country of import?", agentRole: 'qualifier', timestamp: '2024-03-14T09:00:05Z' },
  { id: '3', conversationId: 'conv-1', role: 'user', content: 'PharmaCo Nigeria, importing to Nigeria', timestamp: '2024-03-14T09:01:00Z' },
  { id: '4', conversationId: 'conv-1', role: 'assistant', content: "Great! Here's your quote for Amoxicillin 500mg (AMX500):\n\n📦 300 boxes × $12/box\n💰 Subtotal: $3,600\n🏷️ 5% bulk discount (200+ boxes): -$180\n\n✅ Total: $3,420\n\nShipping to Nigeria: 7–10 business days\nMin order: 50 boxes ✓\n\nShall I proceed with this order?", agentRole: 'pricing', timestamp: '2024-03-14T09:01:10Z' },
  { id: '5', conversationId: 'conv-1', role: 'user', content: 'Yes, and add 500 boxes of Paracetamol too', timestamp: '2024-03-14T09:02:00Z' },
  { id: '6', conversationId: 'conv-1', role: 'assistant', content: "Updated order:\n\n1️⃣ Amoxicillin 500mg — 300 boxes — $3,420\n2️⃣ Paracetamol 500mg — 500 boxes — $3,800 (5% discount)\n\n📋 Order Total: $7,220\n\nTo confirm, I'll need:\n• Shipping address\n• Import license number\n• Preferred payment method", agentRole: 'order', timestamp: '2024-03-14T09:02:15Z' },
];

export const SAMPLE_CONVERSATION: Conversation = {
  id: 'conv-1',
  leadId: '1',
  leadName: 'PharmaCo Nigeria',
  status: 'active',
  messages: SAMPLE_MESSAGES,
  currentAgent: 'order',
  createdAt: '2024-03-14T09:00:00Z',
  lastMessageAt: '2024-03-14T09:02:15Z',
};

export const DASHBOARD_DATA: DashboardData = {
  totalRevenue: 23900,
  activeLeads: 12,
  conversionRate: 68,
  pendingOrders: 3,
  revenueByMonth: [
    { month: 'Oct', revenue: 8200, orders: 5 },
    { month: 'Nov', revenue: 12400, orders: 8 },
    { month: 'Dec', revenue: 9800, orders: 6 },
    { month: 'Jan', revenue: 15600, orders: 10 },
    { month: 'Feb', revenue: 18200, orders: 12 },
    { month: 'Mar', revenue: 23900, orders: 15 },
  ],
  leadsByCountry: [
    { country: 'Nigeria', count: 4 },
    { country: 'UAE', count: 3 },
    { country: 'Philippines', count: 2 },
    { country: 'Kenya', count: 2 },
    { country: 'Saudi Arabia', count: 1 },
  ],
  recentOrders: ORDERS,
};

import type { Message } from '@/types/domain';

export interface DemoScenario {
  id: string;
  label: string;
  description: string;
  messages: Omit<Message, 'id' | 'conversationId'>[];
}

export const DEMO_SCENARIOS: DemoScenario[] = [
  {
    id: 'pricing-to-order',
    label: '💰 Price Inquiry → Quote → Order',
    description: 'Customer asks about Paracetamol pricing and proceeds to order',
    messages: [
      { role: 'user', content: "Hi, I need pricing for Paracetamol 500mg", timestamp: new Date(Date.now() - 300000).toISOString() },
      { role: 'assistant', content: "Hello! 👋 I'd be happy to help with Paracetamol pricing.\n\nBefore I quote, could you share your *company name* and *country*?", agentRole: 'greeting', timestamp: new Date(Date.now() - 290000).toISOString() },
      { role: 'user', content: "Sure, I'm from New Life Medicare in Nigeria", timestamp: new Date(Date.now() - 250000).toISOString() },
      { role: 'assistant', content: "Thanks! Here's the pricing for Nigeria 🇳🇬\n\n*Paracetamol 500mg Tablets*\nSKU: PCM500\nBase price: $8.00/box (100 tablets)\nMin order: 100 boxes\n\n📊 *Volume Discounts:*\n• 1-10 boxes: $8.00/box\n• 11-50 boxes: $7.20/box (10% off)\n• 51-100 boxes: $6.80/box (15% off)\n• 100+ boxes: $6.40/box (20% off)\n\nShipping to Nigeria: 7-10 business days\n\nHow many boxes do you need?", agentRole: 'pricing', timestamp: new Date(Date.now() - 240000).toISOString() },
      { role: 'user', content: "I need 200 boxes", timestamp: new Date(Date.now() - 200000).toISOString() },
      { role: 'assistant', content: "Great order! Here's your quote:\n\n*Order Summary for New Life Medicare*\n━━━━━━━━━━━━━━━━━━━━\n📦 Paracetamol 500mg (PCM500)\n• Quantity: 200 boxes\n• Unit price: $6.40 (20% volume discount)\n• *Subtotal: $1,280.00*\n━━━━━━━━━━━━━━━━━━━━\n\n✅ Minimum order met ($500)\n🚚 Shipping: 7-10 days to Nigeria\n📋 Valid for: 7 days\n\nWould you like to place this order?", agentRole: 'pricing', timestamp: new Date(Date.now() - 190000).toISOString() },
      { role: 'user', content: "Yes, let's do it!", timestamp: new Date(Date.now() - 150000).toISOString() },
      { role: 'assistant', content: "Excellent! 🎉 Let me collect your order details.\n\n✅ Step 1: Product confirmed — PCM500 × 200\n✅ Step 2: Quantity confirmed — 200 boxes\n\nNow I need:\n3️⃣ Your delivery address in Nigeria\n4️⃣ Contact person name\n5️⃣ Phone number and email\n\nPlease share your delivery address:", agentRole: 'order', timestamp: new Date(Date.now() - 140000).toISOString() },
    ],
  },
  {
    id: 'shipping-faq',
    label: '🚚 FAQ about Shipping',
    description: 'Customer asks about shipping policies and cold chain',
    messages: [
      { role: 'user', content: "How long does shipping take to the UAE?", timestamp: new Date(Date.now() - 200000).toISOString() },
      { role: 'assistant', content: "Great question! 🚚\n\n*Shipping to UAE* 🇦🇪\n• Standard delivery: *7-10 business days*\n• All shipments include tracking\n• Temperature-controlled packaging for sensitive products\n• Fully insured\n\n*Payment for UAE orders:*\n• Wire transfer (T/T) or Letter of Credit\n• New customers: 50% advance payment\n\nWould you like to know about specific product availability or pricing for the UAE market?", agentRole: 'faq', timestamp: new Date(Date.now() - 190000).toISOString() },
      { role: 'user', content: "What about cold chain products? Do you handle those?", timestamp: new Date(Date.now() - 150000).toISOString() },
      { role: 'assistant', content: "Absolutely! We take cold chain very seriously ❄️\n\n*Cold Chain Handling:*\n• WHO-recommended validated packaging\n• Temperature data loggers in every shipment\n• Specialized pharmaceutical logistics partners\n• Temperature excursion reports provided\n\n*Quality Assurance:*\n• GMP-certified manufacturing\n• Certificate of Analysis (CoA) with every batch\n• WHO-prequalified products available\n\nAll cold chain products maintain 2-8°C throughout transit. Need specific product info?", agentRole: 'faq', timestamp: new Date(Date.now() - 140000).toISOString() },
    ],
  },
  {
    id: 'lead-qualification',
    label: '🎯 High-Value Lead Qualification',
    description: 'Qualifying a large hospital distributor',
    messages: [
      { role: 'user', content: "Hello, I'm looking for a pharmaceutical supplier for our hospital network", timestamp: new Date(Date.now() - 300000).toISOString() },
      { role: 'assistant', content: "Welcome! 👋 I'd love to learn more about your needs.\n\nCould you tell me:\n1️⃣ Your company name?\n2️⃣ Which country you operate in?\n3️⃣ Are you a hospital, distributor, or pharmacy chain?", agentRole: 'qualifier', timestamp: new Date(Date.now() - 290000).toISOString() },
      { role: 'user', content: "We're Gulf Medical Supplies, a pharmaceutical distributor based in Saudi Arabia. We supply to 50+ hospitals across the GCC region.", timestamp: new Date(Date.now() - 250000).toISOString() },
      { role: 'assistant', content: "Excellent! Gulf Medical Supplies sounds like a great fit 🤝\n\n*Company Profile:*\n✅ Distributor — High priority\n✅ Saudi Arabia — Primary market\n✅ 50+ hospital network — Large scale\n\nA few more questions:\n4️⃣ Do you have a valid pharmaceutical import license?\n5️⃣ What's your estimated monthly volume?\n6️⃣ Which product categories are you most interested in?", agentRole: 'qualifier', timestamp: new Date(Date.now() - 240000).toISOString() },
      { role: 'user', content: "Yes, we have a full SFDA import license. We're looking at 500-1000 boxes monthly across antibiotics and analgesics.", timestamp: new Date(Date.now() - 200000).toISOString() },
      { role: 'assistant', content: "Outstanding! 🌟 You're a *high-priority qualified lead*.\n\n*Qualification Summary:*\n━━━━━━━━━━━━━━━━━━━━\n🏢 Gulf Medical Supplies\n📍 Saudi Arabia (GCC)\n📋 SFDA Licensed ✅\n📦 500-1,000 boxes/month\n🏥 50+ hospital network\n⭐ Lead Score: *92/100*\n━━━━━━━━━━━━━━━━━━━━\n\nAt this volume, you'd qualify for our *VIP tier* with:\n• 20% volume discount on all products\n• Net 30 payment terms\n• Dedicated account manager\n• Priority shipping (5-7 days)\n\nI'd like to connect you with our senior sales team. Shall I arrange a call?", agentRole: 'qualifier', timestamp: new Date(Date.now() - 190000).toISOString() },
    ],
  },
  {
    id: 'multi-product',
    label: '📦 Multi-Product Order',
    description: 'Customer orders multiple pharmaceutical products',
    messages: [
      { role: 'user', content: "I need to order multiple products. Amoxicillin, Metformin, and Omeprazole.", timestamp: new Date(Date.now() - 300000).toISOString() },
      { role: 'assistant', content: "I can help with a multi-product order! 📦\n\nFirst, your company details please — name and country?", agentRole: 'order', timestamp: new Date(Date.now() - 290000).toISOString() },
      { role: 'user', content: "PharmaCo Kenya, based in Nairobi", timestamp: new Date(Date.now() - 250000).toISOString() },
      { role: 'assistant', content: "Thanks PharmaCo Kenya! 🇰🇪 Here are your products:\n\n*Available Products:*\n\n1️⃣ *Amoxicillin 500mg* (AMX500)\n   $12.00/box · Min 50 boxes\n\n2️⃣ *Metformin 850mg* (MET850)\n   $15.00/box · Min 50 boxes\n\n3️⃣ *Omeprazole 20mg* (OMP020)\n   $18.00/box · Min 50 boxes\n\nAll in stock ✅\n\nHow many boxes of each do you need?", agentRole: 'pricing', timestamp: new Date(Date.now() - 240000).toISOString() },
      { role: 'user', content: "100 boxes of Amoxicillin, 75 boxes of Metformin, and 60 boxes of Omeprazole", timestamp: new Date(Date.now() - 200000).toISOString() },
      { role: 'assistant', content: "Here's your complete quote:\n\n*Multi-Product Quote — PharmaCo Kenya*\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n📦 *Amoxicillin 500mg* (AMX500)\n   100 boxes × $9.60 (20% off) = *$960.00*\n\n📦 *Metformin 850mg* (MET850)\n   75 boxes × $12.75 (15% off) = *$956.25*\n\n📦 *Omeprazole 20mg* (OMP020)\n   60 boxes × $15.30 (15% off) = *$918.00*\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n💰 *Grand Total: $2,834.25*\n🚚 Shipping to Kenya: 7-10 business days\n📋 Quote valid: 7 days\n\nShall I proceed with the order?", agentRole: 'pricing', timestamp: new Date(Date.now() - 190000).toISOString() },
    ],
  },
];

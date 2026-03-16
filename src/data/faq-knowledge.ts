export interface FaqItem {
  id: string;
  category: string;
  question: string;
  answer: string;
  keywords: string[];
}

export const FAQ_CATEGORIES = [
  'Product Information',
  'Shipping & Delivery',
  'Payment Terms',
  'Returns & Refunds',
  'Regulatory & Compliance',
  'Quality Assurance',
] as const;

export const FAQ_KNOWLEDGE: FaqItem[] = [
  // ── Product Information ──────────────────────────────
  {
    id: 'faq-01',
    category: 'Product Information',
    question: 'What pharmaceutical products do you export?',
    answer: 'We export a wide range of WHO-prequalified generic pharmaceuticals including antibiotics (Amoxicillin, Azithromycin, Ciprofloxacin, Doxycycline), analgesics (Paracetamol, Ibuprofen), cardiovascular (Losartan), metabolic (Metformin), gastrointestinal (Omeprazole), and antihistamines (Cetirizine). All products are GMP-certified.',
    keywords: ['products', 'catalog', 'list', 'what do you sell', 'medicines', 'drugs', 'range'],
  },
  {
    id: 'faq-02',
    category: 'Product Information',
    question: 'Are your products WHO-prequalified?',
    answer: 'Yes, our products are manufactured in WHO-prequalified and GMP-certified facilities. We maintain strict quality standards and can provide Certificates of Analysis (CoA), Certificates of Pharmaceutical Product (CPP), and GMP certificates upon request.',
    keywords: ['WHO', 'prequalified', 'quality', 'certified', 'GMP', 'certificate'],
  },
  {
    id: 'faq-03',
    category: 'Product Information',
    question: 'Can you provide product samples?',
    answer: 'Yes, we can provide product samples for evaluation purposes to qualified buyers. Sample requests require a valid pharmaceutical import license. Samples are typically shipped within 5-7 business days. Please contact us with your company details and the products you\'re interested in.',
    keywords: ['sample', 'samples', 'try', 'test', 'evaluation'],
  },
  {
    id: 'faq-04',
    category: 'Product Information',
    question: 'What is the shelf life of your products?',
    answer: 'Our products typically have a shelf life of 24-36 months from the date of manufacture. We guarantee a minimum of 18 months remaining shelf life at the time of delivery. Specific shelf life information is available on each product\'s Certificate of Analysis.',
    keywords: ['shelf life', 'expiry', 'expiration', 'how long', 'validity'],
  },
  // ── Shipping & Delivery ──────────────────────────────
  {
    id: 'faq-05',
    category: 'Shipping & Delivery',
    question: 'What are your shipping times?',
    answer: 'Shipping times vary by destination:\n• UAE, Saudi Arabia, Nigeria, Kenya, Philippines: 7-10 business days\n• Other countries: 14-21 business days\n\nAll shipments include tracking and are insured. Cold-chain products are shipped in temperature-controlled packaging.',
    keywords: ['shipping', 'delivery', 'how long', 'time', 'days', 'arrive'],
  },
  {
    id: 'faq-06',
    category: 'Shipping & Delivery',
    question: 'Do you ship to all countries?',
    answer: 'We export to most countries worldwide, subject to local pharmaceutical import regulations. Our primary markets include the Middle East (UAE, Saudi Arabia), Africa (Nigeria, Kenya), and Southeast Asia (Philippines). For other destinations, please inquire and we\'ll confirm availability and shipping terms.',
    keywords: ['countries', 'ship to', 'international', 'worldwide', 'global', 'destination'],
  },
  {
    id: 'faq-07',
    category: 'Shipping & Delivery',
    question: 'How do you handle cold-chain products?',
    answer: 'Cold-chain products are shipped in validated temperature-controlled packaging with data loggers. We use WHO-recommended packaging standards and partner with specialized pharmaceutical logistics providers. Temperature excursion reports are provided with each shipment.',
    keywords: ['cold chain', 'temperature', 'refrigerated', 'cold storage', 'sensitive'],
  },
  {
    id: 'faq-08',
    category: 'Shipping & Delivery',
    question: 'What is the minimum order value?',
    answer: 'Our minimum order value is $500 USD. Each product also has a minimum order quantity (MOQ) which varies by product. For example, Paracetamol has an MOQ of 100 boxes while Amoxicillin has an MOQ of 50 boxes.',
    keywords: ['minimum', 'order', 'MOQ', 'smallest', 'least', 'value'],
  },
  // ── Payment Terms ────────────────────────────────────
  {
    id: 'faq-09',
    category: 'Payment Terms',
    question: 'What payment methods do you accept?',
    answer: 'We accept:\n• Wire Transfer (T/T) — most common\n• Letter of Credit (L/C) — for large orders\n• Payment terms for new customers: 50% advance, 50% before shipping\n• Net 30 available for established accounts with good payment history',
    keywords: ['payment', 'pay', 'method', 'wire', 'transfer', 'credit', 'terms'],
  },
  {
    id: 'faq-10',
    category: 'Payment Terms',
    question: 'Do you offer credit terms?',
    answer: 'Yes, we offer Net 30 payment terms for established accounts with a proven track record. New customers start with 50% advance payment. After 3-6 months of consistent orders and timely payments, we review accounts for extended credit terms.',
    keywords: ['credit', 'terms', 'net 30', 'advance', 'payment plan', 'installment'],
  },
  {
    id: 'faq-11',
    category: 'Payment Terms',
    question: 'What currencies do you accept?',
    answer: 'Our pricing is in USD. We accept payments in USD, EUR, GBP, and AED. Payments in other currencies may be subject to conversion fees. All invoices are issued in USD.',
    keywords: ['currency', 'USD', 'EUR', 'GBP', 'AED', 'dollar', 'euro'],
  },
  // ── Returns & Refunds ────────────────────────────────
  {
    id: 'faq-12',
    category: 'Returns & Refunds',
    question: 'What is your return policy?',
    answer: 'Returns are accepted within 30 days of delivery for defective or damaged products. All returns must be authorized by our quality team. Products must be in original packaging and accompanied by the original Certificate of Analysis. Return shipping costs are covered by MedSource for quality-related issues.',
    keywords: ['return', 'refund', 'send back', 'defective', 'damaged', 'policy'],
  },
  {
    id: 'faq-13',
    category: 'Returns & Refunds',
    question: 'How do you handle damaged shipments?',
    answer: 'All shipments are insured. If products arrive damaged:\n1. Document the damage with photos\n2. Contact us within 48 hours of delivery\n3. We\'ll initiate an insurance claim and arrange replacement\n4. Replacement shipments are expedited at no additional cost',
    keywords: ['damaged', 'broken', 'insurance', 'claim', 'replacement'],
  },
  // ── Regulatory & Compliance ──────────────────────────
  {
    id: 'faq-14',
    category: 'Regulatory & Compliance',
    question: 'What licenses do I need to import pharmaceuticals?',
    answer: 'You need a valid pharmaceutical import license issued by your country\'s drug regulatory authority. Requirements vary by country but typically include:\n• Pharmaceutical wholesale/distribution license\n• Import permit for controlled substances (if applicable)\n• Good Distribution Practice (GDP) certification\n\nWe can guide you through the process for your specific country.',
    keywords: ['license', 'import', 'permit', 'regulatory', 'requirement', 'need'],
  },
  {
    id: 'faq-15',
    category: 'Regulatory & Compliance',
    question: 'Can you help with product registration in my country?',
    answer: 'We provide regulatory support including:\n• Dossier preparation (CTD format)\n• Stability data and bioequivalence studies\n• Certificates of Pharmaceutical Product (CPP)\n• GMP certificates\n• Free Sale Certificates\n\nWe work with local regulatory consultants in key markets to facilitate registration.',
    keywords: ['registration', 'register', 'dossier', 'regulatory', 'approval', 'country'],
  },
  {
    id: 'faq-16',
    category: 'Regulatory & Compliance',
    question: 'Are your products registered with the FDA?',
    answer: 'Our manufacturing facilities follow FDA cGMP guidelines. However, specific product registrations vary by market. For the US market, our products are manufactured in FDA-inspected facilities. For other markets, we assist with local regulatory registration as needed.',
    keywords: ['FDA', 'registered', 'approved', 'US', 'regulation', 'cGMP'],
  },
  // ── Quality Assurance ────────────────────────────────
  {
    id: 'faq-17',
    category: 'Quality Assurance',
    question: 'What quality certifications do you have?',
    answer: 'Our manufacturing partners hold:\n• WHO Prequalification\n• GMP Certification (EU-GMP, PIC/S)\n• ISO 9001:2015\n• ISO 14001:2015 (Environmental)\n• FDA cGMP compliance\n\nAll certifications are available upon request.',
    keywords: ['quality', 'certification', 'ISO', 'GMP', 'standard', 'certified'],
  },
  {
    id: 'faq-18',
    category: 'Quality Assurance',
    question: 'Do you provide Certificates of Analysis?',
    answer: 'Yes, every batch shipped includes a Certificate of Analysis (CoA) from an independent, accredited laboratory. The CoA includes test results for identity, purity, potency, dissolution, and microbial limits as per pharmacopeial standards (USP/BP/EP).',
    keywords: ['certificate', 'analysis', 'CoA', 'batch', 'testing', 'lab'],
  },
  {
    id: 'faq-19',
    category: 'Quality Assurance',
    question: 'How do you ensure product authenticity?',
    answer: 'We implement multiple authenticity measures:\n• Direct sourcing from GMP-certified manufacturers\n• Batch-level traceability\n• Tamper-evident packaging\n• Serialization and track-and-trace capabilities\n• Regular supplier audits\n• Third-party quality verification',
    keywords: ['authentic', 'genuine', 'fake', 'counterfeit', 'verify', 'traceability'],
  },
  {
    id: 'faq-20',
    category: 'Quality Assurance',
    question: 'Can you provide stability data for your products?',
    answer: 'Yes, we provide ICH-compliant stability data for all products:\n• Long-term stability (25°C/60% RH)\n• Accelerated stability (40°C/75% RH)\n• Zone IV conditions for tropical markets\n\nStability data is included in regulatory dossiers and available upon request for specific products.',
    keywords: ['stability', 'data', 'ICH', 'shelf life', 'storage', 'conditions'],
  },
];

/** Simple keyword-based FAQ search — returns top N matches */
export function searchFaqs(query: string, topN = 3): FaqItem[] {
  const terms = query.toLowerCase().split(/\s+/).filter(t => t.length > 2);
  if (terms.length === 0) return FAQ_KNOWLEDGE.slice(0, topN);

  const scored = FAQ_KNOWLEDGE.map((faq) => {
    const searchable = `${faq.question} ${faq.answer} ${faq.keywords.join(' ')}`.toLowerCase();
    let score = 0;
    for (const term of terms) {
      if (faq.keywords.some((k) => k.toLowerCase().includes(term))) score += 3;
      if (faq.question.toLowerCase().includes(term)) score += 2;
      if (searchable.includes(term)) score += 1;
    }
    return { faq, score };
  })
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, topN);

  return scored.map((s) => s.faq);
}

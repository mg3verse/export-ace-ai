import { useState } from 'react';
import { HelpCircle, Search, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FAQ_KNOWLEDGE, FAQ_CATEGORIES, searchFaqs, type FaqItem } from '@/data/faq-knowledge';
import { logAnalyticsEvent } from '@/services/api';

export default function FAQAgent() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<FaqItem[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = () => {
    const q = query.trim();
    if (!q) {
      setResults([]);
      setHasSearched(false);
      return;
    }
    const matches = searchFaqs(q, 3);
    setResults(matches);
    setHasSearched(true);
    logAnalyticsEvent('faq_search', { query: q, resultCount: matches.length });
  };

  const filteredByCategory = activeCategory
    ? FAQ_KNOWLEDGE.filter((f) => f.category === activeCategory)
    : [];

  const toggleExpanded = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
    logAnalyticsEvent('faq_viewed', { faqId: id });
  };

  const renderFaqCard = (faq: FaqItem) => (
    <button
      key={faq.id}
      onClick={() => toggleExpanded(faq.id)}
      className="w-full text-left rounded-lg border border-border/50 p-3 transition-colors hover:bg-muted/30"
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium leading-snug">{faq.question}</p>
        {expandedId === faq.id ? (
          <ChevronUp className="h-4 w-4 shrink-0 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
        )}
      </div>
      {expandedId === faq.id && (
        <div className="mt-2 space-y-2">
          <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
            {faq.answer}
          </p>
          <Badge variant="secondary" className="text-[10px]">
            {faq.category}
          </Badge>
        </div>
      )}
    </button>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <HelpCircle className="h-5 w-5 text-primary" />
        <h2 className="text-lg font-bold">FAQ Agent</h2>
        <Badge variant="outline" className="ml-auto text-xs">
          📋 {FAQ_KNOWLEDGE.length} FAQs
        </Badge>
      </div>

      {/* Search */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Search className="h-4 w-4" /> Search Knowledge Base
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Ask anything…"
              className="flex-1"
            />
            <Button size="sm" onClick={handleSearch}>
              Search
            </Button>
          </div>

          {hasSearched && results.length === 0 && (
            <p className="text-sm text-muted-foreground italic">
              No matching FAQs found. Try different keywords.
            </p>
          )}

          {results.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground font-medium">
                Top {results.length} results:
              </p>
              {results.map(renderFaqCard)}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Categories */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Browse by Category</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-1.5">
            {FAQ_CATEGORIES.map((cat) => (
              <Button
                key={cat}
                variant={activeCategory === cat ? 'default' : 'outline'}
                size="sm"
                className="text-xs h-7"
                onClick={() => setActiveCategory((prev) => (prev === cat ? null : cat))}
              >
                {cat}
              </Button>
            ))}
          </div>

          {activeCategory && (
            <div className="space-y-2 pt-2">
              {filteredByCategory.map(renderFaqCard)}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Production note */}
      <div className="rounded-lg border border-dashed border-border/50 p-3 text-xs text-muted-foreground">
        <div className="flex items-center gap-1 font-medium mb-1">
          <ExternalLink className="h-3 w-3" /> Production Enhancement
        </div>
        <p>
          This POC uses keyword matching. For production, integrate{' '}
          <span className="font-medium text-foreground">pgvector</span> or{' '}
          <span className="font-medium text-foreground">Pinecone</span>{' '}
          for semantic vector search across the knowledge base.
        </p>
      </div>
    </div>
  );
}

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FAQ_KNOWLEDGE, FAQ_CATEGORIES, type FaqItem } from '@/data/faq-knowledge';
import { Plus, Pencil, Trash2, Search } from 'lucide-react';
import { DeleteConfirmDialog } from './DeleteConfirmDialog';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

export function FAQManager() {
  const [faqs, setFaqs] = useState<FaqItem[]>([...FAQ_KNOWLEDGE]);
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState<string>('all');
  const [editing, setEditing] = useState<FaqItem | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const [form, setForm] = useState({ category: FAQ_CATEGORIES[0], question: '', answer: '', keywords: '' });

  const filtered = faqs.filter((f) => {
    const matchCat = catFilter === 'all' || f.category === catFilter;
    const matchSearch = !search || f.question.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const openNew = () => {
    setEditing(null); setIsNew(true);
    setForm({ category: FAQ_CATEGORIES[0], question: '', answer: '', keywords: '' });
  };

  const openEdit = (faq: FaqItem) => {
    setEditing(faq); setIsNew(false);
    setForm({ category: faq.category, question: faq.question, answer: faq.answer, keywords: faq.keywords.join(', ') });
  };

  const save = () => {
    if (!form.question.trim() || !form.answer.trim()) {
      toast({ title: 'Validation Error', description: 'Question and answer are required.', variant: 'destructive' });
      return;
    }
    const item: FaqItem = {
      id: editing?.id || `faq-${Date.now()}`,
      category: form.category,
      question: form.question.trim(),
      answer: form.answer.trim(),
      keywords: form.keywords.split(',').map((k) => k.trim()).filter(Boolean),
    };
    if (isNew) {
      setFaqs((prev) => [...prev, item]);
      toast({ title: 'FAQ Added', description: 'New FAQ entry has been created.' });
    } else {
      setFaqs((prev) => prev.map((f) => (f.id === item.id ? item : f)));
      toast({ title: 'FAQ Updated', description: 'FAQ entry has been updated.' });
    }
    setEditing(null); setIsNew(false);
  };

  const confirmDelete = () => {
    if (deleteTarget) {
      setFaqs((prev) => prev.filter((f) => f.id !== deleteTarget));
      toast({ title: 'FAQ Deleted' });
      setDeleteTarget(null);
    }
  };

  const showForm = isNew || editing;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 gap-3">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search FAQs..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>
          <Select value={catFilter} onValueChange={setCatFilter}>
            <SelectTrigger className="w-[200px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {FAQ_CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <Button onClick={openNew}><Plus className="mr-2 h-4 w-4" />Add New FAQ</Button>
      </div>

      {showForm && (
        <Card className="border-primary/30">
          <CardHeader><CardTitle className="text-lg">{isNew ? 'New FAQ Entry' : 'Edit FAQ Entry'}</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={form.category} onValueChange={(v) => setForm((f) => ({ ...f, category: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {FAQ_CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Question *</Label>
              <Input value={form.question} maxLength={300} onChange={(e) => setForm((f) => ({ ...f, question: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Answer *</Label>
              <Textarea value={form.answer} maxLength={1000} rows={4} onChange={(e) => setForm((f) => ({ ...f, answer: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Keywords (comma-separated)</Label>
              <Input value={form.keywords} onChange={(e) => setForm((f) => ({ ...f, keywords: e.target.value }))} placeholder="shipping, delivery, timeline" />
            </div>
            <div className="flex gap-2">
              <Button onClick={save}>{isNew ? 'Add FAQ' : 'Save Changes'}</Button>
              <Button variant="outline" onClick={() => { setEditing(null); setIsNew(false); }}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        {filtered.map((faq) => (
          <Card key={faq.id} className="group">
            <CardContent className="flex items-start gap-4 p-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="outline" className="text-xs">{faq.category}</Badge>
                </div>
                <p className="font-medium text-sm">{faq.question}</p>
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{faq.answer}</p>
              </div>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(faq)}><Pencil className="h-3.5 w-3.5" /></Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeleteTarget(faq.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {filtered.length === 0 && <p className="text-center text-muted-foreground py-8">No FAQs found.</p>}
      </div>

      <DeleteConfirmDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)} title="Delete FAQ?" description="This FAQ entry will be permanently removed." onConfirm={confirmDelete} />
    </div>
  );
}

/* eslint-disable */
'use client';

import * as React from 'react';
import { useSession } from 'next-auth/react';
import {
  Receipt,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  Clock,
  AlertCircle,
  X,
  ChevronDown,
  ExternalLink,
  DollarSign,
  CalendarClock,
  Link2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { GlowBackground } from '@/components/ui/glow-background';
import { invoicesApi, dealsApi } from '@/lib/api-client';

const PAYMENT_TERMS = [
  { value: 'NET_15', label: 'Net 15' },
  { value: 'NET_30', label: 'Net 30' },
  { value: 'NET_45', label: 'Net 45' },
  { value: 'NET_60', label: 'Net 60' },
  { value: 'NET_90', label: 'Net 90' },
  { value: 'FIFTY_FIFTY', label: '50/50 Split' },
];

const STATUS_CONFIG: Record<string, { label: string; className: string; icon: React.ReactNode }> = {
  DRAFT:          { label: 'Draft',          className: 'bg-background-elevated text-foreground-muted border border-border/40', icon: <Clock className="h-3 w-3" /> },
  SENT:           { label: 'Sent',           className: 'bg-primary-muted text-primary border border-primary/30',             icon: <Receipt className="h-3 w-3" /> },
  VIEWED:         { label: 'Viewed',         className: 'bg-info-muted text-info border border-info/30',                      icon: <Receipt className="h-3 w-3" /> },
  PARTIALLY_PAID: { label: 'Partial',        className: 'bg-warning-muted text-warning border border-warning/30',            icon: <DollarSign className="h-3 w-3" /> },
  PAID:           { label: 'Paid',           className: 'bg-success-muted text-success border border-success/30',            icon: <CheckCircle2 className="h-3 w-3" /> },
  OVERDUE:        { label: 'Overdue',        className: 'bg-danger-muted text-danger border border-danger/30',               icon: <AlertCircle className="h-3 w-3" /> },
  DISPUTED:       { label: 'Disputed',       className: 'bg-danger-muted text-danger border border-danger/30',               icon: <AlertCircle className="h-3 w-3" /> },
  CANCELLED:      { label: 'Cancelled',      className: 'bg-background-elevated text-foreground-subtle border border-border/30', icon: <X className="h-3 w-3" /> },
};

const formatCurrency = (val: number, currency = 'USD') =>
  new Intl.NumberFormat(undefined, { style: 'currency', currency, maximumFractionDigits: 0 }).format(val);

const formatDate = (d: string | Date | null | undefined) =>
  d ? new Date(d).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : '—';

export default function InvoicesPage() {
  const { data: session } = useSession();
  const accessToken = (session as any)?.accessToken;

  const [invoices, setInvoices] = React.useState<any[]>([]);
  const [deals, setDeals] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [panelOpen, setPanelOpen] = React.useState(false);
  const [editingInvoice, setEditingInvoice] = React.useState<any | null>(null);
  const [formError, setFormError] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);

  // Form fields
  const [brandName, setBrandName] = React.useState('');
  const [brandEmail, setBrandEmail] = React.useState('');
  const [brandAddress, setBrandAddress] = React.useState('');
  const [dealId, setDealId] = React.useState('');
  const [paymentTerms, setPaymentTerms] = React.useState('NET_30');
  const [taxRate, setTaxRate] = React.useState<number | ''>('');
  const [currency, setCurrency] = React.useState('USD');
  const [issuedAt, setIssuedAt] = React.useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = React.useState('');
  const [lineItems, setLineItems] = React.useState([{ description: '', quantity: 1, unitPrice: 0 }]);

  const fetchData = React.useCallback(async () => {
    if (!accessToken) return;
    try {
      setLoading(true);
      const [invData, dealData] = await Promise.all([
        invoicesApi.getAll(accessToken),
        dealsApi.getAll(accessToken),
      ]);
      setInvoices(invData);
      setDeals(dealData);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  React.useEffect(() => { fetchData(); }, [fetchData]);

  // Summary stats
  const totalAmount = invoices.reduce((s, i) => s + Number(i.totalAmount), 0);
  const paidAmount = invoices
    .filter((i) => i.status === 'PAID')
    .reduce((s, i) => s + Number(i.totalAmount), 0);
  const overdueAmount = invoices
    .filter((i) => i.isOverdue || i.status === 'OVERDUE')
    .reduce((s, i) => s + Number(i.outstandingAmount ?? i.totalAmount), 0);

  const resetForm = () => {
    setEditingInvoice(null);
    setBrandName(''); setBrandEmail(''); setBrandAddress('');
    setDealId(''); setPaymentTerms('NET_30'); setTaxRate('');
    setCurrency('USD'); setIssuedAt(new Date().toISOString().split('T')[0]);
    setNotes('');
    setLineItems([{ description: '', quantity: 1, unitPrice: 0 }]);
    setFormError(null);
  };

  const openAdd = () => { resetForm(); setPanelOpen(true); };

  const openEdit = (inv: any) => {
    setEditingInvoice(inv);
    setBrandName(inv.brandName || '');
    setBrandEmail(inv.brandEmail || '');
    setBrandAddress(inv.brandAddress || '');
    setDealId(inv.dealId || '');
    setPaymentTerms(inv.paymentTerms || 'NET_30');
    setTaxRate(inv.taxRate ?? '');
    setCurrency(inv.currency || 'USD');
    setIssuedAt(inv.issuedAt ? new Date(inv.issuedAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]);
    setNotes(inv.notes || '');
    setLineItems(
      inv.lineItems?.map((l: any) => ({
        description: l.description,
        quantity: l.quantity,
        unitPrice: Number(l.unitPrice),
      })) ?? [{ description: '', quantity: 1, unitPrice: 0 }]
    );
    setFormError(null);
    setPanelOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken) return;
    if (!brandName.trim() || !brandEmail.trim()) {
      setFormError('Brand name and email are required.');
      return;
    }
    if (lineItems.some((l) => !l.description.trim())) {
      setFormError('All line items must have a description.');
      return;
    }
    setSaving(true);
    setFormError(null);
    const payload = {
      brandName, brandEmail,
      brandAddress: brandAddress || undefined,
      dealId: dealId || undefined,
      paymentTerms,
      taxRate: taxRate !== '' ? Number(taxRate) : undefined,
      currency,
      issuedAt: new Date(issuedAt).toISOString(),
      notes: notes || undefined,
      lineItems,
    };
    try {
      if (editingInvoice) {
        await invoicesApi.update(accessToken, editingInvoice.id, payload);
      } else {
        await invoicesApi.create(accessToken, payload);
      }
      setPanelOpen(false);
      fetchData();
    } catch (err: any) {
      setFormError(err.message || 'Failed to save invoice.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!accessToken || !confirm('Delete this invoice?')) return;
    try { await invoicesApi.delete(accessToken, id); fetchData(); }
    catch (e) { console.error(e); }
  };

  const handleMarkPaid = async (id: string, totalAmount: number) => {
    if (!accessToken) return;
    try { await invoicesApi.markPaid(accessToken, id, { paidAmount: totalAmount }); fetchData(); }
    catch (e) { console.error(e); }
  };

  const addLineItem = () => setLineItems([...lineItems, { description: '', quantity: 1, unitPrice: 0 }]);
  const removeLineItem = (idx: number) => setLineItems(lineItems.filter((_, i) => i !== idx));
  const updateLineItem = (idx: number, field: string, value: any) => {
    setLineItems(lineItems.map((l, i) => i === idx ? { ...l, [field]: value } : l));
  };

  const subtotal = lineItems.reduce((s, l) => s + l.quantity * l.unitPrice, 0);
  const tax = taxRate !== '' ? (subtotal * Number(taxRate)) / 100 : 0;
  const total = subtotal + tax;

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="h-10 w-48 rounded-lg bg-background-elevated animate-shimmer" />
        <div className="h-24 rounded-xl bg-background-elevated animate-shimmer" />
        <div className="h-64 rounded-xl bg-background-elevated animate-shimmer" />
      </div>
    );
  }

  return (
    <div className="relative space-y-8 animate-fade-in pb-16">
      <GlowBackground glowPosition="top-right" intensity="subtle" animated />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/40 pb-6 relative z-10">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-primary-muted inline-flex shadow-glow-sm">
              <Receipt className="h-6 w-6 text-primary" />
            </span>
            Invoices
          </h1>
          <p className="mt-2 text-foreground-muted">Create, send, and track payment for your brand deals.</p>
        </div>
        <Button onClick={openAdd} variant="primary" className="gap-1.5 font-semibold text-sm shadow-glow-sm self-start sm:self-center">
          <Plus className="h-4 w-4" /> New Invoice
        </Button>
      </div>

      {/* Stat Band */}
      <div className="relative z-10 rounded-2xl overflow-hidden bg-gradient-to-r from-primary/20 via-accent/20 to-primary/20 border border-primary/20 p-6 shadow-glow">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 divide-y sm:divide-y-0 sm:divide-x divide-border/30">
          {[
            { label: 'Total Invoiced', value: formatCurrency(totalAmount), icon: <Receipt className="h-5 w-5 text-primary" /> },
            { label: 'Total Paid', value: formatCurrency(paidAmount), icon: <CheckCircle2 className="h-5 w-5 text-success" /> },
            { label: 'Overdue Amount', value: formatCurrency(overdueAmount), icon: <AlertCircle className="h-5 w-5 text-danger" /> },
          ].map((stat) => (
            <div key={stat.label} className="flex items-center gap-4 sm:pl-6 first:pl-0 pt-4 sm:pt-0 first:pt-0">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-background-surface/60 flex-shrink-0">
                {stat.icon}
              </div>
              <div>
                <p className="text-xs text-foreground-muted font-medium uppercase tracking-widest">{stat.label}</p>
                <p className="text-xl font-extrabold text-white font-mono">{stat.value}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Invoice Table */}
      <div className="relative z-10">
        <Card variant="glass" className="border-border/40 overflow-hidden">
          <CardContent className="p-0">
            {invoices.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-border/40 bg-background-surface/40 text-foreground-muted font-semibold text-xs uppercase tracking-wider">
                      <th className="p-4">Invoice #</th>
                      <th className="p-4">Brand</th>
                      <th className="p-4">Deal</th>
                      <th className="p-4 text-right">Amount</th>
                      <th className="p-4">Status</th>
                      <th className="p-4">Due Date</th>
                      <th className="p-4 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/20">
                    {invoices.map((inv) => {
                      const cfg = STATUS_CONFIG[inv.isOverdue && inv.status !== 'PAID' ? 'OVERDUE' : inv.status] ?? STATUS_CONFIG.DRAFT;
                      const linkedDeal = deals.find((d) => d.id === inv.dealId);
                      return (
                        <tr key={inv.id} className="hover:bg-background-elevated/40 transition-colors group">
                          <td className="p-4">
                            <span className="font-mono text-xs text-primary font-semibold">{inv.invoiceNumber}</span>
                          </td>
                          <td className="p-4">
                            <div className="font-medium text-white">{inv.brandName}</div>
                            <div className="text-xs text-foreground-muted">{inv.brandEmail}</div>
                          </td>
                          <td className="p-4">
                            {linkedDeal ? (
                              <div className="flex items-center gap-1 text-xs text-foreground-muted">
                                <Link2 className="h-3 w-3" />
                                {linkedDeal.brandName}
                              </div>
                            ) : (
                              <span className="text-xs text-foreground-subtle">—</span>
                            )}
                          </td>
                          <td className="p-4 text-right">
                            <div className="font-mono font-bold text-white">{formatCurrency(Number(inv.totalAmount), inv.currency)}</div>
                            {inv.taxRate && (
                              <div className="text-xs text-foreground-muted">incl. {inv.taxRate}% tax</div>
                            )}
                          </td>
                          <td className="p-4">
                            <span className={cn('inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold', cfg.className)}>
                              {cfg.icon} {cfg.label}
                            </span>
                          </td>
                          <td className="p-4">
                            <div className={cn('flex items-center gap-1 text-xs font-medium', inv.isOverdue ? 'text-danger' : 'text-foreground-muted')}>
                              <CalendarClock className="h-3 w-3" />
                              {formatDate(inv.dueDate)}
                            </div>
                          </td>
                          <td className="p-4 text-center">
                            <div className="inline-flex gap-1.5 opacity-70 group-hover:opacity-100 transition-opacity">
                              {!['PAID', 'CANCELLED'].includes(inv.status) && (
                                <button
                                  onClick={() => handleMarkPaid(inv.id, Number(inv.totalAmount))}
                                  className="p-1.5 rounded-lg border border-success/30 bg-success-muted/20 hover:bg-success-muted text-success transition-all"
                                  title="Mark as Paid"
                                >
                                  <CheckCircle2 className="h-3.5 w-3.5" />
                                </button>
                              )}
                              <button
                                onClick={() => openEdit(inv)}
                                className="p-1.5 rounded-lg border border-border bg-input/40 hover:bg-background-elevated hover:border-primary/40 text-foreground-muted hover:text-white transition-all"
                                title="Edit"
                              >
                                <Edit2 className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={() => handleDelete(inv.id)}
                                className="p-1.5 rounded-lg border border-border bg-input/40 hover:bg-danger-muted/20 hover:border-danger/40 text-foreground-muted hover:text-danger transition-all"
                                title="Delete"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-12 text-center text-foreground-muted">
                <Receipt className="h-10 w-10 text-foreground-subtle mx-auto mb-3" />
                <p className="text-base font-semibold text-white">No invoices yet</p>
                <p className="text-xs max-w-xs mx-auto mt-1">Create your first invoice to start tracking payments from brand deals.</p>
                <Button onClick={openAdd} variant="primary" size="sm" className="mt-4 gap-1.5">
                  <Plus className="h-4 w-4" /> Create Invoice
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Slide-over Panel */}
      {panelOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
          <div className="absolute inset-0 bg-background/60 backdrop-blur-sm" onClick={() => setPanelOpen(false)} />
          <div className="relative w-full max-w-xl bg-background-surface border-l border-border/50 shadow-float-lg flex flex-col animate-slide-in-right overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-border/40 sticky top-0 bg-background-surface z-10">
              <h2 className="text-lg font-bold text-white">{editingInvoice ? 'Edit Invoice' : 'New Invoice'}</h2>
              <button onClick={() => setPanelOpen(false)} className="p-2 rounded-lg hover:bg-background-elevated text-foreground-muted hover:text-white transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5 flex-1">
              {formError && (
                <div className="rounded-lg bg-danger-muted/20 border border-danger/30 px-4 py-3 text-sm text-danger">
                  {formError}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-foreground-muted mb-1.5 uppercase tracking-wider">Brand Name *</label>
                  <input value={brandName} onChange={(e) => setBrandName(e.target.value)} required
                    className="w-full rounded-lg border border-border bg-input px-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary transition-colors"
                    placeholder="Acme Corp" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-foreground-muted mb-1.5 uppercase tracking-wider">Brand Email *</label>
                  <input value={brandEmail} onChange={(e) => setBrandEmail(e.target.value)} required type="email"
                    className="w-full rounded-lg border border-border bg-input px-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary transition-colors"
                    placeholder="billing@brand.com" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-foreground-muted mb-1.5 uppercase tracking-wider">Link to Deal</label>
                  <select value={dealId} onChange={(e) => setDealId(e.target.value)}
                    className="w-full rounded-lg border border-border bg-input px-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary transition-colors">
                    <option value="">— None —</option>
                    {deals.map((d) => (
                      <option key={d.id} value={d.id}>{d.brandName} — {d.title}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-foreground-muted mb-1.5 uppercase tracking-wider">Payment Terms</label>
                  <select value={paymentTerms} onChange={(e) => setPaymentTerms(e.target.value)}
                    className="w-full rounded-lg border border-border bg-input px-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary transition-colors">
                    {PAYMENT_TERMS.map((t) => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-foreground-muted mb-1.5 uppercase tracking-wider">Issue Date</label>
                  <input value={issuedAt} onChange={(e) => setIssuedAt(e.target.value)} type="date"
                    className="w-full rounded-lg border border-border bg-input px-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary transition-colors" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-foreground-muted mb-1.5 uppercase tracking-wider">Tax Rate (%)</label>
                  <input value={taxRate} onChange={(e) => setTaxRate(e.target.value === '' ? '' : Number(e.target.value))} type="number" min="0" max="100" step="0.1"
                    className="w-full rounded-lg border border-border bg-input px-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary transition-colors"
                    placeholder="e.g. 8.5" />
                </div>
              </div>

              {/* Line Items */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-xs font-semibold text-foreground-muted uppercase tracking-wider">Line Items</label>
                  <button type="button" onClick={addLineItem} className="text-xs text-primary hover:text-primary-hover flex items-center gap-1 transition-colors">
                    <Plus className="h-3.5 w-3.5" /> Add item
                  </button>
                </div>
                <div className="space-y-2">
                  {lineItems.map((item, idx) => (
                    <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                      <input value={item.description} onChange={(e) => updateLineItem(idx, 'description', e.target.value)}
                        className="col-span-5 rounded-lg border border-border bg-input px-2.5 py-2 text-xs text-foreground focus:outline-none focus:border-primary"
                        placeholder="Description" />
                      <input value={item.quantity} onChange={(e) => updateLineItem(idx, 'quantity', Number(e.target.value))} type="number" min="0.01" step="0.01"
                        className="col-span-2 rounded-lg border border-border bg-input px-2.5 py-2 text-xs text-foreground focus:outline-none focus:border-primary text-center"
                        placeholder="Qty" />
                      <input value={item.unitPrice} onChange={(e) => updateLineItem(idx, 'unitPrice', Number(e.target.value))} type="number" min="0" step="1"
                        className="col-span-3 rounded-lg border border-border bg-input px-2.5 py-2 text-xs text-foreground focus:outline-none focus:border-primary"
                        placeholder="Unit $" />
                      <div className="col-span-1 text-xs font-mono text-foreground-muted text-right">
                        ${(item.quantity * item.unitPrice).toFixed(0)}
                      </div>
                      {lineItems.length > 1 && (
                        <button type="button" onClick={() => removeLineItem(idx)} className="col-span-1 p-1 text-foreground-subtle hover:text-danger transition-colors">
                          <X className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                {/* Totals */}
                <div className="mt-4 border-t border-border/40 pt-3 space-y-1 text-xs">
                  <div className="flex justify-between text-foreground-muted">
                    <span>Subtotal</span>
                    <span className="font-mono">${subtotal.toFixed(2)}</span>
                  </div>
                  {taxRate !== '' && Number(taxRate) > 0 && (
                    <div className="flex justify-between text-foreground-muted">
                      <span>Tax ({taxRate}%)</span>
                      <span className="font-mono">${tax.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-white font-bold border-t border-border/40 pt-2">
                    <span>Total</span>
                    <span className="font-mono text-primary">${total.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground-muted mb-1.5 uppercase tracking-wider">Notes</label>
                <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2}
                  className="w-full rounded-lg border border-border bg-input px-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary resize-none transition-colors"
                  placeholder="Payment instructions, late fee notice, etc." />
              </div>

              <div className="flex gap-3 pt-2 sticky bottom-0 bg-background-surface pb-4">
                <Button type="button" variant="ghost" className="flex-1" onClick={() => setPanelOpen(false)}>Cancel</Button>
                <Button type="submit" variant="primary" className="flex-1 shadow-glow-sm" disabled={saving}>
                  {saving ? 'Saving…' : editingInvoice ? 'Update Invoice' : 'Create Invoice'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

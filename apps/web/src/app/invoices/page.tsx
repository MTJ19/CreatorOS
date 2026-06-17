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
  DRAFT: {
    label: 'Draft',
    className: 'bg-background-elevated text-foreground-muted border border-border/40',
    icon: <Clock className="h-3 w-3" />,
  },
  SENT: {
    label: 'Sent',
    className: 'bg-primary-muted text-primary border border-primary/30',
    icon: <Receipt className="h-3 w-3" />,
  },
  VIEWED: {
    label: 'Viewed',
    className: 'bg-info-muted text-info border border-info/30',
    icon: <Receipt className="h-3 w-3" />,
  },
  PARTIALLY_PAID: {
    label: 'Partial',
    className: 'bg-warning-muted text-warning border border-warning/30',
    icon: <DollarSign className="h-3 w-3" />,
  },
  PAID: {
    label: 'Paid',
    className: 'bg-success-muted text-success border border-success/30',
    icon: <CheckCircle2 className="h-3 w-3" />,
  },
  OVERDUE: {
    label: 'Overdue',
    className: 'bg-danger-muted text-danger border border-danger/30',
    icon: <AlertCircle className="h-3 w-3" />,
  },
  DISPUTED: {
    label: 'Disputed',
    className: 'bg-danger-muted text-danger border border-danger/30',
    icon: <AlertCircle className="h-3 w-3" />,
  },
  CANCELLED: {
    label: 'Cancelled',
    className: 'bg-background-elevated text-foreground-subtle border border-border/30',
    icon: <X className="h-3 w-3" />,
  },
};

const formatCurrency = (val: number, currency = 'USD') =>
  new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(val);

const formatDate = (d: string | Date | null | undefined) =>
  d
    ? new Date(d).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
    : '—';

export default function InvoicesPage() {
  const { data: session, status } = useSession();
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
  const [lineItems, setLineItems] = React.useState([
    { description: '', quantity: 1, unitPrice: 0 },
  ]);

  const fetchData = React.useCallback(async () => {
    if (!accessToken) { setLoading(false); return; }
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

  React.useEffect(() => {
    if (status === 'loading') return;
    if (status === 'unauthenticated') {
      setLoading(false);
      return;
    }
    fetchData();
  }, [status, fetchData]);

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
    setBrandName('');
    setBrandEmail('');
    setBrandAddress('');
    setDealId('');
    setPaymentTerms('NET_30');
    setTaxRate('');
    setCurrency('USD');
    setIssuedAt(new Date().toISOString().split('T')[0]);
    setNotes('');
    setLineItems([{ description: '', quantity: 1, unitPrice: 0 }]);
    setFormError(null);
  };

  const openAdd = () => {
    resetForm();
    setPanelOpen(true);
  };

  const openEdit = (inv: any) => {
    setEditingInvoice(inv);
    setBrandName(inv.brandName || '');
    setBrandEmail(inv.brandEmail || '');
    setBrandAddress(inv.brandAddress || '');
    setDealId(inv.dealId || '');
    setPaymentTerms(inv.paymentTerms || 'NET_30');
    setTaxRate(inv.taxRate ?? '');
    setCurrency(inv.currency || 'USD');
    setIssuedAt(
      inv.issuedAt
        ? new Date(inv.issuedAt).toISOString().split('T')[0]
        : new Date().toISOString().split('T')[0],
    );
    setNotes(inv.notes || '');
    setLineItems(
      inv.lineItems?.map((l: any) => ({
        description: l.description,
        quantity: l.quantity,
        unitPrice: Number(l.unitPrice),
      })) ?? [{ description: '', quantity: 1, unitPrice: 0 }],
    );
    setFormError(null);
    setPanelOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken) { setLoading(false); return; }
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
      brandName,
      brandEmail,
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
    try {
      await invoicesApi.delete(accessToken, id);
      fetchData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleMarkPaid = async (id: string, totalAmount: number) => {
    if (!accessToken) { setLoading(false); return; }
    try {
      await invoicesApi.markPaid(accessToken, id, { paidAmount: totalAmount });
      fetchData();
    } catch (e) {
      console.error(e);
    }
  };

  const addLineItem = () =>
    setLineItems([...lineItems, { description: '', quantity: 1, unitPrice: 0 }]);
  const removeLineItem = (idx: number) => setLineItems(lineItems.filter((_, i) => i !== idx));
  const updateLineItem = (idx: number, field: string, value: any) => {
    setLineItems(lineItems.map((l, i) => (i === idx ? { ...l, [field]: value } : l)));
  };

  const subtotal = lineItems.reduce((s, l) => s + l.quantity * l.unitPrice, 0);
  const tax = taxRate !== '' ? (subtotal * Number(taxRate)) / 100 : 0;
  const total = subtotal + tax;

  if (loading) {
    return (
      <div className="animate-fade-in space-y-6">
        <div className="h-10 w-48 animate-shimmer rounded-lg bg-background-elevated" />
        <div className="h-24 animate-shimmer rounded-xl bg-background-elevated" />
        <div className="h-64 animate-shimmer rounded-xl bg-background-elevated" />
      </div>
    );
  }

  return (
    <div className="relative animate-fade-in space-y-8 pb-16">
      <GlowBackground glowPosition="top-right" intensity="subtle" animated />

      {/* Header */}
      <div className="relative z-10 flex flex-col justify-between gap-4 border-b border-border/40 pb-6 sm:flex-row sm:items-center">
        <div>
          <h1 className="flex items-center gap-2.5 text-3xl font-extrabold tracking-tight text-white">
            <span className="inline-flex rounded-xl bg-primary-muted p-2 shadow-glow-sm">
              <Receipt className="h-6 w-6 text-primary" />
            </span>
            Invoices
          </h1>
          <p className="mt-2 text-foreground-muted">
            Create, send, and track payment for your brand deals.
          </p>
        </div>
        <Button
          onClick={openAdd}
          variant="primary"
          className="gap-1.5 self-start text-sm font-semibold shadow-glow-sm sm:self-center"
        >
          <Plus className="h-4 w-4" /> New Invoice
        </Button>
      </div>

      {/* Stat Band */}
      <div className="relative z-10 overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-r from-primary/20 via-accent/20 to-primary/20 p-6 shadow-glow">
        <div className="grid grid-cols-1 gap-6 divide-y divide-border/30 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          {[
            {
              label: 'Total Invoiced',
              value: formatCurrency(totalAmount),
              icon: <Receipt className="h-5 w-5 text-primary" />,
            },
            {
              label: 'Total Paid',
              value: formatCurrency(paidAmount),
              icon: <CheckCircle2 className="h-5 w-5 text-success" />,
            },
            {
              label: 'Overdue Amount',
              value: formatCurrency(overdueAmount),
              icon: <AlertCircle className="h-5 w-5 text-danger" />,
            },
          ].map((stat) => (
            <div
              key={stat.label}
              className="flex items-center gap-4 pt-4 first:pl-0 first:pt-0 sm:pl-6 sm:pt-0"
            >
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-background-surface/60">
                {stat.icon}
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-widest text-foreground-muted">
                  {stat.label}
                </p>
                <p className="font-mono text-xl font-extrabold text-white">{stat.value}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Invoice Table */}
      <div className="relative z-10">
        <Card variant="glass" className="overflow-hidden border-border/40">
          <CardContent className="p-0">
            {invoices.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left text-sm">
                  <thead>
                    <tr className="border-b border-border/40 bg-background-surface/40 text-xs font-semibold uppercase tracking-wider text-foreground-muted">
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
                      const cfg =
                        STATUS_CONFIG[
                          inv.isOverdue && inv.status !== 'PAID' ? 'OVERDUE' : inv.status
                        ] ?? STATUS_CONFIG.DRAFT;
                      const linkedDeal = deals.find((d) => d.id === inv.dealId);
                      return (
                        <tr
                          key={inv.id}
                          className="group transition-colors hover:bg-background-elevated/40"
                        >
                          <td className="p-4">
                            <span className="font-mono text-xs font-semibold text-primary">
                              {inv.invoiceNumber}
                            </span>
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
                            <div className="font-mono font-bold text-white">
                              {formatCurrency(Number(inv.totalAmount), inv.currency)}
                            </div>
                            {inv.taxRate && (
                              <div className="text-xs text-foreground-muted">
                                incl. {inv.taxRate}% tax
                              </div>
                            )}
                          </td>
                          <td className="p-4">
                            <span
                              className={cn(
                                'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold',
                                cfg.className,
                              )}
                            >
                              {cfg.icon} {cfg.label}
                            </span>
                          </td>
                          <td className="p-4">
                            <div
                              className={cn(
                                'flex items-center gap-1 text-xs font-medium',
                                inv.isOverdue ? 'text-danger' : 'text-foreground-muted',
                              )}
                            >
                              <CalendarClock className="h-3 w-3" />
                              {formatDate(inv.dueDate)}
                            </div>
                          </td>
                          <td className="p-4 text-center">
                            <div className="inline-flex gap-1.5 opacity-70 transition-opacity group-hover:opacity-100">
                              {!['PAID', 'CANCELLED'].includes(inv.status) && (
                                <button
                                  onClick={() => handleMarkPaid(inv.id, Number(inv.totalAmount))}
                                  className="rounded-lg border border-success/30 bg-success-muted/20 p-1.5 text-success transition-all hover:bg-success-muted"
                                  title="Mark as Paid"
                                >
                                  <CheckCircle2 className="h-3.5 w-3.5" />
                                </button>
                              )}
                              <button
                                onClick={() => openEdit(inv)}
                                className="rounded-lg border border-border bg-input/40 p-1.5 text-foreground-muted transition-all hover:border-primary/40 hover:bg-background-elevated hover:text-white"
                                title="Edit"
                              >
                                <Edit2 className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={() => handleDelete(inv.id)}
                                className="rounded-lg border border-border bg-input/40 p-1.5 text-foreground-muted transition-all hover:border-danger/40 hover:bg-danger-muted/20 hover:text-danger"
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
                <Receipt className="mx-auto mb-3 h-10 w-10 text-foreground-subtle" />
                <p className="text-base font-semibold text-white">No invoices yet</p>
                <p className="mx-auto mt-1 max-w-xs text-xs">
                  Create your first invoice to start tracking payments from brand deals.
                </p>
                <Button onClick={openAdd} variant="primary" size="sm" className="mt-4 gap-1.5">
                  <Plus className="h-4 w-4" /> Create First Invoice
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Slide-over Panel */}
      {panelOpen && (
        <div className="fixed inset-0 z-50 flex justify-end overflow-hidden">
          <div
            className="absolute inset-0 bg-background/60 backdrop-blur-sm"
            onClick={() => setPanelOpen(false)}
          />
          <div className="relative flex w-full max-w-xl animate-slide-in-right flex-col overflow-y-auto border-l border-border/50 bg-background-surface shadow-float-lg">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border/40 bg-background-surface p-6">
              <h2 className="text-lg font-bold text-white">
                {editingInvoice ? 'Edit Invoice' : 'New Invoice'}
              </h2>
              <button
                onClick={() => setPanelOpen(false)}
                className="rounded-lg p-2 text-foreground-muted transition-colors hover:bg-background-elevated hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 space-y-5 p-6">
              {formError && (
                <div className="rounded-lg border border-danger/30 bg-danger-muted/20 px-4 py-3 text-sm text-danger">
                  {formError}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-foreground-muted">
                    Brand Name *
                  </label>
                  <input
                    value={brandName}
                    onChange={(e) => setBrandName(e.target.value)}
                    required
                    className="w-full rounded-lg border border-border bg-input px-3 py-2.5 text-sm text-foreground transition-colors focus:border-primary focus:outline-none"
                    placeholder="Acme Corp"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-foreground-muted">
                    Brand Email *
                  </label>
                  <input
                    value={brandEmail}
                    onChange={(e) => setBrandEmail(e.target.value)}
                    required
                    type="email"
                    className="w-full rounded-lg border border-border bg-input px-3 py-2.5 text-sm text-foreground transition-colors focus:border-primary focus:outline-none"
                    placeholder="billing@brand.com"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-foreground-muted">
                    Link to Deal
                  </label>
                  <select
                    value={dealId}
                    onChange={(e) => setDealId(e.target.value)}
                    className="w-full rounded-lg border border-border bg-input px-3 py-2.5 text-sm text-foreground transition-colors focus:border-primary focus:outline-none"
                  >
                    <option value="">— None —</option>
                    {deals.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.brandName} — {d.title}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-foreground-muted">
                    Payment Terms
                  </label>
                  <select
                    value={paymentTerms}
                    onChange={(e) => setPaymentTerms(e.target.value)}
                    className="w-full rounded-lg border border-border bg-input px-3 py-2.5 text-sm text-foreground transition-colors focus:border-primary focus:outline-none"
                  >
                    {PAYMENT_TERMS.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-foreground-muted">
                    Issue Date
                  </label>
                  <input
                    value={issuedAt}
                    onChange={(e) => setIssuedAt(e.target.value)}
                    type="date"
                    className="w-full rounded-lg border border-border bg-input px-3 py-2.5 text-sm text-foreground transition-colors focus:border-primary focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-foreground-muted">
                    Tax Rate (%)
                  </label>
                  <input
                    value={taxRate}
                    onChange={(e) =>
                      setTaxRate(e.target.value === '' ? '' : Number(e.target.value))
                    }
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    className="w-full rounded-lg border border-border bg-input px-3 py-2.5 text-sm text-foreground transition-colors focus:border-primary focus:outline-none"
                    placeholder="e.g. 8.5"
                  />
                </div>
              </div>

              {/* Line Items */}
              <div>
                <div className="mb-3 flex items-center justify-between">
                  <label className="text-xs font-semibold uppercase tracking-wider text-foreground-muted">
                    Line Items
                  </label>
                  <button
                    type="button"
                    onClick={addLineItem}
                    className="flex items-center gap-1 text-xs text-primary transition-colors hover:text-primary-hover"
                  >
                    <Plus className="h-3.5 w-3.5" /> Add item
                  </button>
                </div>
                <div className="space-y-2">
                  {lineItems.map((item, idx) => (
                    <div key={idx} className="grid grid-cols-12 items-center gap-2">
                      <input
                        value={item.description}
                        onChange={(e) => updateLineItem(idx, 'description', e.target.value)}
                        className="col-span-5 rounded-lg border border-border bg-input px-2.5 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
                        placeholder="Description"
                      />
                      <input
                        value={item.quantity}
                        onChange={(e) => updateLineItem(idx, 'quantity', Number(e.target.value))}
                        type="number"
                        min="0.01"
                        step="0.01"
                        className="col-span-2 rounded-lg border border-border bg-input px-2.5 py-2 text-center text-xs text-foreground focus:border-primary focus:outline-none"
                        placeholder="Qty"
                      />
                      <input
                        value={item.unitPrice}
                        onChange={(e) => updateLineItem(idx, 'unitPrice', Number(e.target.value))}
                        type="number"
                        min="0"
                        step="1"
                        className="col-span-3 rounded-lg border border-border bg-input px-2.5 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
                        placeholder="Unit $"
                      />
                      <div className="col-span-1 text-right font-mono text-xs text-foreground-muted">
                        ${(item.quantity * item.unitPrice).toFixed(0)}
                      </div>
                      {lineItems.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeLineItem(idx)}
                          className="col-span-1 p-1 text-foreground-subtle transition-colors hover:text-danger"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                {/* Totals */}
                <div className="mt-4 space-y-1 border-t border-border/40 pt-3 text-xs">
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
                  <div className="flex justify-between border-t border-border/40 pt-2 font-bold text-white">
                    <span>Total</span>
                    <span className="font-mono text-primary">${total.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-foreground-muted">
                  Notes
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  className="w-full resize-none rounded-lg border border-border bg-input px-3 py-2.5 text-sm text-foreground transition-colors focus:border-primary focus:outline-none"
                  placeholder="Payment instructions, late fee notice, etc."
                />
              </div>

              <div className="sticky bottom-0 flex gap-3 bg-background-surface pb-4 pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  className="flex-1"
                  onClick={() => setPanelOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  className="flex-1 shadow-glow-sm"
                  disabled={saving}
                >
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

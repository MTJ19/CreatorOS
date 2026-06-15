/* eslint-disable */
'use client';

import * as React from 'react';
import { useSession } from 'next-auth/react';
import {
  Handshake,
  Plus,
  Trash2,
  Edit2,
  Calendar,
  DollarSign,
  Link2,
  X,
  TrendingUp,
  BarChart3,
  ExternalLink,
  ChevronRight,
  List,
  Kanban,
  Search,
  ArrowDownLeft,
  ArrowUpRight,
  Building2,
  Users,
  Globe,
  Tag,
  Mail,
  Instagram,
  FileText,
  Clock,
  Check,
  Copy,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { GlowBackground } from '@/components/ui/glow-background';
import { dealsApi, brandPortalApi } from '@/lib/api-client';
import { dealStatusVariant } from '@/lib/status-variants';
import { useToast } from '@/components/ui/toast';
import { DndContext, type DragEndEvent, useDroppable, useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';

const KANBAN_STAGES = [
  { value: 'NEW_INQUIRY', label: 'New Inquiry', color: 'border-t-indigo-500' },
  { value: 'QUALIFIED', label: 'Qualified', color: 'border-t-sky-500' },
  { value: 'PITCH_SENT', label: 'Pitch Sent', color: 'border-t-purple-500' },
  { value: 'NEGOTIATING', label: 'Negotiating', color: 'border-t-amber-500' },
  { value: 'CONTRACT_SENT', label: 'Contract Sent', color: 'border-t-orange-500' },
  { value: 'ACTIVE', label: 'Active', color: 'border-t-violet-500' },
  { value: 'COMPLETED', label: 'Completed', color: 'border-t-emerald-500' },
  { value: 'LOST', label: 'Lost', color: 'border-t-rose-500' },
];

const DEAL_SOURCES = [
  { value: 'INBOUND', label: 'Inbound', icon: ArrowDownLeft },
  { value: 'OUTBOUND', label: 'Outbound', icon: ArrowUpRight },
  { value: 'AGENCY', label: 'Agency', icon: Building2 },
  { value: 'REFERRAL', label: 'Referral', icon: Users },
  { value: 'PLATFORM', label: 'Platform', icon: Globe },
];

const CURRENCIES = ['USD', 'EUR', 'GBP', 'CAD', 'AUD'];

const DELIVERABLE_TYPES = [
  { value: 'INSTAGRAM_POST', label: 'Instagram Post' },
  { value: 'INSTAGRAM_REEL', label: 'Instagram Reel' },
  { value: 'INSTAGRAM_STORY', label: 'Instagram Story' },
  { value: 'YOUTUBE_VIDEO', label: 'YouTube Video' },
  { value: 'YOUTUBE_SHORT', label: 'YouTube Short' },
  { value: 'TIKTOK_VIDEO', label: 'TikTok Video' },
  { value: 'TWITTER_POST', label: 'Twitter Post' },
  { value: 'LINKEDIN_POST', label: 'LinkedIn Post' },
  { value: 'BLOG_POST', label: 'Blog Post' },
  { value: 'PODCAST_MENTION', label: 'Podcast Mention' },
  { value: 'LIVE_STREAM', label: 'Live Stream' },
  { value: 'NEWSLETTER', label: 'Newsletter' },
  { value: 'UGC_CONTENT', label: 'UGC Content' },
  { value: 'OTHER', label: 'Other' },
];

// Helper to get Source icon
const getSourceIcon = (source: string) => {
  const matched = DEAL_SOURCES.find(s => s.value === source);
  return matched ? matched.icon : Tag;
};

// Droppable Column Component
function KanbanColumn({
  stage,
  label,
  deals,
  onEdit,
  onDelete,
  activeDragStage,
}: {
  stage: string;
  label: string;
  deals: any[];
  onEdit: (deal: any) => void;
  onDelete: (id: string) => void;
  activeDragStage: string | null;
}) {
  const { isOver, setNodeRef } = useDroppable({
    id: stage,
  });

  const isHighlighted = isOver || (activeDragStage && activeDragStage === stage);

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'flex-shrink-0 w-80 rounded-xl p-4 flex flex-col h-[650px] transition-all duration-200 border',
        isHighlighted
          ? 'bg-gradient-to-b from-primary/10 to-accent/5 border-primary/50 shadow-glow-sm'
          : 'border-border/30 bg-background-surface/30'
      )}
    >
      {/* Column Header */}
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-border/20">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-white text-sm">{label}</span>
          <span className="text-xs bg-background-elevated px-2 py-0.5 rounded-full text-foreground-muted font-mono">
            {deals.length}
          </span>
        </div>
      </div>

      {/* Cards List */}
      <div className="flex-1 overflow-y-auto space-y-3 pr-1 scrollbar-thin">
        {deals.map(deal => (
          <DraggableCard
            key={deal.id}
            deal={deal}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))}
        {deals.length === 0 && (
          <div className="h-24 flex items-center justify-center border border-dashed border-border/20 rounded-lg text-foreground-subtle text-xs">
            No deals in this stage
          </div>
        )}
      </div>
    </div>
  );
}

// Draggable Card Component
function DraggableCard({
  deal,
  onEdit,
  onDelete,
}: {
  deal: any;
  onEdit: (deal: any) => void;
  onDelete: (id: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: deal.id,
  });

  const style = transform
    ? {
        transform: CSS.Translate.toString(transform),
      }
    : undefined;

  const SourceIcon = getSourceIcon(deal.dealSource);

  // Performance rating badge color mapper
  const getRatingBadge = (rating: string) => {
    switch (rating) {
      case 'HIGH':
        return <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-400 bg-emerald-950/40 border border-emerald-900/30 px-1.5 py-0.5 rounded">🟢 High ER</span>;
      case 'MEDIUM':
        return <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-400 bg-amber-950/40 border border-amber-900/30 px-1.5 py-0.5 rounded">🟡 Avg ER</span>;
      case 'LOW':
        return <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-rose-400 bg-rose-950/40 border border-rose-900/30 px-1.5 py-0.5 rounded">🔴 Low ER</span>;
      default:
        return null;
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'bg-background-elevated/70 border border-border/40 hover:border-primary/45 rounded-lg p-3.5 space-y-3 shadow-sm transition-all duration-150 relative group cursor-grab active:cursor-grabbing',
        isDragging && 'opacity-40 border-primary/50'
      )}
    >
      {/* Header (Source & Brand) */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded bg-background/50 border border-border/30 text-foreground-muted">
            <SourceIcon className="h-3.5 w-3.5" />
          </div>
          <span className="text-xs font-semibold text-foreground-muted truncate max-w-[130px]">
            {deal.brandName}
          </span>
        </div>

        {/* Action buttons (hidden by default, shown on hover) */}
        <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity duration-150 absolute top-2 right-2 bg-background-elevated/90 pl-1.5 rounded">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit(deal);
            }}
            className="p-1 text-foreground-muted hover:text-white rounded hover:bg-background/40"
            aria-label="Edit deal"
            {...listeners} // prevent drag triggering on action buttons
            onMouseDown={(e) => e.stopPropagation()}
          >
            <Edit2 className="h-3 w-3" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(deal.id);
            }}
            className="p-1 text-foreground-muted hover:text-danger rounded hover:bg-background/40"
            aria-label="Delete deal"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <Trash2 className="h-3 w-3" />
          </button>
        </div>
      </div>

      {/* Body: Title */}
      <div {...listeners} {...attributes}>
        <p className="font-semibold text-white text-sm line-clamp-2 leading-snug">
          {deal.title}
        </p>
      </div>

      {/* Footer: Price, Deadline, and Performance */}
      <div className="flex items-end justify-between border-t border-border/20 pt-2 text-[11px]" {...listeners} {...attributes}>
        <div>
          <span className="text-white font-mono font-bold">
            {new Intl.NumberFormat(undefined, { style: 'currency', currency: deal.currency || 'USD', maximumFractionDigits: 0 }).format(Number(deal.amount))}
          </span>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          {deal.computed?.performanceRating && getRatingBadge(deal.computed.performanceRating)}
          {deal.deadline && (
            <span className="text-foreground-subtle flex items-center gap-0.5">
              <Calendar className="h-2.5 w-2.5" />
              {new Date(deal.deadline).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export default function DealsPage() {
  const { data: session } = useSession();
  const accessToken = (session as any)?.accessToken;
  const { toast } = useToast();

  // States
  const [deals, setDeals] = React.useState<any[]>([]);
  const [portalTokens, setPortalTokens] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [viewMode, setViewMode] = React.useState<'kanban' | 'list'>('kanban');
  const [searchQuery, setSearchQuery] = React.useState('');
  const [sourceFilter, setSourceFilter] = React.useState('ALL');
  const [activeDragId, setActiveDragId] = React.useState<string | null>(null);

  // Form Panel
  const [panelOpen, setPanelOpen] = React.useState(false);
  const [editingDeal, setEditingDeal] = React.useState<any | null>(null);
  const [formError, setFormError] = React.useState<string | null>(null);
  const [formLoading, setFormLoading] = React.useState(false);

  // Brand Portal states
  const [generatingPortalLink, setGeneratingPortalLink] = React.useState(false);
  const [copiedPortalLinkId, setCopiedPortalLinkId] = React.useState<string | null>(null);
  const [portalNote, setPortalNote] = React.useState('');
  const [portalExpiresInDays, setPortalExpiresInDays] = React.useState(30);
  const [showPortalSubform, setShowPortalSubform] = React.useState(false);

  // Form Field States
  const [brandName, setBrandName] = React.useState('');
  const [brandEmail, setBrandEmail] = React.useState('');
  const [brandWebsite, setBrandWebsite] = React.useState('');
  const [brandInstagram, setBrandInstagram] = React.useState('');
  const [dealSource, setDealSource] = React.useState('INBOUND');
  const [title, setTitle] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [amount, setAmount] = React.useState(0);
  const [currency, setCurrency] = React.useState('USD');
  const [status, setStatus] = React.useState('DRAFT');
  const [stage, setStage] = React.useState('NEW_INQUIRY');
  const [quotedAmount, setQuotedAmount] = React.useState<number | ''>('');
  const [offeredAmount, setOfferedAmount] = React.useState<number | ''>('');
  const [deadline, setDeadline] = React.useState('');
  const [followUpReminder, setFollowUpReminder] = React.useState('');
  const [exclusivityDays, setExclusivityDays] = React.useState<number | ''>('');
  const [exclusivityNotes, setExclusivityNotes] = React.useState('');
  const [usageRights, setUsageRights] = React.useState('');
  const [notes, setNotes] = React.useState('');
  const [tagsInput, setTagsInput] = React.useState('');

  // Deliverables Sub-form State
  const [deliverables, setDeliverables] = React.useState<any[]>([]);

  // Fetch Deals and Portal Tokens
  const fetchDeals = React.useCallback(async () => {
    if (!accessToken) return;
    try {
      setLoading(true);
      const [dealsData, tokensData] = await Promise.all([
        dealsApi.getAll(accessToken),
        brandPortalApi.listTokens(accessToken).catch(() => []),
      ]);
      setDeals(dealsData);
      setPortalTokens(tokensData);
    } catch (err) {
      console.error('Failed to fetch deals:', err);
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  React.useEffect(() => {
    fetchDeals();
  }, [fetchDeals]);

  // Handle Drag Over column
  const handleDragStart = (event: any) => {
    setActiveDragId(event.active.id);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveDragId(null);
    const { active, over } = event;
    if (!over) return;

    const dealId = active.id as string;
    const toStage = over.id as string;

    const deal = deals.find(d => d.id === dealId);
    if (!deal || deal.stage === toStage) return;

    // Optimistically update
    const originalDeals = [...deals];
    setDeals(prev =>
      prev.map(d => (d.id === dealId ? { ...d, stage: toStage } : d))
    );

    try {
      await dealsApi.updateStage(accessToken, dealId, toStage);
    } catch (err: any) {
      console.error('Failed to change stage:', err);
      // Rollback
      setDeals(originalDeals);
      alert(`Could not change stage: ${err.message || 'Invalid transition'}`);
    }
  };

  // Open Form for Add
  const handleOpenAdd = () => {
    setEditingDeal(null);
    setBrandName('');
    setBrandEmail('');
    setBrandWebsite('');
    setBrandInstagram('');
    setDealSource('INBOUND');
    setTitle('');
    setDescription('');
    setAmount(0);
    setCurrency('USD');
    setStatus('DRAFT');
    setStage('NEW_INQUIRY');
    setQuotedAmount('');
    setOfferedAmount('');
    setDeadline('');
    setFollowUpReminder('');
    setExclusivityDays('');
    setExclusivityNotes('');
    setUsageRights('');
    setNotes('');
    setTagsInput('');
    setDeliverables([]);
    setFormError(null);
    setShowPortalSubform(false);
    setPortalNote('');
    setPanelOpen(true);
  };

  // Open Form for Edit
  const handleOpenEdit = (deal: any) => {
    setEditingDeal(deal);
    setBrandName(deal.brandName || '');
    setBrandEmail(deal.brandEmail || '');
    setBrandWebsite(deal.brandWebsite || '');
    setBrandInstagram(deal.brandInstagram || '');
    setDealSource(deal.dealSource || 'INBOUND');
    setTitle(deal.title || '');
    setDescription(deal.description || '');
    setAmount(Number(deal.amount) || 0);
    setCurrency(deal.currency || 'USD');
    setStatus(deal.status || 'DRAFT');
    setStage(deal.stage || 'NEW_INQUIRY');
    setQuotedAmount(deal.quotedAmount ? Number(deal.quotedAmount) : '');
    setOfferedAmount(deal.offeredAmount ? Number(deal.offeredAmount) : '');
    setDeadline(deal.deadline ? new Date(deal.deadline).toISOString().split('T')[0] : '');
    setFollowUpReminder(deal.followUpReminder ? new Date(deal.followUpReminder).toISOString().split('T')[0] : '');
    setExclusivityDays(deal.exclusivityDays !== null ? Number(deal.exclusivityDays) : '');
    setExclusivityNotes(deal.exclusivityNotes || '');
    setUsageRights(deal.usageRights || '');
    setNotes(deal.notes || '');
    setTagsInput((deal.tags || []).join(', '));

    // Map existing deliverables
    const dels = (deal.deliverables || []).map((d: any) => ({
      type: d.type,
      dueDate: new Date(d.dueDate).toISOString().split('T')[0],
      description: d.description || '',
      notes: d.notes || '',
      platform: d.platform || '',
    }));
    setDeliverables(dels);

    setFormError(null);
    setShowPortalSubform(false);
    setPortalNote('');
    setPanelOpen(true);
  };

  // Generate portal link directly from deal form
  const handleGeneratePortalLinkFromForm = async (dealId: string, bName: string, bEmail: string) => {
    if (!accessToken) return;
    if (!bName.trim() || !bEmail.trim()) {
      toast('Brand Name and Contact Email are required to generate collaboration link', 'error');
      return;
    }
    try {
      setGeneratingPortalLink(true);
      const payload = {
        brandName: bName.trim(),
        brandEmail: bEmail.trim(),
        dealId,
        expiresInDays: portalExpiresInDays,
        permissions: ['VIEW_DELIVERABLES', 'APPROVE_CONTENT'],
        brandNote: portalNote.trim() || undefined,
      };

      const result = await brandPortalApi.generateToken(accessToken, payload);
      toast('Portal link generated and copied to clipboard!', 'success');
      if (result.portalUrl) {
        navigator.clipboard.writeText(result.portalUrl);
      }
      setPortalNote('');
      setShowPortalSubform(false);

      // Re-fetch tokens
      const tokensList = await brandPortalApi.listTokens(accessToken);
      setPortalTokens(tokensList);
    } catch (err: any) {
      toast(err.message || 'Failed to generate portal link', 'error');
    } finally {
      setGeneratingPortalLink(false);
    }
  };

  // Revoke portal link directly from deal form
  const handleRevokePortalLinkFromForm = async (tokenId: string) => {
    if (!accessToken) return;
    if (!confirm('Are you sure you want to revoke this link? The brand will lose access immediately.')) {
      return;
    }
    try {
      await brandPortalApi.revokeToken(accessToken, tokenId);
      toast('Portal access revoked', 'success');
      // Re-fetch tokens
      const tokensList = await brandPortalApi.listTokens(accessToken);
      setPortalTokens(tokensList);
    } catch (err: any) {
      toast(err.message || 'Failed to revoke link', 'error');
    }
  };

  // Handle Form Submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken) return;

    if (!brandName.trim()) {
      setFormError('Brand name is required.');
      return;
    }
    if (!title.trim()) {
      setFormError('Deal title is required.');
      return;
    }
    if (amount <= 0) {
      setFormError('Amount must be greater than 0.');
      return;
    }

    // Validate deliverables
    for (const d of deliverables) {
      if (!d.dueDate) {
        setFormError('Deliverable due date is required.');
        return;
      }
    }

    setFormLoading(true);
    setFormError(null);

    const payload = {
      brandName,
      brandEmail: brandEmail || undefined,
      brandWebsite: brandWebsite || undefined,
      brandInstagram: brandInstagram || undefined,
      dealSource,
      title,
      description: description || undefined,
      amount,
      currency,
      status,
      stage,
      quotedAmount: quotedAmount !== '' ? Number(quotedAmount) : undefined,
      offeredAmount: offeredAmount !== '' ? Number(offeredAmount) : undefined,
      startDate: editingDeal?.startDate || undefined,
      endDate: editingDeal?.endDate || undefined,
      deadline: deadline ? new Date(deadline).toISOString() : undefined,
      followUpReminder: followUpReminder ? new Date(followUpReminder).toISOString() : undefined,
      exclusivityDays: exclusivityDays !== '' ? Number(exclusivityDays) : undefined,
      exclusivityNotes: exclusivityNotes || undefined,
      usageRights: usageRights || undefined,
      notes: notes || undefined,
      tags: tagsInput.split(',').map(t => t.trim()).filter(Boolean),
      deliverables,
    };

    try {
      if (editingDeal) {
        await dealsApi.update(accessToken, editingDeal.id, payload);
      } else {
        await dealsApi.create(accessToken, payload);
      }
      setPanelOpen(false);
      fetchDeals();
    } catch (err: any) {
      setFormError(err.message || 'Failed to save deal');
    } finally {
      setFormLoading(false);
    }
  };

  // Handle Delete
  const handleDelete = async (id: string) => {
    if (!accessToken) return;
    if (!confirm('Are you sure you want to delete this brand deal? All linked deliverables will be lost.')) return;

    try {
      await dealsApi.delete(accessToken, id);
      fetchDeals();
    } catch (err: any) {
      console.error('Failed to delete deal:', err);
      alert(`Could not delete: ${err.message || 'Error occurred'}`);
    }
  };

  // Add Deliverable Helper
  const handleAddDeliverable = () => {
    setDeliverables(prev => [
      ...prev,
      {
        type: 'INSTAGRAM_REEL',
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        description: '',
        notes: '',
        platform: '',
      },
    ]);
  };

  // Remove Deliverable Helper
  const handleRemoveDeliverable = (index: number) => {
    setDeliverables(prev => prev.filter((_, i) => i !== index));
  };

  // Update Deliverable Field Helper
  const handleUpdateDeliverable = (index: number, field: string, value: any) => {
    setDeliverables(prev =>
      prev.map((d, i) => (i === index ? { ...d, [field]: value } : d))
    );
  };

  // Filter Deals
  const filteredDeals = deals.filter(deal => {
    const matchesSearch =
      deal.brandName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      deal.title?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSource = sourceFilter === 'ALL' || deal.dealSource === sourceFilter;
    return matchesSearch && matchesSource;
  });

  const draggingDeal = activeDragId ? deals.find(d => d.id === activeDragId) : null;
  const activeDragStage = draggingDeal ? draggingDeal.stage : null;

  return (
    <div className="relative space-y-8 animate-fade-in pb-16">
      <GlowBackground glowPosition="top-right" intensity="subtle" animated />

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/40 pb-6 relative z-10">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-primary-muted inline-flex shadow-glow-sm">
              <Handshake className="h-6 w-6 text-primary" />
            </span>
            Deal Pipeline CRM
          </h1>
          <p className="mt-2 text-foreground-muted">
            Track and progress brand deals through inquiry, pitch, contract negotiation, and activation.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* View Toggle */}
          <div className="flex bg-background-surface/80 border border-border/45 rounded-lg p-0.5">
            <button
              onClick={() => setViewMode('kanban')}
              className={cn(
                'p-1.5 rounded-md text-foreground-muted hover:text-white transition-all',
                viewMode === 'kanban' && 'bg-primary text-white font-semibold'
              )}
              aria-label="Kanban view"
            >
              <Kanban className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={cn(
                'p-1.5 rounded-md text-foreground-muted hover:text-white transition-all',
                viewMode === 'list' && 'bg-primary text-white font-semibold'
              )}
              aria-label="Table list view"
            >
              <List className="h-4 w-4" />
            </button>
          </div>

          <Button
            onClick={handleOpenAdd}
            variant="primary"
            className="gap-1.5 font-semibold text-sm shadow-glow-sm"
          >
            <Plus className="h-4 w-4" /> New Deal
          </Button>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div className="relative z-10 flex flex-col md:flex-row md:items-center gap-4 bg-background-surface/30 border border-border/30 rounded-xl p-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground-subtle" />
          <input
            type="text"
            placeholder="Search brand or deal title..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-lg bg-input/50 border border-border/45 text-sm text-white focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        {/* Source Filter */}
        <div className="flex items-center gap-2">
          <label htmlFor="source-filter" className="text-xs font-semibold text-foreground-muted uppercase tracking-wider">
            Source:
          </label>
          <select
            id="source-filter"
            value={sourceFilter}
            onChange={e => setSourceFilter(e.target.value)}
            className="px-3 py-1.5 rounded-lg bg-input border border-border text-xs text-white focus:outline-none focus:ring-1 focus:ring-ring cursor-pointer"
          >
            <option value="ALL">All Sources</option>
            {DEAL_SOURCES.map(s => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="h-96 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary" />
        </div>
      )}

      {/* Content views */}
      {!loading && (
        <div className="relative z-10">
          {viewMode === 'kanban' ? (
            /* ── KANBAN PIPELINE ──────────────────────────────── */
            <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
              <div className="flex gap-4 overflow-x-auto pb-6 scrollbar-thin select-none">
                {KANBAN_STAGES.map(stageObj => {
                  const stageDeals = filteredDeals.filter(d => d.stage === stageObj.value);
                  return (
                    <KanbanColumn
                      key={stageObj.value}
                      stage={stageObj.value}
                      label={stageObj.label}
                      deals={stageDeals}
                      onEdit={handleOpenEdit}
                      onDelete={handleDelete}
                      activeDragStage={activeDragStage}
                    />
                  );
                })}
              </div>
            </DndContext>
          ) : (
            /* ── TABLE LIST VIEW ──────────────────────────────── */
            <Card variant="glass" className="border-border/40 overflow-hidden">
              <CardContent className="p-0">
                {filteredDeals.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-sm">
                      <thead>
                        <tr className="border-b border-border/40 bg-background-surface/40 text-foreground-muted font-semibold">
                          <th className="p-4">Brand / Campaign</th>
                          <th className="p-4">Stage</th>
                          <th className="p-4">Source</th>
                          <th className="p-4 text-right">Amount</th>
                          <th className="p-4">Deliverables</th>
                          <th className="p-4">Deadline</th>
                          <th className="p-4 text-center">Rating</th>
                          <th className="p-4 text-center">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/20">
                        {filteredDeals.map(deal => {
                          const SourceIcon = getSourceIcon(deal.dealSource);
                          const statusVariant = dealStatusVariant[deal.status as keyof typeof dealStatusVariant];

                          return (
                            <tr
                              key={deal.id}
                              className="hover:bg-background-elevated/40 transition-colors duration-150 group"
                            >
                              <td className="p-4">
                                <div className="space-y-0.5">
                                  <div className="font-semibold text-white text-sm">
                                    {deal.title}
                                  </div>
                                  <div className="text-xs text-foreground-muted">
                                    {deal.brandName}
                                  </div>
                                </div>
                              </td>
                              <td className="p-4">
                                <Badge variant={statusVariant} dot enumLabel>
                                  {deal.stage}
                                </Badge>
                              </td>
                              <td className="p-4">
                                <div className="inline-flex items-center gap-1 text-xs text-foreground-muted bg-background/40 border border-border/30 px-2 py-0.5 rounded">
                                  <SourceIcon className="h-3 w-3" />
                                  {deal.dealSource}
                                </div>
                              </td>
                              <td className="p-4 text-right font-mono text-white font-semibold">
                                {new Intl.NumberFormat(undefined, { style: 'currency', currency: deal.currency || 'USD' }).format(Number(deal.amount))}
                              </td>
                              <td className="p-4">
                                <span className="text-xs text-white bg-primary-muted/20 border border-primary/20 px-2 py-1 rounded font-medium">
                                  {deal.deliverables?.length || 0} Deliverables
                                </span>
                              </td>
                              <td className="p-4">
                                {deal.deadline ? (
                                  <span className="text-xs text-foreground-muted flex items-center gap-1">
                                    <Clock className="h-3.5 w-3.5" />
                                    {new Date(deal.deadline).toLocaleDateString(undefined, {
                                      month: 'short',
                                      day: 'numeric',
                                      year: 'numeric',
                                    })}
                                  </span>
                                ) : (
                                  <span className="text-xs text-foreground-subtle">—</span>
                                )}
                              </td>
                              <td className="p-4 text-center">
                                {deal.computed?.performanceRating === 'HIGH' && <span className="text-emerald-400 font-bold">🟢 High</span>}
                                {deal.computed?.performanceRating === 'MEDIUM' && <span className="text-amber-400 font-bold">🟡 Mid</span>}
                                {deal.computed?.performanceRating === 'LOW' && <span className="text-rose-400 font-bold">🔴 Low</span>}
                                {(!deal.computed?.performanceRating || deal.computed.performanceRating === 'NONE') && <span className="text-foreground-subtle">—</span>}
                              </td>
                              <td className="p-4 text-center">
                                <div className="inline-flex gap-1.5 opacity-80 group-hover:opacity-100 transition-opacity">
                                  <button
                                    onClick={() => handleOpenEdit(deal)}
                                    className="p-1.5 rounded-lg border border-border bg-input/40 hover:bg-background-elevated hover:border-primary/40 text-foreground-muted hover:text-white transition-all"
                                    aria-label="Edit deal"
                                  >
                                    <Edit2 className="h-3.5 w-3.5" />
                                  </button>
                                  <button
                                    onClick={() => handleDelete(deal.id)}
                                    className="p-1.5 rounded-lg border border-border bg-input/40 hover:bg-danger-muted/20 hover:border-danger/40 text-foreground-muted hover:text-danger transition-all"
                                    aria-label="Delete deal"
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
                    <Handshake className="h-10 w-10 text-foreground-subtle mx-auto mb-3" />
                    <p className="text-base font-semibold text-white">No deals match criteria</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Slide-over Form Panel */}
      {panelOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-background/60 backdrop-blur-sm transition-opacity"
            onClick={() => setPanelOpen(false)}
          />

          {/* Form Container */}
          <div className="relative w-full max-w-xl bg-background-overlay border-l border-border/60 shadow-float-lg h-full flex flex-col z-10 animate-slide-in-right">
            {/* Header */}
            <div className="p-5 border-b border-border/40 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-white">
                  {editingDeal ? 'Edit Brand Deal' : 'New Brand Deal'}
                </h3>
                <p className="text-xs text-foreground-muted mt-0.5">
                  {editingDeal ? 'Update details, stage, and deliverables.' : 'Log an inbound inquiry or outbound pitch.'}
                </p>
              </div>
              <button
                onClick={() => setPanelOpen(false)}
                className="p-1.5 rounded-lg hover:bg-background-elevated text-foreground-muted hover:text-white transition-all"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Scrollable Form */}
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-6">
              {/* Brand Info */}
              <div className="space-y-4">
                <span className="text-xs font-bold text-primary uppercase tracking-widest block border-b border-border/20 pb-1">
                  Brand Details
                </span>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5 col-span-2">
                    <label htmlFor="form-brand-name" className="text-xs font-semibold text-foreground uppercase tracking-wider">
                      Brand Name <span className="text-danger">*</span>
                    </label>
                    <input
                      id="form-brand-name"
                      type="text"
                      placeholder="e.g. Nike, Notion"
                      value={brandName}
                      onChange={e => setBrandName(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg text-sm bg-input border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="form-brand-email" className="text-xs font-semibold text-foreground uppercase tracking-wider">
                      Brand Contact Email
                    </label>
                    <input
                      id="form-brand-email"
                      type="email"
                      placeholder="sponsor@brand.com"
                      value={brandEmail}
                      onChange={e => setBrandEmail(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg text-sm bg-input border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="form-brand-insta" className="text-xs font-semibold text-foreground uppercase tracking-wider">
                      Brand Instagram Handle
                    </label>
                    <div className="relative">
                      <Instagram className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-foreground-subtle" />
                      <input
                        id="form-brand-insta"
                        type="text"
                        placeholder="brandhandle"
                        value={brandInstagram}
                        onChange={e => setBrandInstagram(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 rounded-lg text-sm bg-input border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5 col-span-2">
                    <label htmlFor="form-brand-web" className="text-xs font-semibold text-foreground uppercase tracking-wider">
                      Brand Website
                    </label>
                    <input
                      id="form-brand-web"
                      type="url"
                      placeholder="https://brand.com"
                      value={brandWebsite}
                      onChange={e => setBrandWebsite(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg text-sm bg-input border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                </div>
              </div>

              {/* Campaign Info */}
              <div className="space-y-4">
                <span className="text-xs font-bold text-primary uppercase tracking-widest block border-b border-border/20 pb-1">
                  Campaign Settings
                </span>
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label htmlFor="form-deal-title" className="text-xs font-semibold text-foreground uppercase tracking-wider">
                      Deal Campaign Title <span className="text-danger">*</span>
                    </label>
                    <input
                      id="form-deal-title"
                      type="text"
                      placeholder="e.g. Summer Release Reel"
                      value={title}
                      onChange={e => setTitle(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg text-sm bg-input border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label htmlFor="form-deal-source" className="text-xs font-semibold text-foreground uppercase tracking-wider">
                        Deal Source
                      </label>
                      <select
                        id="form-deal-source"
                        value={dealSource}
                        onChange={e => setDealSource(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg text-sm bg-input border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-ring cursor-pointer"
                      >
                        {DEAL_SOURCES.map(s => (
                          <option key={s.value} value={s.value}>{s.label}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label htmlFor="form-deal-currency" className="text-xs font-semibold text-foreground uppercase tracking-wider">
                        Currency
                      </label>
                      <select
                        id="form-deal-currency"
                        value={currency}
                        onChange={e => setCurrency(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg text-sm bg-input border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-ring cursor-pointer"
                      >
                        {CURRENCIES.map(c => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label htmlFor="form-deal-amount" className="text-xs font-semibold text-foreground uppercase tracking-wider">
                        Contracted Amount ($) <span className="text-danger">*</span>
                      </label>
                      <input
                        id="form-deal-amount"
                        type="number"
                        min="0"
                        value={amount}
                        onChange={e => setAmount(Number(e.target.value) || 0)}
                        className="w-full px-3 py-2 rounded-lg text-sm bg-input border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-ring font-mono"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label htmlFor="form-quoted-amount" className="text-xs font-semibold text-foreground uppercase tracking-wider">
                        Quoted Pitch Amount ($)
                      </label>
                      <input
                        id="form-quoted-amount"
                        type="number"
                        min="0"
                        value={quotedAmount}
                        onChange={e => setQuotedAmount(e.target.value === '' ? '' : Number(e.target.value) || 0)}
                        className="w-full px-3 py-2 rounded-lg text-sm bg-input border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-ring font-mono"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label htmlFor="form-offered-amount" className="text-xs font-semibold text-foreground uppercase tracking-wider">
                        Offered Amount ($)
                      </label>
                      <input
                        id="form-offered-amount"
                        type="number"
                        min="0"
                        value={offeredAmount}
                        onChange={e => setOfferedAmount(e.target.value === '' ? '' : Number(e.target.value) || 0)}
                        className="w-full px-3 py-2 rounded-lg text-sm bg-input border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-ring font-mono"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label htmlFor="form-deal-status" className="text-xs font-semibold text-foreground uppercase tracking-wider">
                        Deal Status
                      </label>
                      <select
                        id="form-deal-status"
                        value={status}
                        onChange={e => setStatus(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg text-sm bg-input border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-ring cursor-pointer"
                      >
                        <option value="DRAFT">Draft</option>
                        <option value="NEGOTIATING">Negotiating</option>
                        <option value="PENDING_CONTRACT">Pending Contract</option>
                        <option value="ACTIVE">Active</option>
                        <option value="COMPLETED">Completed</option>
                        <option value="CANCELLED">Cancelled</option>
                        <option value="DISPUTED">Disputed</option>
                      </select>
                    </div>

                    <div className="space-y-1.5 col-span-2">
                      <label htmlFor="form-deal-stage" className="text-xs font-semibold text-foreground uppercase tracking-wider">
                        CRM Pipeline Stage
                      </label>
                      <select
                        id="form-deal-stage"
                        value={stage}
                        onChange={e => setStage(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg text-sm bg-input border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-ring cursor-pointer"
                      >
                        {KANBAN_STAGES.map(s => (
                          <option key={s.value} value={s.value}>{s.label}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label htmlFor="form-deadline" className="text-xs font-semibold text-foreground uppercase tracking-wider">
                        Final Deadline
                      </label>
                      <input
                        id="form-deadline"
                        type="date"
                        value={deadline}
                        onChange={e => setDeadline(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg text-sm bg-input border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label htmlFor="form-followup" className="text-xs font-semibold text-foreground uppercase tracking-wider">
                        Follow-Up Reminder
                      </label>
                      <input
                        id="form-followup"
                        type="date"
                        value={followUpReminder}
                        onChange={e => setFollowUpReminder(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg text-sm bg-input border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Exclusivity & Usage Rights */}
              <div className="space-y-4">
                <span className="text-xs font-bold text-primary uppercase tracking-widest block border-b border-border/20 pb-1">
                  Exclusivity & Usage
                </span>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label htmlFor="form-excl-days" className="text-xs font-semibold text-foreground uppercase tracking-wider">
                      Exclusivity Period (Days)
                    </label>
                    <input
                      id="form-excl-days"
                      type="number"
                      min="0"
                      value={exclusivityDays}
                      onChange={e => setExclusivityDays(e.target.value === '' ? '' : Number(e.target.value) || 0)}
                      className="w-full px-3 py-2 rounded-lg text-sm bg-input border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="form-usage" className="text-xs font-semibold text-foreground uppercase tracking-wider">
                      Usage Rights Category
                    </label>
                    <input
                      id="form-usage"
                      type="text"
                      placeholder="e.g. Organic only, 30-day paid boost"
                      value={usageRights}
                      onChange={e => setUsageRights(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg text-sm bg-input border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>

                  <div className="space-y-1.5 col-span-2">
                    <label htmlFor="form-excl-notes" className="text-xs font-semibold text-foreground uppercase tracking-wider">
                      Exclusivity Details / Competitor Lists
                    </label>
                    <textarea
                      id="form-excl-notes"
                      rows={2}
                      placeholder="e.g. No active sponsorships with other fitness brands"
                      value={exclusivityNotes}
                      onChange={e => setExclusivityNotes(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg text-sm bg-input border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                    />
                  </div>
                </div>
              </div>

              {/* Deliverables Nested form */}
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-border/20 pb-1">
                  <span className="text-xs font-bold text-primary uppercase tracking-widest block">
                    Deliverables Checklist
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={handleAddDeliverable}
                    className="h-6 text-[11px] px-2 text-primary hover:text-white"
                  >
                    + Add Item
                  </Button>
                </div>

                <div className="space-y-4">
                  {deliverables.map((del, index) => (
                    <div
                      key={index}
                      className="p-4 rounded-xl border border-border/40 bg-background/30 space-y-3 relative group"
                    >
                      <button
                        type="button"
                        onClick={() => handleRemoveDeliverable(index)}
                        className="absolute top-2 right-2 text-foreground-muted hover:text-danger opacity-0 group-hover:opacity-100 transition-opacity"
                        aria-label="Remove deliverable"
                      >
                        <X className="h-4 w-4" />
                      </button>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1 col-span-2">
                          <label className="text-[10px] font-semibold text-foreground-muted uppercase">Deliverable Format / Type</label>
                          <select
                            value={del.type}
                            onChange={e => handleUpdateDeliverable(index, 'type', e.target.value)}
                            className="w-full px-3 py-1.5 rounded bg-input border border-border text-xs text-foreground cursor-pointer focus:outline-none"
                          >
                            {DELIVERABLE_TYPES.map(dt => (
                              <option key={dt.value} value={dt.value}>{dt.label}</option>
                            ))}
                          </select>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-semibold text-foreground-muted uppercase">Due Date <span className="text-danger">*</span></label>
                          <input
                            type="date"
                            value={del.dueDate}
                            onChange={e => handleUpdateDeliverable(index, 'dueDate', e.target.value)}
                            className="w-full px-3 py-1.5 rounded bg-input border border-border text-xs text-foreground focus:outline-none"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-semibold text-foreground-muted uppercase">Platform Tag</label>
                          <input
                            type="text"
                            placeholder="e.g. Instagram, TikTok"
                            value={del.platform}
                            onChange={e => handleUpdateDeliverable(index, 'platform', e.target.value)}
                            className="w-full px-3 py-1.5 rounded bg-input border border-border text-xs text-foreground focus:outline-none"
                          />
                        </div>

                        <div className="space-y-1 col-span-2">
                          <label className="text-[10px] font-semibold text-foreground-muted uppercase">Brief Description</label>
                          <input
                            type="text"
                            placeholder="Short summary of content deliverable..."
                            value={del.description}
                            onChange={e => handleUpdateDeliverable(index, 'description', e.target.value)}
                            className="w-full px-3 py-1.5 rounded bg-input border border-border text-xs text-foreground focus:outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                  {deliverables.length === 0 && (
                    <div className="text-center p-6 border border-dashed border-border/20 rounded-xl text-foreground-subtle text-xs">
                      No deliverables added yet. Click &quot;Add Item&quot; to build the checklist.
                    </div>
                  )}
                </div>
              </div>

              {/* Notes & Tags */}
              <div className="space-y-4">
                <span className="text-xs font-bold text-primary uppercase tracking-widest block border-b border-border/20 pb-1">
                  General Info & Notes
                </span>
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label htmlFor="form-description" className="text-xs font-semibold text-foreground uppercase tracking-wider">
                      Brief Description / Campaign Details
                    </label>
                    <textarea
                      id="form-description"
                      rows={2}
                      placeholder="Add main marketing hooks or details..."
                      value={description}
                      onChange={e => setDescription(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg text-sm bg-input border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="form-tags" className="text-xs font-semibold text-foreground uppercase tracking-wider">
                      Tags (Comma separated)
                    </label>
                    <input
                      id="form-tags"
                      type="text"
                      placeholder="e.g. Q3, Summer, Reels"
                      value={tagsInput}
                      onChange={e => setTagsInput(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg text-sm bg-input border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="form-notes-internal" className="text-xs font-semibold text-foreground uppercase tracking-wider">
                      Internal Deal Notes
                    </label>
                    <textarea
                      id="form-notes-internal"
                      rows={3}
                      placeholder="Any additional background notes, negotiations history..."
                      value={notes}
                      onChange={e => setNotes(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg text-sm bg-input border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                    />
                  </div>

                  {/* Brand Portal Links Section */}
                  {editingDeal && (
                    <div className="space-y-4 pt-4 border-t border-border/20">
                      <span className="text-xs font-bold text-primary uppercase tracking-widest block pb-1">
                        Brand Collaboration Portal
                      </span>
                      {(() => {
                        const token = portalTokens.find(
                          (t) => t.dealId === editingDeal.id && !t.isRevoked
                        );
                        if (token) {
                          const displayUrl = `${window.location.origin}/portal/${token.token}`;
                          return (
                            <div className="bg-background-elevated/40 border border-border/80 rounded-xl p-4 space-y-3">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-white">Active Share Link</span>
                                <Badge variant="success" size="sm">Active</Badge>
                              </div>
                              <div className="flex gap-2">
                                <input
                                  type="text"
                                  readOnly
                                  value={displayUrl}
                                  className="flex-1 bg-input border border-border rounded-lg px-2.5 py-1.5 text-xs text-foreground-muted font-mono"
                                />
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="secondary"
                                  onClick={() => {
                                    navigator.clipboard.writeText(displayUrl);
                                    setCopiedPortalLinkId(token.id);
                                    toast('Portal link copied to clipboard!', 'success');
                                    setTimeout(() => setCopiedPortalLinkId(null), 2000);
                                  }}
                                >
                                  {copiedPortalLinkId === token.id ? (
                                    <Check className="h-4 w-4 text-emerald-400" />
                                  ) : (
                                    <Copy className="h-4 w-4" />
                                  )}
                                </Button>
                              </div>
                              <div className="flex items-center justify-between text-[11px] text-foreground-muted">
                                <span>Clicks: <span className="font-bold text-white">{token.accessCount || 0}</span></span>
                                <span>Expires: <span className="font-bold text-white">{new Date(token.expiresAt).toLocaleDateString()}</span></span>
                              </div>
                              <div className="pt-2 border-t border-border/20 flex gap-2 justify-end">
                                <a
                                  href={displayUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline font-semibold"
                                >
                                  Open Brand Portal
                                  <ExternalLink className="w-3.5 h-3.5" />
                                </a>
                                <span className="text-border-strong text-xs">|</span>
                                <button
                                  type="button"
                                  onClick={() => handleRevokePortalLinkFromForm(token.id)}
                                  className="text-xs text-danger hover:underline font-semibold"
                                >
                                  Revoke Access
                                </button>
                              </div>
                            </div>
                          );
                        }

                        return (
                          <div className="bg-background-elevated/40 border border-border/80 rounded-xl p-4 space-y-3 text-center">
                            <p className="text-xs text-foreground-muted">
                              No active portal link exists for this deal. Share one so the brand can submit briefs and request revisions.
                            </p>
                            {!showPortalSubform ? (
                              <Button
                                type="button"
                                size="sm"
                                variant="secondary"
                                onClick={() => setShowPortalSubform(true)}
                                className="w-full justify-center"
                              >
                                <Plus className="w-3.5 h-3.5 mr-1.5" />
                                Create Portal Link
                              </Button>
                            ) : (
                              <div className="text-left space-y-3 pt-2 border-t border-border/20">
                                <div className="space-y-1">
                                  <label className="text-[10px] font-bold text-foreground-muted uppercase tracking-wider block">
                                    Link Expiration
                                  </label>
                                  <select
                                    value={portalExpiresInDays}
                                    onChange={(e) => setPortalExpiresInDays(Number(e.target.value))}
                                    className="w-full bg-input border border-border rounded-lg px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                                  >
                                    <option value={7}>7 Days</option>
                                    <option value={14}>14 Days</option>
                                    <option value={30}>30 Days</option>
                                    <option value={90}>90 Days</option>
                                  </select>
                                </div>
                                <div className="space-y-1">
                                  <label className="text-[10px] font-bold text-foreground-muted uppercase tracking-wider block">
                                    Message / Note for Brand
                                  </label>
                                  <textarea
                                    value={portalNote}
                                    onChange={(e) => setPortalNote(e.target.value)}
                                    placeholder="Instructions or welcoming note..."
                                    rows={2}
                                    className="w-full bg-input border border-border rounded-lg px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring resize-none"
                                  />
                                </div>
                                <div className="flex gap-2 justify-end">
                                  <Button
                                    type="button"
                                    size="xs"
                                    variant="ghost"
                                    onClick={() => setShowPortalSubform(false)}
                                  >
                                    Cancel
                                  </Button>
                                  <Button
                                    type="button"
                                    size="xs"
                                    variant="primary"
                                    loading={generatingPortalLink}
                                    onClick={() =>
                                      handleGeneratePortalLinkFromForm(
                                        editingDeal.id,
                                        brandName,
                                        brandEmail
                                      )
                                    }
                                  >
                                    Generate
                                  </Button>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })()}
                    </div>
                  )}
                </div>
              </div>

              {formError && (
                <div className="text-xs text-danger font-medium p-2.5 rounded bg-danger-muted border border-danger/20">
                  {formError}
                </div>
              )}

              {/* Form Actions Footer */}
              <div className="pt-4 border-t border-border/40 flex gap-3">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setPanelOpen(false)}
                  className="flex-1 py-2.5 text-sm bg-input hover:bg-background-elevated"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  className="flex-1 py-2.5 text-sm font-semibold"
                  disabled={formLoading}
                >
                  {formLoading ? 'Saving...' : editingDeal ? 'Save Changes' : 'Create Deal'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

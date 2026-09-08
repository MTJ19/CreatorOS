import React, { useEffect, useState, useRef } from 'react';
import { X, MessageSquare, Bot, User, Building2, Wand2 } from 'lucide-react';
import { useAuth } from '@/components/auth/auth-provider';
import { dealsApi } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/toast';
import { cn } from '@/lib/utils';

export function NegotiationModal({ deal, onClose }: { deal: any; onClose: () => void }) {
  const { accessToken } = useAuth();
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [input, setInput] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [suggesting, setSuggesting] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function loadMessages() {
      if (!accessToken) return;
      try {
        const data = await dealsApi.getNegotiationMessages(accessToken, deal.id);
        setMessages(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadMessages();
  }, [accessToken, deal.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !accessToken) return;
    setSubmitting(true);
    try {
      const newMsg = await dealsApi.addNegotiationMessage(accessToken, deal.id, 'CREATOR', input.trim());
      setMessages([...messages, newMsg]);
      setInput('');
    } catch (err: any) {
      toast(err.message || 'Failed to send message', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSuggest = async () => {
    if (!accessToken) return;
    setSuggesting(true);
    try {
      const res = await dealsApi.suggestNegotiationMessage(accessToken, deal.id);
      setInput(res.suggestion || '');
      toast('Suggestion generated', 'success');
    } catch (err: any) {
      toast(err.message || 'Failed to generate suggestion', 'error');
    } finally {
      setSuggesting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end overflow-hidden">
      <div className="absolute inset-0 bg-background/60 backdrop-blur-sm transition-opacity" onClick={onClose} />
      <div className="relative z-10 flex h-full w-full max-w-lg animate-slide-in-right flex-col border-l border-border/60 bg-background-overlay shadow-float-lg">
        <div className="flex items-center justify-between border-b border-border/40 p-5">
          <div>
            <h3 className="flex items-center gap-2 text-lg font-bold text-white">
              <MessageSquare className="h-5 w-5 text-primary" />
              Negotiation 
            </h3>
            <p className="mt-0.5 text-xs text-foreground-muted">
              {deal.brandName} • Quoted: ${deal.quotedAmount} • Offered: ${deal.offeredAmount}
            </p>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-foreground-muted hover:bg-background-elevated hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {loading ? (
            <div className="text-center text-sm text-foreground-muted">Loading conversation...</div>
          ) : messages.length === 0 ? (
            <div className="text-center text-sm text-foreground-muted">
              No messages yet. Start drafting a response to the brand.
            </div>
          ) : (
            messages.map((msg, i) => {
              const isCreator = msg.role === 'CREATOR';
              const isAI = msg.role === 'AI_ASSISTANT';
              
              return (
                <div
                  key={msg.id || i}
                  className={cn(
                    'flex max-w-[85%] flex-col rounded-xl border p-3 text-sm',
                    isCreator
                      ? 'ml-auto self-end border-primary/20 bg-primary-muted/15'
                      : isAI
                      ? 'mr-auto self-start border-accent/20 bg-accent/5'
                      : 'mr-auto self-start border-border/60 bg-background-elevated/50'
                  )}
                >
                  <div className="mb-1 flex items-center gap-1.5 text-[10px] font-bold text-foreground-muted">
                    {isCreator ? (
                      <><User className="h-3 w-3 text-primary" /> <span>You</span></>
                    ) : isAI ? (
                      <><Bot className="h-3 w-3 text-accent" /> <span>AI Assistant</span></>
                    ) : (
                      <><Building2 className="h-3 w-3 text-white" /> <span>Brand</span></>
                    )}
                  </div>
                  <div className="whitespace-pre-wrap text-foreground">
                    {msg.content}
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="border-t border-border/40 p-4 bg-background">
          <form onSubmit={handleSubmit} className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-foreground-muted">Draft Reply</span>
              <Button 
                type="button" 
                variant="ghost" 
                size="xs" 
                className="text-accent hover:text-accent-hover hover:bg-accent/10 h-7"
                onClick={handleSuggest}
                loading={suggesting}
              >
                <Wand2 className="h-3 w-3 mr-1.5" />
                AI Suggestion
              </Button>
            </div>
            <textarea
              className="w-full resize-none rounded-lg border border-border bg-input px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring min-h-[80px]"
              placeholder="Type your message..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />
            <div className="flex justify-end gap-2 mt-2">
              <Button type="submit" variant="primary" size="sm" loading={submitting} disabled={!input.trim()}>
                Save Draft Message
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

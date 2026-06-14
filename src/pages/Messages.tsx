import { useEffect, useRef, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAppStore } from '../lib/store';
import { useTheme } from '../contexts/ThemeContext';
import { initials, timeAgo } from '../lib/utils';
import type { Profile } from '../lib/types';
import LoadingSpinner from '../components/LoadingSpinner';
import { Send, ArrowLeft, MessageCircle } from 'lucide-react';

interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  read_at: string | null;
  created_at: string;
}

interface ConversationRow {
  id: string;
  participant_a: string;
  participant_b: string;
  created_at: string;
}

interface ConversationView {
  id: string;
  other: Profile | null;
  lastMessage: string;
  lastAt: string;
  unread: boolean;
}

export default function Messages() {
  const { profile: me } = useAppStore();
  const theme = useTheme();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeId = searchParams.get('conversation');

  const [conversations, setConversations] = useState<ConversationView[]>([]);
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const threadEndRef = useRef<HTMLDivElement>(null);

  // ── Load conversation list ──
  useEffect(() => {
    if (!me) return;
    loadConversations();
  }, [me]);

  const loadConversations = async () => {
    if (!me) return;
    setLoading(true);
    const { data: convs } = await supabase
      .from('conversations')
      .select('*')
      .or(`participant_a.eq.${me.id},participant_b.eq.${me.id}`);

    const rows = (convs as ConversationRow[]) || [];
    if (rows.length === 0) { setConversations([]); setLoading(false); return; }

    const otherIds = rows.map((c) => (c.participant_a === me.id ? c.participant_b : c.participant_a));
    const convIds = rows.map((c) => c.id);

    const [{ data: profiles }, { data: msgs }] = await Promise.all([
      supabase.from('profiles').select('*').in('id', otherIds),
      supabase.from('messages').select('*').in('conversation_id', convIds).order('created_at', { ascending: true }),
    ]);

    const pMap = new Map((profiles as Profile[] || []).map((p) => [p.id, p]));
    const allMsgs = (msgs as Message[]) || [];

    const views: ConversationView[] = rows.map((c) => {
      const otherId = c.participant_a === me.id ? c.participant_b : c.participant_a;
      const cMsgs = allMsgs.filter((m) => m.conversation_id === c.id);
      const last = cMsgs[cMsgs.length - 1];
      const unread = cMsgs.some((m) => m.sender_id !== me.id && !m.read_at);
      return {
        id: c.id,
        other: pMap.get(otherId) || null,
        lastMessage: last?.content || 'No messages yet',
        lastAt: last?.created_at || c.created_at,
        unread,
      };
    }).sort((a, b) => b.lastAt.localeCompare(a.lastAt));

    setConversations(views);
    setLoading(false);
  };

  // ── Load active thread + realtime ──
  useEffect(() => {
    if (!activeId || !me) { setMessages([]); return; }

    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', activeId)
        .order('created_at', { ascending: true });
      if (!cancelled) setMessages((data as Message[]) || []);

      // Mark incoming messages as read
      await supabase
        .from('messages')
        .update({ read_at: new Date().toISOString() })
        .eq('conversation_id', activeId)
        .neq('sender_id', me.id)
        .is('read_at', null);
    })();

    const channel = supabase
      .channel(`messages:${activeId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${activeId}` },
        (payload) => {
          setMessages((prev) => {
            const next = payload.new as Message;
            if (prev.some((m) => m.id === next.id)) return prev;
            return [...prev, next];
          });
        },
      )
      .subscribe();

    return () => { cancelled = true; supabase.removeChannel(channel); };
  }, [activeId, me]);

  useEffect(() => {
    threadEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || !activeId || !me) return;
    setSending(true);
    setInput('');
    const { error } = await supabase.from('messages').insert({
      conversation_id: activeId,
      sender_id: me.id,
      content: text,
    });
    if (error) setInput(text); // restore on failure
    setSending(false);
  };

  const openConversation = (id: string) => {
    setSearchParams({ conversation: id });
  };

  const activeConv = conversations.find((c) => c.id === activeId);

  return (
    <div className="flex" style={{ height: 'calc(100vh - 60px)', background: theme.bg }}>
      {/* ── Conversation list ── */}
      <div
        className={`${activeId ? 'hidden md:flex' : 'flex'} flex-col w-full md:w-[280px] flex-shrink-0`}
        style={{ borderRight: `1px solid ${theme.border}` }}
      >
        <div style={{ padding: '16px', borderBottom: `1px solid ${theme.border}` }}>
          <h1 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900, fontSize: '22px', textTransform: 'uppercase', color: theme.text }}>Messages</h1>
        </div>
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <LoadingSpinner />
          ) : conversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center px-6" style={{ height: '100%' }}>
              <MessageCircle className="w-8 h-8 mb-3" style={{ color: theme.textMuted }} />
              <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '13px', color: theme.textMuted, lineHeight: 1.5 }}>
                No conversations yet. Connect with athletes or brands to start messaging.
              </p>
            </div>
          ) : (
            conversations.map((c) => (
              <button
                key={c.id}
                onClick={() => openConversation(c.id)}
                className="w-full flex items-center gap-3 text-left transition-colors hover:bg-white/5"
                style={{
                  padding: '12px 16px',
                  borderLeft: c.unread ? `2px solid ${theme.accent}` : '2px solid transparent',
                  background: c.id === activeId ? theme.surface : 'transparent',
                }}
              >
                <div className="overflow-hidden flex items-center justify-center flex-shrink-0" style={{ width: '36px', height: '36px', borderRadius: '4px', background: theme.accentMuted }}>
                  {c.other?.avatar_url ? (
                    <img src={c.other.avatar_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900, fontSize: '12px', color: theme.accent }}>{initials(c.other?.full_name || '?')}</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate" style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: '13px', textTransform: 'uppercase', color: theme.text }}>{c.other?.full_name || 'Unknown'}</span>
                    <span className="flex-shrink-0" style={{ fontFamily: "'Inter', sans-serif", fontSize: '9px', color: theme.textMuted }}>{timeAgo(c.lastAt)}</span>
                  </div>
                  <p className="truncate" style={{ fontFamily: "'Inter', sans-serif", fontSize: '11px', color: theme.textMuted, marginTop: '2px' }}>{c.lastMessage}</p>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* ── Active thread ── */}
      <div className={`${activeId ? 'flex' : 'hidden md:flex'} flex-col flex-1 min-w-0`}>
        {!activeId ? (
          <div className="flex-1 flex items-center justify-center">
            <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '13px', color: theme.textMuted }}>Select a conversation</p>
          </div>
        ) : (
          <>
            {/* Thread header */}
            <div className="flex items-center gap-3" style={{ padding: '12px 16px', borderBottom: `1px solid ${theme.border}` }}>
              <button onClick={() => setSearchParams({})} className="md:hidden" style={{ color: theme.textMuted }} aria-label="Back">
                <ArrowLeft className="w-5 h-5" />
              </button>
              {activeConv?.other && (
                <Link to={`/profile/${activeConv.other.username}`} className="flex items-center gap-2 hover:opacity-80">
                  <div className="overflow-hidden flex items-center justify-center" style={{ width: '30px', height: '30px', borderRadius: '4px', background: theme.accentMuted }}>
                    {activeConv.other.avatar_url ? (
                      <img src={activeConv.other.avatar_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900, fontSize: '11px', color: theme.accent }}>{initials(activeConv.other.full_name)}</span>
                    )}
                  </div>
                  <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: '14px', textTransform: 'uppercase', color: theme.text }}>{activeConv.other.full_name}</span>
                </Link>
              )}
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto flex flex-col gap-2" style={{ padding: '16px' }}>
              {messages.map((m) => {
                const own = m.sender_id === me?.id;
                return (
                  <div
                    key={m.id}
                    className="max-w-[75%]"
                    style={{
                      alignSelf: own ? 'flex-end' : 'flex-start',
                      background: own ? theme.accentMuted : theme.surface,
                      border: `1px solid ${theme.border}`,
                      borderRadius: '4px',
                      padding: '8px 12px',
                    }}
                  >
                    <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '13px', color: theme.text, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{m.content}</p>
                    <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '9px', color: theme.textMuted, display: 'block', marginTop: '4px', textAlign: own ? 'right' : 'left' }}>{timeAgo(m.created_at)}</span>
                  </div>
                );
              })}
              <div ref={threadEndRef} />
            </div>

            {/* Input */}
            <div className="flex items-center gap-2" style={{ padding: '12px 16px', borderTop: `1px solid ${theme.border}` }}>
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                maxLength={2000}
                placeholder="Type a message…"
                className="flex-1 bg-surface border border-white/10 px-4 py-2.5 text-sm text-text focus:border-accent/50 transition-colors"
                style={{ borderRadius: '4px', background: theme.surface, borderColor: theme.border, color: theme.text }}
              />
              <button
                onClick={handleSend}
                disabled={sending || !input.trim()}
                className="flex items-center justify-center disabled:opacity-50"
                style={{ width: '40px', height: '40px', borderRadius: '4px', background: theme.accent, color: '#050508' }}
                aria-label="Send"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

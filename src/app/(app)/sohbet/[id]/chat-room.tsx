"use client";
import { useEffect, useRef, useState, useTransition } from "react";
import { Send, Lock } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  sender_id: string;
  content: string;
  created_at: string;
  read_at: string | null;
}

interface Props {
  chatId: string;
  myUserId: string;
  initialMessages: Message[];
  canSend: boolean;
}

export function ChatRoom({ chatId, myUserId, initialMessages, canSend }: Props) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [draft, setDraft] = useState("");
  const [pending, startTransition] = useTransition();
  const scrollerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll on new messages
  useEffect(() => {
    const el = scrollerRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages.length]);

  // Realtime subscription
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`chat:${chatId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `chat_id=eq.${chatId}` },
        (payload) => {
          const m = payload.new as Message;
          setMessages((prev) => (prev.some((p) => p.id === m.id) ? prev : [...prev, m]));
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [chatId]);

  function send() {
    if (!draft.trim() || pending) return;
    const content = draft.trim();
    const optimisticId = `tmp-${crypto.randomUUID()}`;
    const optimistic: Message = {
      id: optimisticId,
      sender_id: myUserId,
      content,
      created_at: new Date().toISOString(),
      read_at: null,
    };
    setMessages((prev) => [...prev, optimistic]);
    setDraft("");

    startTransition(async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("messages")
        .insert({ chat_id: chatId, sender_id: myUserId, content })
        .select("id, sender_id, content, created_at, read_at")
        .single();

      if (error) {
        // Rollback optimistic
        setMessages((prev) => prev.filter((m) => m.id !== optimisticId));
        setDraft(content);
        return;
      }
      // Replace optimistic with real row
      setMessages((prev) =>
        prev.map((m) => (m.id === optimisticId ? (data as Message) : m))
      );
    });
  }

  return (
    <>
      <div ref={scrollerRef} className="flex-1 overflow-y-auto px-3 pb-3 pt-1">
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 px-6 text-center">
            <p className="text-sm font-medium">Sohbet hazır 👋</p>
            <p className="max-w-[260px] text-[12px] text-muted-foreground">
              Buluşma yeri ve zamanı için ilk mesajı sen at. Güvenlik için
              buluşmaları kalabalık yerlerde planla.
            </p>
          </div>
        ) : (
          <ul className="flex flex-col gap-1.5">
            {messages.map((m, i) => {
              const mine = m.sender_id === myUserId;
              const prev = messages[i - 1];
              const grouped = prev && prev.sender_id === m.sender_id;
              return (
                <li key={m.id} className={cn("flex flex-col", mine ? "items-end" : "items-start")}>
                  <div
                    className={cn(
                      "max-w-[78%] rounded-2xl px-3.5 py-2 text-[14px] leading-relaxed",
                      mine
                        ? "bg-primary text-primary-foreground rounded-br-md"
                        : "bg-muted text-foreground rounded-bl-md",
                      grouped && (mine ? "rounded-tr-md" : "rounded-tl-md")
                    )}
                  >
                    {m.content}
                  </div>
                  {!grouped && (
                    <span className="mt-0.5 px-1 text-[10px] text-muted-foreground">
                      {new Date(m.created_at).toLocaleTimeString("tr-TR", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div className="border-t border-border bg-background safe-bottom">
        {canSend ? (
          <div className="flex items-end gap-2 px-3 py-2.5">
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send();
                }
              }}
              placeholder="Mesaj yaz…"
              rows={1}
              className="max-h-32 flex-1 resize-none rounded-2xl bg-muted px-4 py-2.5 text-[15px] outline-none transition focus:ring-2 focus:ring-ring"
            />
            <button
              onClick={send}
              disabled={!draft.trim() || pending}
              aria-label="Gönder"
              className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground active:scale-95 transition disabled:opacity-50"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2 px-4 py-3 text-[12px] text-muted-foreground">
            <Lock className="h-3.5 w-3.5" />
            <span>
              Bu sohbet, rezervasyon onaylandığında etkinleşir. Mesaj göndermek
              için satıcının onayını bekle.
            </span>
          </div>
        )}
      </div>
    </>
  );
}

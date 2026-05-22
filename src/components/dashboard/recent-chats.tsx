'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { MessageSquare, ArrowDownLeft, ArrowUpRight } from 'lucide-react';
import { ChatMessage } from '@/lib/api';
import { format } from 'date-fns';

interface RecentChatsProps {
  messages: ChatMessage[];
  loading?: boolean;
}

export function RecentChats({ messages, loading }: RecentChatsProps) {
  return (
    <Card className="border-border/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-emerald-600" />
          Recent Chat Messages
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {loading ? (
          <div className="space-y-3 p-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex gap-3">
                <Skeleton className="h-8 w-8 rounded-full" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-4 w-full" />
                </div>
              </div>
            ))}
          </div>
        ) : messages.length === 0 ? (
          <div className="p-4 text-center text-muted-foreground text-sm">
            No chat messages yet
          </div>
        ) : (
          <ScrollArea className="max-h-96">
            <div className="space-y-1 p-4 pt-0">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className={`mt-0.5 shrink-0 ${msg.direction === 'incoming' ? 'text-emerald-600' : 'text-amber-600'}`}>
                    {msg.direction === 'incoming' ? (
                      <ArrowDownLeft className="h-4 w-4" />
                    ) : (
                      <ArrowUpRight className="h-4 w-4" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-xs font-medium truncate">
                        {msg.whatsappUser?.name || msg.whatsappUser?.phone || 'Unknown'}
                      </span>
                      <Badge
                        variant={msg.direction === 'incoming' ? 'default' : 'secondary'}
                        className={`text-[10px] px-1.5 py-0 ${
                          msg.direction === 'incoming'
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                            : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                        }`}
                      >
                        {msg.direction === 'incoming' ? 'IN' : 'OUT'}
                      </Badge>
                      <span className="text-[10px] text-muted-foreground ml-auto shrink-0">
                        {msg.createdAt ? format(new Date(msg.createdAt), 'MMM d, h:mm a') : ''}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">
                      {msg.messageText || `[${msg.messageType}]`}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}

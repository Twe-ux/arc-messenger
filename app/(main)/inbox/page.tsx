'use client';

import { MessageBubbleList } from '@/components/chat/MessageBubbleList';
import { useMessage } from '@/contexts/MessageContext';
import { Clock, Mail, MessageSquare, RefreshCw } from 'lucide-react';

export default function InboxPage() {
  const {
    selectedCorrespondent,
    conversationMessages,
    loadingConversation,
    selectedMessage,
    messageContent,
    loadingMessage,
    setSelectedMessage,
    setMessageContent,
    setLoadingMessage,
  } = useMessage();

  // Handle bubble click to fetch and display full message content
  const handleBubbleClick = async (message: any) => {
    console.log('Bubble clicked:', message);
    setSelectedMessage(message);
    setLoadingMessage(true);
    setMessageContent(null);

    try {
      // Fetch the full message content from Gmail API
      const response = await fetch(
        `/api/gmail/conversations/${message.threadId}/messages`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
        }
      );

      if (response.ok) {
        const data = await response.json();
        console.log('Message content fetched:', data);

        // Find the specific message in the thread or use the first message
        const messageContent =
          data.messages && data.messages.length > 0
            ? data.messages[0].content
            : 'Contenu du message non disponible';

        setMessageContent(messageContent);
      } else {
        console.error('Failed to fetch message content');
        setMessageContent('Erreur lors du chargement du message');
      }
    } catch (error) {
      console.error('Error fetching message content:', error);
      setMessageContent('Erreur lors du chargement du message');
    } finally {
      setLoadingMessage(false);
    }
  };

  return (
    <div className="h-full w-full">
      <div className="flex h-full w-full flex-col md:flex-row">
        {/* Boîte de réception principale - Bulles de conversation */}
        <div
          className="flex flex-1 flex-col rounded-lg border border-purple-500 bg-white shadow-lg"
          style={{ margin: `0.5% 0.25% 0.5% 0.5%` }}
        >
          {/* En-tête de conversation */}
          {selectedCorrespondent && (
            <div className="rounded-t-lg border-b border-purple-200 bg-purple-50 p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-500 text-white">
                  {selectedCorrespondent.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    {selectedCorrespondent.name}
                  </h2>
                  <p className="text-sm text-gray-600">
                    {selectedCorrespondent.messageCount} message(s)
                    {selectedCorrespondent.unreadCount > 0 && (
                      <span className="ml-2 rounded-full bg-red-100 px-2 py-0.5 text-xs text-red-700">
                        {selectedCorrespondent.unreadCount} non lu(s)
                      </span>
                    )}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Messages en bulles */}
          <div className="flex-1 overflow-y-auto">
            {selectedCorrespondent ? (
              <MessageBubbleList
                messages={conversationMessages}
                onMessageClick={handleBubbleClick}
                loading={loadingConversation}
              />
            ) : (
              <div className="flex h-full flex-1 items-center justify-center">
                <div className="text-center">
                  <MessageSquare className="mx-auto mb-4 h-12 w-12 text-gray-400" />
                  <h1 className="mb-2 text-xl font-semibold text-gray-800">
                    Conversations
                  </h1>
                  <p className="text-gray-600">
                    Sélectionnez un correspondant dans la sidebar
                    <br />
                    pour voir vos messages avec cette personne
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Panneau latéral - Message complet */}
        {selectedMessage && (
          <div
            className="flex w-4/6 flex-col rounded-lg border border-purple-500 bg-white shadow-lg"
            style={{ margin: `0.5% 0.5% 0.5% 0.25%` }}
          >
            <div
              className="border-b border-purple-200 bg-purple-50 p-4"
              style={{ margin: `1%` }}
            >
              <h3 className="text-lg font-semibold text-gray-800">
                Message complet
              </h3>
            </div>

            <div className="flex-1 overflow-y-auto">
              {selectedMessage ? (
                <div className="p-4">
                  {/* En-tête du message */}
                  <div className="mb-4 border-b border-gray-200 pb-4">
                    <h4 className="mb-2 text-lg font-medium text-gray-900">
                      {selectedMessage.subject || 'Sans objet'}
                    </h4>
                    <div className="space-y-2 text-sm text-gray-600">
                      <div>
                        <span className="font-medium">De:</span>{' '}
                        {selectedMessage.from}
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        <span>{selectedMessage.time}</span>
                        {selectedMessage.unread && (
                          <span className="rounded-full bg-blue-100 px-2 py-1 text-xs text-blue-700">
                            Non lu
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Contenu du message */}
                  <div>
                    {loadingMessage ? (
                      <div className="flex items-center justify-center py-8">
                        <RefreshCw className="mr-2 h-6 w-6 animate-spin text-purple-500" />
                        <span className="text-gray-600">Chargement...</span>
                      </div>
                    ) : messageContent ? (
                      <div className="prose prose-sm max-w-none">
                        <div
                          className="leading-relaxed text-gray-700"
                          dangerouslySetInnerHTML={{ __html: messageContent }}
                        />
                      </div>
                    ) : (
                      <div className="py-4 text-center text-gray-500">
                        <p>{selectedMessage.preview}</p>
                      </div>
                    )}
                  </div>

                  {/* Informations techniques */}
                  <div className="mt-6 border-t border-gray-200 pt-4">
                    <h5 className="mb-2 text-sm font-medium text-gray-700">
                      Informations
                    </h5>
                    <div className="space-y-1 text-xs text-gray-500">
                      <div>
                        <span className="font-medium">Thread ID:</span>
                        <br />
                        <span className="break-all">
                          {selectedMessage.threadId}
                        </span>
                      </div>
                      <div>
                        <span className="font-medium">Type:</span> Email Gmail
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex h-full items-center justify-center p-4">
                  <div className="text-center text-gray-500">
                    <Mail className="mx-auto mb-2 h-8 w-8 text-gray-400" />
                    <p className="text-sm">
                      Cliquez sur une bulle
                      <br />
                      pour voir le message complet
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

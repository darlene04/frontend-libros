import { useState, useRef, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Send,
  Search,
  ArrowLeft,
  BookOpen,
  MessageCircle,
  ShoppingCart,
  CheckCircle2,
  PackageCheck,
  HandshakeIcon,
  Clock,
} from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import { getBookById } from "@/api/books";
import { getSolicitudesByUser, sendSolicitudMessage, updateSolicitudStatus } from "@/api/solicitudes";
import { getUserById } from "@/api/users";
import type { Book, Conversation, Message, User } from "@/types";
import Avatar from "@/components/shared/Avatar";
import { cn, formatRelativeTime } from "@/lib/utils";
import {
  createPickupConfirmSystemMessage,
  createPurchaseAcceptSystemMessage,
  getConversationPreview,
  getConversationWorkflowState,
  getVisibleConversationMessages,
} from "@/lib/solicitudWorkflow";

const timeFormatter = new Intl.DateTimeFormat("es-PE", {
  hour: "2-digit",
  minute: "2-digit",
});

function msgTime(iso: string) {
  return timeFormatter.format(new Date(iso));
}

function otherParticipant(conv: Conversation, myId: string) {
  return conv.participantIds.find((participantId) => participantId !== myId) ?? conv.participantIds[0];
}

export default function MessagesPage() {
  const currentUser = useAuthStore((s) => s.user);
  const token = useAuthStore((s) => s.token);
  const [searchParams] = useSearchParams();
  const requestedConversationId = searchParams.get("c");

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(requestedConversationId);
  const [input, setInput] = useState("");
  const [search, setSearch] = useState("");
  const [mobileChat, setMobileChat] = useState(false);
  const [booksById, setBooksById] = useState<Record<string, Book>>({});
  const [usersById, setUsersById] = useState<Record<string, User>>({});
  const [isLoading, setIsLoading] = useState(Boolean(currentUser?.id && token));
  const [error, setError] = useState<string | null>(null);
  const [isAccepting, setIsAccepting] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!currentUser?.id || !token) {
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    const userId = currentUser.id;
    const authToken = token;

    async function loadConversations() {
      setIsLoading(true);
      setError(null);

      const response = await getSolicitudesByUser(userId, authToken);
      if (cancelled) return;

      if (!response.ok) {
        setError(response.error || "No se pudieron cargar las conversaciones");
        setIsLoading(false);
        return;
      }

      setConversations(response.data);

      const nextSelectedId =
        requestedConversationId && response.data.some((conversation) => conversation.id === requestedConversationId)
          ? requestedConversationId
          : response.data[0]?.id ?? null;
      setSelectedId(nextSelectedId);

      const bookIds = [...new Set(response.data.map((conversation) => conversation.bookId).filter(Boolean))];
      const peerIds = [
        ...new Set(
          response.data.map((conversation) =>
            otherParticipant(conversation, userId)
          )
        ),
      ];

      const [books, users] = await Promise.all([
        Promise.all(
          bookIds.map(async (bookId) => {
            const bookResponse = await getBookById(bookId, authToken);
            return bookResponse.ok ? bookResponse.data : null;
          })
        ),
        Promise.all(
          peerIds.map(async (uid) => {
            const userResponse = await getUserById(uid, authToken);
            return userResponse.ok ? userResponse.data : null;
          })
        ),
      ]);

      if (cancelled) return;

      setBooksById(
        Object.fromEntries(
          books
            .filter((book): book is Book => book !== null)
            .map((book) => [book.id, book])
        )
      );
      setUsersById(
        Object.fromEntries(
          users
            .filter((user): user is User => user !== null)
            .map((user) => [user.id, user])
        )
      );

      setIsLoading(false);
    }

    loadConversations();

    return () => {
      cancelled = true;
    };
  }, [currentUser?.id, requestedConversationId, token]);

  const selected = conversations.find((conversation) => conversation.id === selectedId) ?? null;
  const book = selected ? booksById[selected.bookId] : null;
  const peerId = selected && currentUser ? otherParticipant(selected, currentUser.id) : null;
  const peer = peerId ? usersById[peerId] : null;
  const selectedWorkflow = selected ? getConversationWorkflowState(selected) : null;
  const selectedMessages = selected ? getVisibleConversationMessages(selected.messages) : [];

  const filtered = useMemo(() => {
    if (!search.trim()) return conversations;
    const query = search.toLowerCase();

    return conversations.filter((conversation) => {
      const participantId = currentUser ? otherParticipant(conversation, currentUser.id) : "";
      const conversationUser = usersById[participantId];
      const conversationBook = booksById[conversation.bookId];

      return (
        conversationUser?.name.toLowerCase().includes(query) ||
        conversationBook?.title.toLowerCase().includes(query)
      );
    });
  }, [booksById, conversations, currentUser, search, usersById]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [selectedMessages.length]);

  function selectConversation(id: string) {
    setSelectedId(id);
    setMobileChat(true);
    setConversations((previous) =>
      previous.map((conversation) =>
        conversation.id === id ? { ...conversation, unreadCount: 0 } : conversation
      )
    );
  }

  function appendSystemMessage(conversationId: string, message: Message, nextStatus?: Conversation["status"]) {
    setConversations((previous) =>
      previous.map((conversation) =>
        conversation.id !== conversationId
          ? conversation
          : {
              ...conversation,
              messages: [...conversation.messages, message],
              lastMessageAt: message.sentAt,
              ...(nextStatus ? { status: nextStatus } : {}),
            }
      )
    );
  }

  async function handleAcceptPurchase() {
    if (!selectedId || !token || !currentUser?.id || !selected || !selectedWorkflow) return;

    setIsAccepting(true);
    setError(null);

    const response = await sendSolicitudMessage(
      selectedId,
      createPurchaseAcceptSystemMessage(),
      token
    );

    if (!response.ok) {
      setError(response.error || "No se pudo registrar la aceptacion");
      setIsAccepting(false);
      return;
    }

    appendSystemMessage(selectedId, {
      id: `${selectedId}-${currentUser.id}-accept-${Date.now()}`,
      conversationId: selectedId,
      senderId: currentUser.id,
      text: createPurchaseAcceptSystemMessage(),
      sentAt: new Date().toISOString(),
      read: true,
    });

    setIsAccepting(false);
  }

  async function handleConfirmDelivery() {
    if (!selectedId || !token || !currentUser?.id || !selected || !selectedWorkflow) return;

    setIsConfirming(true);
    setError(null);

    const sendResponse = await sendSolicitudMessage(
      selectedId,
      createPickupConfirmSystemMessage(),
      token
    );

    if (!sendResponse.ok) {
      setError(sendResponse.error || "No se pudo registrar el recojo");
      setIsConfirming(false);
      return;
    }

    const systemMessage: Message = {
      id: `${selectedId}-${currentUser.id}-pickup-${Date.now()}`,
      conversationId: selectedId,
      senderId: currentUser.id,
      text: createPickupConfirmSystemMessage(),
      sentAt: new Date().toISOString(),
      read: true,
    };

    const nextConversation: Conversation = {
      ...selected,
      messages: [...selected.messages, systemMessage],
    };
    const nextWorkflow = getConversationWorkflowState(nextConversation);

    if (nextWorkflow.allPickedUp) {
      const statusResponse = await updateSolicitudStatus(selectedId, "aceptada", token);
      if (!statusResponse.ok) {
        setError(statusResponse.error || "No se pudo actualizar el estado de la solicitud");
        setIsConfirming(false);
        return;
      }
      appendSystemMessage(selectedId, systemMessage, "aceptada");
    } else {
      appendSystemMessage(selectedId, systemMessage);
    }

    setIsConfirming(false);
  }

  async function sendMessage() {
    if (!input.trim() || !selectedId || !currentUser || !token) return;

    const text = input.trim();
    const response = await sendSolicitudMessage(selectedId, text, token);
    if (!response.ok) {
      setError(response.error || "No se pudo enviar el mensaje");
      return;
    }

    const message: Message = {
      id: `${selectedId}-${currentUser.id}-${Date.now()}`,
      conversationId: selectedId,
      senderId: currentUser.id,
      text,
      sentAt: new Date().toISOString(),
      read: true,
    };

    setConversations((previous) =>
      previous.map((conversation) =>
        conversation.id !== selectedId
          ? conversation
          : {
              ...conversation,
              messages: [...conversation.messages, message],
              lastMessage: message.text,
              lastMessageAt: message.sentAt,
            }
      )
    );
    setInput("");
  }

  const totalUnread = conversations.reduce((total, conversation) => total + conversation.unreadCount, 0);

  return (
    <div className="-m-5 lg:-m-8 h-[calc(100vh-3.5rem)] flex overflow-hidden bg-white border-t border-border/40">
      <div
        className={cn(
          "w-full lg:w-72 xl:w-80 border-r border-border/60 flex-col flex-shrink-0 bg-white",
          mobileChat ? "hidden lg:flex" : "flex"
        )}
      >
        <div className="px-4 pt-5 pb-3 border-b border-border/60 flex-shrink-0">
          <div className="flex items-center gap-2 mb-3">
            <h1 className="text-base font-bold tracking-tight text-foreground flex-1 leading-none">
              Mensajes
            </h1>
            {totalUnread > 0 && (
              <span className="inline-flex items-center justify-center h-5 min-w-[20px] px-1.5 rounded-full bg-violet-600 text-white text-[10px] font-bold tabular-nums">
                {totalUnread}
              </span>
            )}
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/50 pointer-events-none" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar conversaciones..."
              className="w-full pl-8 pr-3 py-2 rounded-xl border border-border bg-muted/40 text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-violet-300/60 focus:border-violet-400 focus:bg-white transition-all"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-full gap-2 px-6 text-center">
              <MessageCircle className="w-8 h-8 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">Cargando conversaciones...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-2 px-6 text-center">
              <MessageCircle className="w-8 h-8 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">Sin resultados</p>
            </div>
          ) : (
            filtered.map((conversation) => {
              const participantId = currentUser ? otherParticipant(conversation, currentUser.id) : "";
              const conversationUser = usersById[participantId];
              const conversationBook = booksById[conversation.bookId];
              const isActive = conversation.id === selectedId;

              return (
                <button
                  key={conversation.id}
                  onClick={() => selectConversation(conversation.id)}
                  className={cn(
                    "w-full flex items-start gap-3 px-4 py-3.5 text-left transition-colors border-b border-border/40",
                    isActive
                      ? "bg-violet-50 border-l-2 border-l-violet-500"
                      : "hover:bg-muted/40 border-l-2 border-l-transparent"
                  )}
                >
                  <div className="relative flex-shrink-0 mt-0.5">
                    <Avatar src={conversationUser?.avatar} name={conversationUser?.name} size="md" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline justify-between gap-1 mb-0.5">
                      <p className="text-sm font-medium text-foreground/90 truncate leading-none">
                        {conversationUser?.name ?? "Usuario"}
                      </p>
                      <span className="text-[10px] text-muted-foreground whitespace-nowrap flex-shrink-0">
                        {conversation.lastMessageAt ? formatRelativeTime(conversation.lastMessageAt) : ""}
                      </span>
                    </div>

                    {conversationBook && (
                      <div className="flex items-center gap-1 mb-1">
                        <BookOpen className="w-2.5 h-2.5 text-muted-foreground/50 flex-shrink-0" />
                        <span className="text-[10px] text-muted-foreground/70 truncate">
                          {conversationBook.title}
                        </span>
                      </div>
                    )}

                    <p className="text-xs truncate leading-relaxed text-muted-foreground">
                      {getConversationPreview(conversation)}
                    </p>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      <div
        className={cn(
          "flex-1 flex-col bg-[#f9f8ff] min-w-0",
          mobileChat ? "flex" : "hidden lg:flex"
        )}
      >
        {selected ? (
          <>
            <div className="h-14 flex-shrink-0 flex items-center gap-3 px-4 bg-white border-b border-border/60 shadow-sm">
              <button
                onClick={() => setMobileChat(false)}
                className="lg:hidden p-1.5 rounded-xl hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>

              <Avatar src={peer?.avatar} name={peer?.name} size="sm" />

              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground leading-none truncate">
                  {peer?.name ?? "Usuario"}
                </p>
                {book && (
                  <div className="flex items-center gap-1 mt-0.5">
                    <BookOpen className="w-2.5 h-2.5 text-violet-500 flex-shrink-0" />
                    <span className="text-[11px] text-muted-foreground truncate">{book.title}</span>
                  </div>
                )}
              </div>

              {selected.status === "pendiente" &&
                selectedWorkflow &&
                ((currentUser?.id === selected.buyerId && !selectedWorkflow.acceptedByBuyer) ||
                  (currentUser?.id === selected.sellerId && !selectedWorkflow.acceptedBySeller)) && (
                  <button
                    onClick={() => void handleAcceptPurchase()}
                    disabled={isAccepting}
                    className={cn(
                      "flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-150 active:scale-95",
                      "bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm",
                      "disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100"
                    )}
                  >
                    <ShoppingCart className="w-3.5 h-3.5 flex-shrink-0" />
                    {isAccepting ? "Aceptando..." : "Aceptar compra"}
                  </button>
                )}

              {selected.status === "aceptada" && (
                <span className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
                  Compra aceptada
                </span>
              )}
            </div>

            {error && (
              <div className="mx-4 mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <div className="flex-1 overflow-y-auto px-4 py-5 space-y-2.5">
              {selectedMessages.map((message, index) => {
                const isOwn = message.senderId === currentUser?.id;
                const sender = usersById[message.senderId];
                const previousMessage = selectedMessages[index - 1];
                const showAvatar = !isOwn && message.senderId !== previousMessage?.senderId;

                return (
                  <div key={message.id} className={cn("flex items-end gap-2", isOwn ? "justify-end" : "justify-start")}>
                    {!isOwn && (
                      <div className="w-7 flex-shrink-0 mb-0.5">
                        {showAvatar && <Avatar src={sender?.avatar} name={sender?.name} size="xs" />}
                      </div>
                    )}

                    <div className={cn("flex flex-col gap-0.5 max-w-[72%]", isOwn ? "items-end" : "items-start")}>
                      <div
                        className={cn(
                          "px-4 py-2.5 rounded-2xl text-sm leading-relaxed break-words",
                          isOwn
                            ? "bg-gradient-to-br from-violet-600 to-purple-600 text-white rounded-br-sm shadow-sm shadow-violet-200"
                            : "bg-white border border-border/60 text-foreground rounded-bl-sm shadow-sm"
                        )}
                      >
                        {message.text}
                      </div>
                      <span className="text-[10px] text-muted-foreground/60 px-1">
                        {msgTime(message.sentAt)}
                      </span>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {selected.status === "aceptada" && (
              <div className="flex-shrink-0 mx-4 mb-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3.5 flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="flex items-center gap-2.5 flex-1 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-emerald-100 flex items-center justify-center flex-shrink-0">
                    <PackageCheck className="w-4 h-4 text-emerald-700" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-emerald-900 leading-tight">
                      Recojo confirmado por ambas partes
                    </p>
                    <p className="text-xs text-emerald-700/70 mt-0.5">
                      La solicitud cambio a aceptada despues de la doble confirmacion.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {selected.status === "pendiente" && selectedWorkflow && !selectedWorkflow.allAccepted && (
              <div className="flex-shrink-0 mx-4 mb-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
                  <Clock className="w-4 h-4 text-amber-700" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-amber-900">Esperando aceptacion de ambas partes</p>
                  <p className="text-xs text-amber-700/70 mt-0.5">
                    La solicitud sigue en pendiente hasta que vendedor y comprador acepten.
                  </p>
                </div>
              </div>
            )}

            {selected.status === "pendiente" && selectedWorkflow?.allAccepted && (
              <div className="flex-shrink-0 mx-4 mb-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3.5 flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="flex items-center gap-2.5 flex-1 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-emerald-100 flex items-center justify-center flex-shrink-0">
                    <PackageCheck className="w-4 h-4 text-emerald-700" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-emerald-900 leading-tight">
                      Compra confirmada por ambas partes
                    </p>
                    <p className="text-xs text-emerald-700/70 mt-0.5">
                      {currentUser?.id === selected.buyerId
                        ? selectedWorkflow.pickupByBuyer
                          ? "Ya confirmaste recojo. Falta la otra parte."
                          : "Cuando recibas el libro, confirma aqui."
                        : selectedWorkflow.pickupBySeller
                          ? "Ya confirmaste entrega. Falta la otra parte."
                          : "Cuando entregues el libro, confirma aqui."}
                    </p>
                  </div>
                </div>
                {((currentUser?.id === selected.buyerId && !selectedWorkflow.pickupByBuyer) ||
                  (currentUser?.id === selected.sellerId && !selectedWorkflow.pickupBySeller)) && (
                  <button
                    onClick={() => void handleConfirmDelivery()}
                    disabled={isConfirming}
                    className={cn(
                      "flex-shrink-0 flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-150 active:scale-95",
                      "bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm shadow-emerald-200/60",
                      "disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100"
                    )}
                  >
                    <HandshakeIcon className="w-4 h-4 flex-shrink-0" />
                    {isConfirming ? "Confirmando..." : "Ya recogi / entregue"}
                  </button>
                )}
              </div>
            )}

            <div className="flex-shrink-0 px-4 py-3.5 bg-white border-t border-border/60">
              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  void sendMessage();
                }}
                className="flex items-center gap-2.5"
              >
                <input
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  placeholder="Escribe un mensaje..."
                  className="flex-1 px-4 py-2.5 rounded-2xl border border-border bg-muted/40 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-violet-300/60 focus:border-violet-400 focus:bg-white transition-all"
                />
                <button
                  type="submit"
                  disabled={!input.trim()}
                  className={cn(
                    "w-10 h-10 flex-shrink-0 rounded-2xl flex items-center justify-center transition-all duration-150",
                    "bg-gradient-to-br from-violet-600 to-purple-600 text-white shadow-sm shadow-violet-200",
                    "hover:from-violet-700 hover:to-purple-700 active:scale-95",
                    "disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100"
                  )}
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center px-8">
            <div className="w-16 h-16 rounded-2xl bg-violet-50 flex items-center justify-center ring-1 ring-violet-100">
              <MessageCircle className="w-7 h-7 text-violet-400" />
            </div>
            <div className="space-y-1.5">
              <p className="text-sm font-semibold text-foreground">Selecciona una conversación</p>
              <p className="text-xs text-muted-foreground leading-relaxed max-w-[220px]">
                Cuando envíes interés por un libro, aparecerá aquí el hilo con el vendedor.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

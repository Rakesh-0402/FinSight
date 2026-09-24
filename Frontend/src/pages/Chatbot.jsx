import { API_URL } from "@/lib/utils";
import {
  useEffect,
  useRef,
  useState,
} from "react";
import { authFetch } from "@/utils/authFetch";
import ReactMarkdown from "react-markdown";
import{toast} from 'sonner';
import {
  Bot,
  Check,
  ChevronLeft,
  ChevronRight,
  Copy,
  Menu,
  MessageSquare,
  Plus,
  Search,
  Send,
  Sparkles,
  Trash2,
  User,
} from "lucide-react";

import {Button} from "@/components/ui/button";

import {Badge} from "@/components/ui/badge";

import {Skeleton} from "@/components/ui/skeleton";

import {Sheet,SheetContent} from "@/components/ui/sheet";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function Chatbot() {
  const token = localStorage.getItem("token");

  const defaultMessage = {
    role: "assistant",
    text: "Hi! Ask me anything about your finances, spending patterns, anomalies, or trends.",
  };

  const [messages,setMessages] = useState([defaultMessage]);

  const [question,setQuestion] = useState("");

  const [loading,setLoading] = useState(false);

  const [chats,setChats] = useState([]);

  const [chatId,setChatId] = useState(localStorage.getItem("activeChatId"));

  const [sidebarOpen,setSidebarOpen] = useState(true);

  const [mobileHistoryOpen,setMobileHistoryOpen] = useState(false);

  const [search,setSearch] = useState("");

  const [deleteChatId,setDeleteChatId] = useState(null);

  const [copiedIndex,setCopiedIndex] = useState(null);

  const messagesEndRef = useRef(null);

  const inputRef = useRef(null);

  const suggestedQuestions = [
    "Where am I spending the most?",
    "What are my unusual transactions?",
    "How is my spending changing?",
    "What should I reduce?",
  ];

  useEffect(() => {
    fetchChats();

    const savedChatId = localStorage.getItem("activeChatId");

    if (savedChatId) {loadChat(savedChatId);}
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView(
      {behavior: "smooth"}
    );
  }, [messages, loading]);

  const fetchChats = async () => {
    try {
      const response =await authFetch(`${API_URL}/api/chat`);
      
      if (!response) return;
      const data =await response.json();

      if (response.ok) {
        setChats(data.chats || []);
      }
    } catch (error) {
      console.error("Failed to load chats:",error);
    }
  };

  const loadChat = async (id) => {
    try {
      setLoading(true);

      const response = await authFetch(`${API_URL}/api/chat/${id}`);

      if (!response) return;
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message ||"Failed to load chat");
      }

      setChatId(id);

      localStorage.setItem("activeChatId",id);

      setMessages(
        (data.chat.messages ||[]).map(
          (message) => ({
            role:message.role,
            text:message.text,
          })
        )
      );

      setMobileHistoryOpen(false);
    } catch (error) {
      console.error("Load chat error:",error);
    } finally {
      setLoading(false);
    }
  };

  const startNewChat = () => {
    setChatId(null);

    localStorage.removeItem("activeChatId");

    setMessages([defaultMessage]);

    setQuestion("");
    setMobileHistoryOpen(false);

    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  };

  const confirmDeleteChat =
    async () => {
      if (!deleteChatId) {
        return;
      }

      try {
        const response = await authFetch(`${API_URL}/api/chat/${deleteChatId}`,
            {
              method: "DELETE",
            }
          );

        if (!response) return;
        if (!response.ok) {
          throw new Error("Failed to delete chat");
        }

        if (chatId ===deleteChatId) {
          startNewChat();
        }

        setDeleteChatId(null);

        fetchChats();
        toast.success("Chat deleted successfully"); 
      } catch (error) {
        console.error("Delete chat error:",error
        );
      }
    };

  const sendMessage = async (customQuestion = null) => {
    const userQuestion = customQuestion ||question.trim();

    if (!userQuestion || loading) {
      return;
    }

    setMessages((prev) => [ ...prev,
        {
          role: "user",
          text: userQuestion,
        },
      ]
    );

    setQuestion("");
    setLoading(true);

    try {
      const response = await authFetch(`${API_URL}/api/chat`,
          {
            method: "POST",

            headers: {
              "Content-Type":"application/json",
            },

            body: JSON.stringify({
              question:userQuestion,
              chatId,
            }),
          }
        );

        if (!response) return;
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message ||"Failed to get response");
        }

        if (data.chatId) {
          setChatId(data.chatId);
          localStorage.setItem("activeChatId",data.chatId);
        }

      setMessages(
        (prev) => [
          ...prev,
          {
            role:"assistant",
            text:data.answer ||"I could not generate an answer."
          },
        ]
      );

      fetchChats();
    } catch (error) {
      console.error("Chat error:",error);

      setMessages(
        (prev) => [
          ...prev,
          {
            role:"assistant",
            text:"Sorry, I could not process your request right now.",
            error: true,
          },
        ]
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    sendMessage();
  };

  const handleKeyDown = (event) => {
    if (
      event.key ==="Enter" &&!event.shiftKey
    ) {
      event.preventDefault();
      sendMessage();
    }
  };

  const copyMessage = async (text,index) => {
    try {
      await navigator.clipboard.writeText(
        text
      );

      setCopiedIndex(index);

      setTimeout(() => {setCopiedIndex(null);}, 1500);
    } catch (error) {
      console.error("Copy failed:",error);
    }
  };

  const filteredChats =
    chats.filter((chat) =>
      (chat.title ||"New Chat")
        .toLowerCase()
        .includes(
          search.toLowerCase()
        )
    );
const deleteAllChats = async () => {
  try {
    const response = await authFetch(`${API_URL}/api/chat`,
      {
        method: "DELETE",
      }
    );

    if (!response) return;
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Failed to delete chats");
    }

    setChats([]);
    setMessages([
      {
        role: "assistant",
        text: "Hi! Ask me anything about your finances.",
      },
    ]);

    setChatId(null);
    localStorage.removeItem("activeChatId");

    toast.success("All chats deleted successfully");
  } catch (error) {
    console.error("Delete all chats error:",error.message);

    toast.error(
      error.message || "Failed to delete chats"
    );
  }
};
  const renderChatHistory = (mobile = false) => (
    <div className="flex h-full flex-col">

      {/* Sidebar header */}

      <div className="border-b border-slate-200/80 p-4 dark:border-slate-800">

        <div className="flex items-center gap-2">
           {/*delete all chats*/}
         
        {chats.length > 0 && (
          <AlertDialog>
            <AlertDialogTrigger
              render={
                <Button
                  variant="outline"
                  className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 dark:border-red-900 dark:hover:bg-red-950/30"
                />
              }
            >
              Delete all
            </AlertDialogTrigger>

            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete all chats?</AlertDialogTitle>

                <AlertDialogDescription>
                  This will permanently delete all your conversations history and This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>

              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>

                <AlertDialogAction
                  onClick={deleteAllChats}
                  className="bg-red-500 text-white hover:bg-red-600"
                >
                  Delete all chats
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}

          <Button
            onClick={startNewChat}
            className="flex-1 rounded-xl bg-[#07111F] text-white hover:bg-[#07111F]/90 dark:bg-white dark:text-[#07111F] dark:hover:bg-slate-200"
          >
            <Plus size={17}/>

            New Chat
          </Button>

          {!mobile && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() =>setSidebarOpen(false)}
              className="rounded-xl"
            >
              <ChevronLeft size={18}/>
            </Button>
          )}
        </div>

        {/* Search */}
        <div className="relative mt-4">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />

          <input
            value={search}
            onChange={(event) =>setSearch(event.target.value)}
            placeholder="Search conversations"
            className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#4F6BFF] focus:bg-white focus:ring-4 focus:ring-[#4F6BFF]/10 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:placeholder:text-slate-500"
          />
        </div>
      </div>

      {/* Conversations */}
      <div className="flex-1 overflow-y-auto px-3 py-4">

        <p className="mb-3 px-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400 dark:text-slate-500">
          Conversations
        </p>

        <div className="space-y-1">
          {filteredChats.length ===
          0 ? (
            <div className="px-3 py-8 text-center">

              <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-400 dark:bg-slate-800">
                <MessageSquare size={18}/>
              </div>

              <p className="mt-3 text-sm font-medium text-slate-500 dark:text-slate-400">
                No conversations found
              </p>
            </div>
          ) : (
            filteredChats.map(
              (chat) => (
                <div
                  key={chat._id}
                  onClick={() =>loadChat(chat._id)}
                  className={`group flex cursor-pointer items-center gap-2 rounded-xl px-3 py-2.5 transition ${
                    chatId ===chat._id
                      ? "bg-[#4F6BFF]/10 text-[#4F6BFF] dark:bg-[#4F6BFF]/15 dark:text-[#8EA0FF]"
                      : "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800/60"
                  }`}
                >

                  <MessageSquare size={16} className="shrink-0"/>

                  <p className="min-w-0 flex-1 truncate text-sm font-medium">
                    {chat.title ||"New Chat"}
                  </p>

                  <button
                    onClick={(event) => {
                      event.stopPropagation(); 
                      setDeleteChatId(chat._id);
                    }}
                    className="hidden h-7 w-7 items-center justify-center rounded-lg text-slate-400 transition hover:bg-red-50 hover:text-red-600 group-hover:flex dark:hover:bg-red-950/30 dark:hover:text-red-400"
                  >
                    <Trash2 size={14}/>
                  </button>
                </div>
              )
            )
          )}
        </div>
      </div>

      {/* Sidebar footer */}
      <div className="border-t border-slate-200/80 px-4 py-3 text-xs text-slate-400 dark:border-slate-800 dark:text-slate-500">
        Conversations are saved automatically.
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      {/*PAGE HEADER */}

      <div className="flex items-end justify-between gap-4">

        <div>
          <Badge
            variant="secondary"
            className="mb-3 rounded-full bg-[#4F6BFF]/10 px-3 py-1 text-[#4F6BFF] hover:bg-[#4F6BFF]/10 dark:bg-[#4F6BFF]/15 dark:text-[#8EA0FF]"
          >
            AI financial assistant
          </Badge>

          <h1 className="text-2xl font-black tracking-tight text-[#07111F] dark:text-white sm:text-3xl">
            Ask FinSight
          </h1>

          <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">
            Ask questions about your spending, trends, categories and unusual transactions.
          </p>
        </div>
      </div>

      {/*CHAT SHELL */}
    <div className="relative flex h-[calc(100dvh-210px)] min-h-[560px] overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-sm dark:border-slate-800 dark:bg-[#081321]">
        
        {/* DESKTOP CHAT HISTORY */}

        {sidebarOpen && (
          <aside className="hidden w-72 shrink-0 border-r border-slate-200/80 bg-slate-50/60 lg:block dark:border-slate-800 dark:bg-[#07111F]/40">
            {renderChatHistory()}
          </aside>
        )}

        {/* MAIN CHAT */}

        <div className="flex min-w-0 flex-1 flex-col">

          {/* Chat header */}
          <div className="flex h-16 shrink-0 items-center justify-between border-b border-slate-200/80 px-4 sm:px-5 dark:border-slate-800">

            <div className="flex min-w-0 items-center gap-3">
              {/* Mobile history */}

              <Button
                variant="ghost"
                size="icon"
                onClick={() =>setMobileHistoryOpen(true)}
                className="rounded-xl lg:hidden"
              >
                <Menu size={19}/>
              </Button>

              {/* Desktop expand */}

              {!sidebarOpen && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() =>setSidebarOpen(true)}
                  className="hidden rounded-xl lg:inline-flex"
                >
                  <ChevronRight size={19}/>
                </Button>
              )}

              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#07111F] text-white dark:bg-white dark:text-[#07111F]">
                <Bot size={19}/>
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-2">

                  <p className="truncate text-sm font-bold text-[#07111F] dark:text-white">
                    FinSight Assistant
                  </p>

                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                </div>

                <p className="truncate text-xs text-slate-400 dark:text-slate-500">
                  Financial context enabled
                </p>
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={startNewChat}
              className="hidden rounded-xl sm:inline-flex"
            >
              <Plus size={16}/>

              New chat
            </Button>
          </div>

          {/* MESSAGES */}

          <div className="flex-1 overflow-y-auto">

            <div className="mx-auto w-full max-w-3xl px-4 py-6 sm:px-6 sm:py-8">

              {messages.length <=
                1 && (
                <div className="mb-10 pt-4 text-center">

                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#4F6BFF]/10 text-[#4F6BFF] dark:bg-[#4F6BFF]/20 dark:text-[#8EA0FF]">
                    <Sparkles size={24}/>
                  </div>

                  <h2 className="mt-5 text-xl font-black tracking-tight text-[#07111F] dark:text-white sm:text-2xl">
                    What would you like to know?
                  </h2>

                  <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500 dark:text-slate-400">
                    Ask FinSight about your spending, categories, financial trends orunusual activity.
                  </p>

                  <div className="mx-auto mt-7 grid max-w-2xl gap-3 sm:grid-cols-2">

                    {suggestedQuestions.map((item) => (
                        <button
                          key={item}
                          onClick={() =>sendMessage(item)}
                          disabled={loading}
                          className="group rounded-2xl border border-slate-200 bg-white p-4 text-left text-sm font-medium text-slate-600 transition hover:-translate-y-0.5 hover:border-[#4F6BFF]/40 hover:bg-[#4F6BFF]/[0.03] hover:text-[#4F6BFF] dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-[#4F6BFF]/50 dark:hover:bg-[#4F6BFF]/5"
                        >
                          <div className="flex items-center justify-between gap-4">

                            <span>{item}</span>
                            <Sparkles
                              size={15}
                              className="shrink-0 text-slate-300 transition group-hover:text-[#4F6BFF]"
                            />
                          </div>
                        </button>
                      )
                    )}
                  </div>
                </div>
              )}

              <div className="space-y-7">

                {messages.map(
                  (message,index) => {
                    const isUser =
                      message.role ==="user";

                    return (
                      <div
                        key={index}
                        className={`group flex gap-3 ${
                          isUser
                            ? "justify-end"
                            : "justify-start"
                        }`}
                      >

                        {/* Assistant avatar */}
                        {!isUser && (
                          <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#07111F] text-white dark:bg-white dark:text-[#07111F]">
                            <Bot size={15}/>
                          </div>
                        )}

                        <div
                          className={`min-w-0 ${
                            isUser
                              ? "max-w-[85%] sm:max-w-[75%]"
                              : "max-w-[calc(100%-44px)] sm:max-w-[85%]"
                          }`}
                        >

                          <div
                            className={`rounded-2xl px-4 py-3 text-sm leading-7 ${
                              isUser
                                ? "rounded-br-md bg-[#07111F] text-white dark:bg-white dark:text-[#07111F]"
                                : message.error
                                ? "rounded-bl-md border border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-400"
                                : "rounded-bl-md bg-slate-100/80 text-slate-700 dark:bg-slate-800/70 dark:text-slate-200"
                            }`}
                          >
                            {isUser ? (message.text) : (
                              <div className="prose prose-sm max-w-none prose-slate prose-p:leading-7 prose-li:leading-7 dark:prose-invert">
                                <ReactMarkdown>
                                  {
                                    message.text
                                  }
                                </ReactMarkdown>
                              </div>
                            )}
                          </div>

                          {/* Assistant actions */}
                          {!isUser &&
                            !message.error && (
                              <div className="mt-2 flex h-7 items-center gap-1 opacity-0 transition group-hover:opacity-100">

                                <button
                                  onClick={() =>copyMessage(message.text,index)}
                                  className="flex h-7 items-center gap-1.5 rounded-lg px-2 text-xs text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                                >
                                  {copiedIndex ===index ? (
                                    <><Check size={13}/>Copied </>
                                  ) : (
                                    <> <Copy size={13}/>Copy</>
                                  )}
                                </button>
                              </div>
                            )}
                        </div>

                        {/* User avatar */}
                        {isUser && (
                          <div className="mt-1 hidden h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#4F6BFF]/10 text-[#4F6BFF] sm:flex dark:bg-[#4F6BFF]/20 dark:text-[#8EA0FF]">
                            <User size={15}/>
                          </div>
                        )}
                      </div>
                    );
                  }
                )}

                {/* Thinking */}
                {loading && (
                  <div className="flex gap-3">

                    <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#07111F] text-white dark:bg-white dark:text-[#07111F]">
                      <Bot size={15}/>
                    </div>

                    <div className="rounded-2xl rounded-bl-md bg-slate-100/80 px-4 py-3 dark:bg-slate-800/70">

                      <div className="flex items-center gap-1.5">
                        <span className="h-2 w-2 animate-pulse rounded-full bg-slate-400" />
                        <span className="h-2 w-2 animate-pulse rounded-full bg-slate-400 [animation-delay:150ms]" />
                        <span className="h-2 w-2 animate-pulse rounded-full bg-slate-400 [animation-delay:300ms]" />
                      </div>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef}/></div>
            </div>
          </div>

          {/* composer */}

          <div className="shrink-0 border-t border-slate-200/80 bg-white/95 px-3 py-3 backdrop-blur sm:px-5 sm:py-4 dark:border-slate-800 dark:bg-[#081321]/95">

            <form
              onSubmit={handleSubmit}className="mx-auto max-w-3xl"
            >
              <div className="relative rounded-2xl border border-slate-200 bg-slate-50 transition focus-within:border-[#4F6BFF] focus-within:bg-white focus-within:ring-4 focus-within:ring-[#4F6BFF]/10 dark:border-slate-700 dark:bg-slate-900 dark:focus-within:bg-slate-950">

                <textarea
                  ref={inputRef}
                  rows={1}
                  value={question}
                  onChange={(event) =>setQuestion(event.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask about your finances..."
                  disabled={loading}
                  className="max-h-32 min-h-12 w-full resize-none bg-transparent px-4 py-3.5 pr-14 text-sm leading-6 text-slate-900 outline-none placeholder:text-slate-400 dark:text-white dark:placeholder:text-slate-500"
                />

                <Button
                  type="submit"
                  size="icon"
                  disabled={loading ||!question.trim()}
                  className="absolute bottom-1.5 right-1.5 h-9 w-9 rounded-xl bg-[#07111F] text-white hover:bg-[#07111F]/90 disabled:opacity-40 dark:bg-white dark:text-[#07111F] dark:hover:bg-slate-200"
                >
                  <Send size={16}/>
                </Button>
              </div>

              <p className="mt-2 text-center text-[11px] text-slate-400 dark:text-slate-500">
                FinSight answers using your available financial data. Review important financial decisions independently.
              </p>
            </form>
          </div>
        </div>
      </div>

      {/* MOBILE HISTORY */}

      <Sheet
        open={mobileHistoryOpen}
        onOpenChange={setMobileHistoryOpen}
      >
        <SheetContent
          side="left"
          className="w-[88vw] max-w-72 gap-0 border-r border-slate-200 bg-white p-0 dark:border-slate-800 dark:bg-[#081321]"
        >
          {renderChatHistory(true)}
        </SheetContent>
      </Sheet>

      {/*DELETE CONFIRMATION */}

      <AlertDialog
        open={Boolean(deleteChatId)}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteChatId(null);
          }
        }}
      >
        <AlertDialogContent className="rounded-3xl">

          <AlertDialogHeader>
            <AlertDialogTitle>Delete conversation?</AlertDialogTitle>
            <AlertDialogDescription> This conversation will be permanently remove from your FinSight account.</AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>

            <AlertDialogCancel>Cancel</AlertDialogCancel>

            <AlertDialogAction
              onClick={confirmDeleteChat}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
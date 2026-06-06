import { useEffect, useRef, useState } from "react";
import { useAuth } from "../../../auth/useAuth";
import {
    createAIConversationApi,
    deleteAIConversationApi,
    getAIConversationDetailApi,
    getAIConversationsApi,
    sendAIChatMessageApi,
    updateAIConversationTitleApi,
} from "../../../features/ai/ai.api";
import "./AIChatWidget.css";

const QUICK_PROMPTS = [
    "Sinh viên muốn làm bài thi thì làm như thế nào?",
    "Tại sao em không thấy lớp học của mình?",
    "Theo tài liệu, môn Lập trình Web có lộ trình ra sao?",
    "Giảng viên tạo đề thi từ ngân hàng câu hỏi thế nào?",
];

const ACCEPT_FILE_TYPES = "image/*,.pdf,.doc,.docx,.txt,.md,.csv,.json,.xls,.xlsx,.ppt,.pptx";
const MAX_FILES = 5;
const MAX_FILE_SIZE = 20 * 1024 * 1024;

function createWelcomeMessage(role) {
    const roleText =
        role === "ADMIN"
            ? "quản trị hệ thống"
            : role === "TEACHER"
                ? "giảng viên"
                : role === "STUDENT"
                    ? "sinh viên"
                    : "người dùng";

    return {
        role: "assistant",
        content: `Xin chào! Tôi là trợ lý AI của PTIT LMS. Tôi có thể hỗ trợ ${roleText} về cách dùng hệ thống, lỗi thường gặp, tài liệu học tập, phân tích file/ảnh và phương pháp học.`,
        time: formatTime(),
    };
}

function formatTime(value) {
    const date = value ? new Date(value) : new Date();

    if (Number.isNaN(date.getTime())) return "";

    return date.toLocaleTimeString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
    });
}

function formatDateTime(value) {
    if (!value) return "";

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";

    return date.toLocaleString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
    });
}

function formatFileSize(size = 0) {
    if (!size) return "";
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${Math.round(size / 1024)} KB`;
    return `${(size / 1024 / 1024).toFixed(1)} MB`;
}

function getAttachmentKind(file) {
    if (file?.type?.startsWith("image/")) return "image";
    if (file?.mimeType?.startsWith("image/")) return "image";
    if (file?.kind) return file.kind;
    return "file";
}

function normalizeConversationMessages(messages = []) {
    return messages.map((message) => ({
        role: message.role,
        content: message.content || "",
        attachments: message.attachments || [],
        time: formatTime(message.createdAt),
        isError: false,
    }));
}

export default function AIChatWidget() {
    const { user } = useAuth();

    const [isOpen, setIsOpen] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);
    const [showConversations, setShowConversations] = useState(false);
    const [conversations, setConversations] = useState([]);
    const [currentConversationId, setCurrentConversationId] = useState(null);
    const [messages, setMessages] = useState(() => [createWelcomeMessage(user?.role)]);
    const [input, setInput] = useState("");
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [loading, setLoading] = useState(false);
    const [loadingConversations, setLoadingConversations] = useState(false);
    const [error, setError] = useState("");

    const bodyRef = useRef(null);
    const textareaRef = useRef(null);
    const fileInputRef = useRef(null);

    const loadConversations = async () => {
        try {
            setLoadingConversations(true);
            const result = await getAIConversationsApi();
            setConversations(Array.isArray(result?.DT) ? result.DT : []);
        } catch (err) {
            console.error("Cannot load AI conversations", err);
        } finally {
            setLoadingConversations(false);
        }
    };

    useEffect(() => {
        if (!isOpen) return;
        loadConversations();
    }, [isOpen]);

    useEffect(() => {
        setMessages([createWelcomeMessage(user?.role)]);
        setCurrentConversationId(null);
        setSelectedFiles([]);
        setInput("");
        setError("");
    }, [user?.role, user?._id, user?.id, user?.code]);

    useEffect(() => {
        if (bodyRef.current) {
            bodyRef.current.scrollTo({
                top: bodyRef.current.scrollHeight,
                behavior: "smooth",
            });
        }
    }, [messages, loading, isOpen]);

    useEffect(() => {
        const textarea = textareaRef.current;
        if (!textarea) return;

        textarea.style.height = "auto";
        textarea.style.height = `${Math.min(textarea.scrollHeight, 118)}px`;
    }, [input]);

    useEffect(() => {
        if (!isOpen) return undefined;

        const handleKeyDown = (event) => {
            if (event.key === "Escape") {
                setIsOpen(false);
            }
        };

        document.addEventListener("keydown", handleKeyDown);
        return () => document.removeEventListener("keydown", handleKeyDown);
    }, [isOpen]);

    const startNewConversation = () => {
        setCurrentConversationId(null);
        setMessages([createWelcomeMessage(user?.role)]);
        setSelectedFiles([]);
        setInput("");
        setError("");
        requestAnimationFrame(() => textareaRef.current?.focus());
    };

    const createEmptyConversation = async () => {
        try {
            const result = await createAIConversationApi("Cuộc trò chuyện mới");
            const conversation = result?.DT;
            if (conversation?._id) {
                setCurrentConversationId(conversation._id);
                setMessages([createWelcomeMessage(user?.role)]);
                setSelectedFiles([]);
                setInput("");
                setError("");
                await loadConversations();
            } else {
                startNewConversation();
            }
        } catch (err) {
            console.error("Cannot create AI conversation", err);
            startNewConversation();
        }
    };

    const openConversation = async (conversationId) => {
        if (!conversationId || loading) return;

        try {
            setError("");
            const result = await getAIConversationDetailApi(conversationId);
            const conversation = result?.DT;

            if (!conversation?._id) {
                setError("Không tìm thấy cuộc trò chuyện này.");
                return;
            }

            setCurrentConversationId(conversation._id);
            setMessages(
                conversation.messages?.length
                    ? normalizeConversationMessages(conversation.messages)
                    : [createWelcomeMessage(user?.role)]
            );
            setSelectedFiles([]);
            setInput("");
        } catch (err) {
            console.error("Cannot open AI conversation", err);
            setError(err?.response?.data?.EM || "Không thể mở cuộc trò chuyện này.");
        }
    };

    const renameConversation = async (conversationId, currentTitle) => {
        const nextTitle = window.prompt("Nhập tên mới cho cuộc trò chuyện:", currentTitle || "");
        if (!nextTitle || !nextTitle.trim()) return;

        try {
            await updateAIConversationTitleApi(conversationId, nextTitle.trim());
            await loadConversations();
        } catch (err) {
            console.error("Cannot rename AI conversation", err);
            setError(err?.response?.data?.EM || "Không thể đổi tên cuộc trò chuyện.");
        }
    };

    const deleteConversation = async (conversationId) => {
        const ok = window.confirm("Bạn có chắc muốn xóa cuộc trò chuyện AI này không?");
        if (!ok) return;

        try {
            await deleteAIConversationApi(conversationId);
            if (conversationId === currentConversationId) {
                startNewConversation();
            }
            await loadConversations();
        } catch (err) {
            console.error("Cannot delete AI conversation", err);
            setError(err?.response?.data?.EM || "Không thể xóa cuộc trò chuyện.");
        }
    };

    const validateFiles = (files) => {
        if (files.length > MAX_FILES) {
            return `Chỉ được chọn tối đa ${MAX_FILES} file mỗi lần.`;
        }

        const oversized = files.find((file) => file.size > MAX_FILE_SIZE);
        if (oversized) {
            return `File ${oversized.name} vượt quá 20MB.`;
        }

        return "";
    };

    const handleFileChange = (event) => {
        const files = Array.from(event.target.files || []);
        event.target.value = "";

        const nextFiles = [...selectedFiles, ...files].slice(0, MAX_FILES);
        const validationError = validateFiles(nextFiles);

        if (validationError) {
            setError(validationError);
            return;
        }

        setSelectedFiles(nextFiles);
        setError("");
    };

    const removeSelectedFile = (index) => {
        setSelectedFiles((prev) => prev.filter((_, fileIndex) => fileIndex !== index));
    };

    const sendMessage = async (customContent) => {
        const content = (customContent || input).trim();
        if ((!content && selectedFiles.length === 0) || loading) return;

        const filesToSend = [...selectedFiles];
        const validationError = validateFiles(filesToSend);
        if (validationError) {
            setError(validationError);
            return;
        }

        const userMessage = {
            role: "user",
            content: content || "Đã gửi file/ảnh cho AI phân tích.",
            time: formatTime(),
            attachments: filesToSend.map((file) => ({
                originalName: file.name,
                mimeType: file.type,
                size: file.size,
                kind: getAttachmentKind(file),
            })),
        };

        const nextMessages = [...messages, userMessage];

        setMessages(nextMessages);
        setInput("");
        setSelectedFiles([]);
        setLoading(true);
        setError("");

        try {
            const result = await sendAIChatMessageApi({
                message: content,
                conversationId: currentConversationId,
                files: filesToSend,
            });

            const answer =
                result?.DT?.answer ||
                result?.data?.answer ||
                "Xin lỗi, tôi chưa có câu trả lời phù hợp cho câu hỏi này.";

            const newConversationId = result?.DT?.conversationId;
            if (newConversationId) {
                setCurrentConversationId(newConversationId);
            }

            setMessages([
                ...nextMessages,
                {
                    role: "assistant",
                    content: answer,
                    time: formatTime(),
                },
            ]);

            await loadConversations();
        } catch (err) {
            console.error("AI chat error", err);

            const serverMessage =
                err?.response?.data?.EM ||
                err?.response?.data?.message ||
                "Chatbot AI chưa phản hồi được. Vui lòng kiểm tra backend, API key hoặc quota OpenAI.";

            setError(serverMessage);
            setMessages([
                ...nextMessages,
                {
                    role: "assistant",
                    content: serverMessage,
                    time: formatTime(),
                    isError: true,
                },
            ]);
        } finally {
            setLoading(false);
            requestAnimationFrame(() => textareaRef.current?.focus());
        }
    };

    const handleSubmit = (event) => {
        event.preventDefault();
        sendMessage();
    };

    const handleKeyDown = (event) => {
        if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            sendMessage();
        }
    };

    return (
        <>
            <button
                type="button"
                className={isOpen ? "ai-chat-launcher open" : "ai-chat-launcher"}
                onClick={() => setIsOpen((prev) => !prev)}
                aria-label={isOpen ? "Đóng trợ lý AI" : "Mở trợ lý AI"}
            >
                {isOpen ? "×" : <span>AI</span>}
            </button>

            {isOpen && (
                <section className={isExpanded ? "ai-chat-widget expanded" : "ai-chat-widget"}>
                    <header className="ai-chat-header">
                        <div className="ai-chat-header-main">
                            <div className="ai-chat-avatar" aria-hidden="true">
                                ✦
                            </div>
                            <div>
                                <h3>Trợ lý AI PTIT LMS</h3>
                                <p>Hỏi về hệ thống, tài liệu, file/ảnh và lỗi thường gặp</p>
                            </div>
                        </div>

                        <div className="ai-chat-window-actions">
                            <button
                                type="button"
                                onClick={() => setShowConversations((prev) => !prev)}
                                title={showConversations ? "Ẩn lịch sử chat" : "Hiện lịch sử chat"}
                            >
                                ☰
                            </button>
                            <button
                                type="button"
                                onClick={() => setIsExpanded((prev) => !prev)}
                                title={isExpanded ? "Thu nhỏ" : "Phóng to"}
                            >
                                {isExpanded ? "↙" : "↗"}
                            </button>
                            <button type="button" onClick={startNewConversation} title="Chat mới">
                                +
                            </button>
                            <button type="button" onClick={() => setIsOpen(false)} title="Đóng">
                                ×
                            </button>
                        </div>
                    </header>

                    <div className="ai-chat-content">
                        {showConversations && (
                            <aside className="ai-chat-sidebar">
                                <div className="ai-chat-sidebar-head">
                                    <strong>Lịch sử chat</strong>
                                    <button type="button" onClick={createEmptyConversation}>
                                        + Mới
                                    </button>
                                </div>

                                <div className="ai-chat-conversation-list">
                                    {loadingConversations && (
                                        <div className="ai-chat-conversation-empty">Đang tải...</div>
                                    )}

                                    {!loadingConversations && conversations.length === 0 && (
                                        <div className="ai-chat-conversation-empty">Chưa có cuộc trò chuyện nào</div>
                                    )}

                                    {conversations.map((conversation) => (
                                        <div
                                            key={conversation._id}
                                            className={
                                                conversation._id === currentConversationId
                                                    ? "ai-chat-conversation active"
                                                    : "ai-chat-conversation"
                                            }
                                        >
                                            <button
                                                type="button"
                                                className="ai-chat-conversation-main"
                                                onClick={() => openConversation(conversation._id)}
                                            >
                                                <span>{conversation.title || "Cuộc trò chuyện mới"}</span>
                                                <small>{formatDateTime(conversation.updatedAt)}</small>
                                            </button>

                                            <div className="ai-chat-conversation-actions">
                                                <button
                                                    type="button"
                                                    title="Đổi tên"
                                                    onClick={() =>
                                                        renameConversation(conversation._id, conversation.title)
                                                    }
                                                >
                                                    ✎
                                                </button>
                                                <button
                                                    type="button"
                                                    title="Xóa"
                                                    onClick={() => deleteConversation(conversation._id)}
                                                >
                                                    🗑
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </aside>
                        )}

                        <main className="ai-chat-main">
                            <div className="ai-chat-body" ref={bodyRef}>
                                {messages.map((message, index) => (
                                    <article
                                        key={`${message.role}-${index}`}
                                        className={
                                            message.role === "user"
                                                ? "ai-chat-message user"
                                                : message.isError
                                                    ? "ai-chat-message assistant error"
                                                    : "ai-chat-message assistant"
                                        }
                                    >
                                        {message.role !== "user" && (
                                            <div className="ai-chat-mini-avatar" aria-hidden="true">
                                                AI
                                            </div>
                                        )}
                                        <div className="ai-chat-bubble-wrap">
                                            <div className="ai-chat-bubble">
                                                {message.content}
                                                {message.attachments?.length > 0 && (
                                                    <div className="ai-chat-attachments">
                                                        {message.attachments.map((attachment, attachmentIndex) => (
                                                            <div
                                                                key={`${attachment.originalName}-${attachmentIndex}`}
                                                                className="ai-chat-attachment"
                                                            >
                                                                <span aria-hidden="true">
                                                                    {getAttachmentKind(attachment) === "image"
                                                                        ? "🖼"
                                                                        : "📄"}
                                                                </span>
                                                                <div>
                                                                    <strong>
                                                                        {attachment.originalName ||
                                                                            attachment.name ||
                                                                            "Tệp đính kèm"}
                                                                    </strong>
                                                                    <small>{formatFileSize(attachment.size)}</small>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                            {message.time && <span className="ai-chat-time">{message.time}</span>}
                                        </div>
                                    </article>
                                ))}

                                {loading && (
                                    <article className="ai-chat-message assistant">
                                        <div className="ai-chat-mini-avatar" aria-hidden="true">
                                            AI
                                        </div>
                                        <div className="ai-chat-typing" aria-label="AI đang trả lời">
                                            <span />
                                            <span />
                                            <span />
                                        </div>
                                    </article>
                                )}
                            </div>

                            <div className="ai-chat-suggestions">
                                {QUICK_PROMPTS.map((prompt) => (
                                    <button
                                        key={prompt}
                                        type="button"
                                        onClick={() => sendMessage(prompt)}
                                        disabled={loading}
                                    >
                                        {prompt}
                                    </button>
                                ))}
                            </div>

                            {selectedFiles.length > 0 && (
                                <div className="ai-chat-selected-files">
                                    {selectedFiles.map((file, index) => (
                                        <span key={`${file.name}-${index}`}>
                                            {getAttachmentKind(file) === "image" ? "🖼" : "📄"} {file.name}
                                            <button
                                                type="button"
                                                onClick={() => removeSelectedFile(index)}
                                                title="Bỏ file"
                                            >
                                                ×
                                            </button>
                                        </span>
                                    ))}
                                </div>
                            )}

                            {error && <div className="ai-chat-error-line">{error}</div>}

                            <form className="ai-chat-footer" onSubmit={handleSubmit}>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    multiple
                                    hidden
                                    accept={ACCEPT_FILE_TYPES}
                                    onChange={handleFileChange}
                                />

                                <button
                                    type="button"
                                    className="ai-chat-attach-btn"
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={loading}
                                    title="Gửi file hoặc ảnh"
                                >
                                    📎
                                </button>

                                <textarea
                                    ref={textareaRef}
                                    value={input}
                                    onChange={(event) => setInput(event.target.value)}
                                    onKeyDown={handleKeyDown}
                                    placeholder="Nhập câu hỏi hoặc gửi file/ảnh cho trợ lý AI..."
                                    rows={1}
                                />

                                <button
                                    type="submit"
                                    disabled={loading || (!input.trim() && selectedFiles.length === 0)}
                                    title="Gửi"
                                >
                                    {loading ? "…" : "➤"}
                                </button>
                            </form>
                        </main>
                    </div>
                </section>
            )}
        </>
    );
}

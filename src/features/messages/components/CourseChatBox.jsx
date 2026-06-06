import { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "../../../auth/useAuth";
import "./CourseChatBox.css";

const API_ORIGIN = "http://localhost:8888";
const IMAGE_MAX_SIZE = 5 * 1024 * 1024;

function buildImageUrl(imageUrl) {
    if (!imageUrl) return "";

    if (imageUrl.startsWith("http://") || imageUrl.startsWith("https://")) {
        return imageUrl;
    }

    const normalized = imageUrl.replace(/\\/g, "/");
    return `${API_ORIGIN}${normalized.startsWith("/") ? normalized : `/${normalized}`}`;
}

function getSenderName(item) {
    return item.senderId?.fullName || item.senderId?.name || item.senderId?.code || "Người dùng";
}

function getInitial(name = "U") {
    return name.trim().charAt(0).toUpperCase() || "U";
}

function formatTime(value) {
    if (!value) return "--";

    return new Date(value).toLocaleTimeString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
    });
}

function formatDateLabel(value) {
    if (!value) return "Không rõ thời gian";

    const date = new Date(value);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    const sameDay = (a, b) =>
        a.getDate() === b.getDate() &&
        a.getMonth() === b.getMonth() &&
        a.getFullYear() === b.getFullYear();

    if (sameDay(date, today)) return "Hôm nay";
    if (sameDay(date, yesterday)) return "Hôm qua";

    return date.toLocaleDateString("vi-VN", {
        weekday: "long",
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
    });
}

function groupMessagesByDate(messages) {
    return messages.reduce((groups, message) => {
        const key = message.createdAt
            ? new Date(message.createdAt).toDateString()
            : "unknown";

        if (!groups[key]) {
            groups[key] = {
                label: formatDateLabel(message.createdAt),
                items: [],
            };
        }

        groups[key].items.push(message);
        return groups;
    }, {});
}

export default function CourseChatBox({
    title,
    messages,
    loading,
    onSendText,
    onSendImage,
    sending,
    emptyText,
}) {
    const { user } = useAuth();
    const [content, setContent] = useState("");
    const [pastedImage, setPastedImage] = useState(null);
    const [previewUrl, setPreviewUrl] = useState("");
    const [lightboxImage, setLightboxImage] = useState(null);
    const [error, setError] = useState("");
    const [isNearBottom, setIsNearBottom] = useState(true);
    const [isDragging, setIsDragging] = useState(false);

    const messagesRef = useRef(null);
    const textareaRef = useRef(null);
    const fileInputRef = useRef(null);

    const groupedMessages = useMemo(() => groupMessagesByDate(messages), [messages]);

    const scrollToBottom = (behavior = "smooth") => {
        const node = messagesRef.current;
        if (!node) return;
        node.scrollTo({ top: node.scrollHeight, behavior });
    };

    useEffect(() => {
        if (isNearBottom) {
            scrollToBottom("smooth");
        }
    }, [messages, isNearBottom]);

    useEffect(() => {
        if (!pastedImage) {
            setPreviewUrl("");
            return;
        }

        const url = URL.createObjectURL(pastedImage);
        setPreviewUrl(url);

        return () => URL.revokeObjectURL(url);
    }, [pastedImage]);

    useEffect(() => {
        const textarea = textareaRef.current;
        if (!textarea) return;

        textarea.style.height = "auto";
        textarea.style.height = `${Math.min(textarea.scrollHeight, 132)}px`;
    }, [content]);

    useEffect(() => {
        if (!lightboxImage) return undefined;

        const handleEsc = (event) => {
            if (event.key === "Escape") {
                setLightboxImage(null);
            }
        };

        document.addEventListener("keydown", handleEsc);
        return () => document.removeEventListener("keydown", handleEsc);
    }, [lightboxImage]);

    const handleScroll = () => {
        const node = messagesRef.current;
        if (!node) return;

        const distanceFromBottom = node.scrollHeight - node.scrollTop - node.clientHeight;
        setIsNearBottom(distanceFromBottom < 90);
    };

    const validateImage = (imageFile) => {
        if (!imageFile.type.startsWith("image/")) {
            setError("Vui lòng chọn đúng định dạng ảnh.");
            return false;
        }

        if (imageFile.size > IMAGE_MAX_SIZE) {
            setError("Ảnh tối đa 5MB để đảm bảo tốc độ gửi ổn định.");
            return false;
        }

        setError("");
        return true;
    };

    const attachImage = (imageFile) => {
        if (!imageFile || !validateImage(imageFile)) return;
        setPastedImage(imageFile);
    };

    const clearImagePreview = () => {
        setPastedImage(null);
        setPreviewUrl("");
        setError("");
    };

    const handleSendText = async (event) => {
        event.preventDefault();

        const trimmed = content.trim();
        if (!trimmed || sending) return;

        setError("");
        await onSendText(trimmed);
        setContent("");
        setIsNearBottom(true);
        requestAnimationFrame(() => scrollToBottom("smooth"));
    };

    const handlePaste = (event) => {
        const items = event.clipboardData?.items || [];

        for (let i = 0; i < items.length; i += 1) {
            const item = items[i];

            if (item.kind === "file" && item.type.startsWith("image/")) {
                const imageFile = item.getAsFile();
                if (imageFile) {
                    attachImage(imageFile);
                    event.preventDefault();
                    return;
                }
            }
        }
    };

    const handleFileChange = (event) => {
        const imageFile = event.target.files?.[0];
        attachImage(imageFile);
        event.target.value = "";
    };

    const handleDragEnter = (event) => {
        event.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
            setIsDragging(false);
        }
    };

    const handleDrop = (event) => {
        event.preventDefault();
        setIsDragging(false);
        const imageFile = Array.from(event.dataTransfer?.files || []).find((file) =>
            file.type.startsWith("image/")
        );
        attachImage(imageFile);
    };

    const handleSendImage = async () => {
        if (!pastedImage || sending) return;

        setError("");
        await onSendImage(pastedImage);
        clearImagePreview();
        setIsNearBottom(true);
        requestAnimationFrame(() => scrollToBottom("smooth"));
    };

    const handleKeyDown = (event) => {
        if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            handleSendText(event);
        }
    };

    const isOwnMessage = (item) => {
        const sender = item.senderId;
        return (
            sender?._id === user?._id ||
            sender?.id === user?._id ||
            sender?.code === user?.code
        );
    };

    return (
        <div
            className={isDragging ? "course-chat-card dragging" : "course-chat-card"}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={(event) => event.preventDefault()}
            onDrop={handleDrop}
        >
            {isDragging && (
                <div className="course-chat-drop-overlay">
                    <div>
                        <span>🖼️</span>
                        <strong>Thả ảnh vào đây để gửi</strong>
                        <p>Hỗ trợ ảnh tối đa 5MB</p>
                    </div>
                </div>
            )}
            <div className="course-chat-header">
                <div className="course-chat-title-group">
                    <span className="course-chat-status-dot" aria-hidden="true" />
                    <div>
                        <h3>{title}</h3>
                        <p>Trao đổi tức thời theo lớp, hỗ trợ ảnh và xem trước nội dung.</p>
                    </div>
                </div>

                <div className="course-chat-header-actions">
                    <span className="course-chat-header-badge">{messages.length} tin nhắn</span>
                    <button
                        type="button"
                        className="course-chat-header-action-btn"
                        onClick={() => scrollToBottom("smooth")}
                        title="Cuộn xuống tin nhắn mới nhất"
                    >
                        Tin mới ↓
                    </button>
                </div>
            </div>

            <div className="course-chat-messages" ref={messagesRef} onScroll={handleScroll}>
                {loading ? (
                    <div className="course-chat-loading-list">
                        <div className="course-chat-skeleton" />
                        <div className="course-chat-skeleton short" />
                        <div className="course-chat-skeleton" />
                    </div>
                ) : messages.length ? (
                    Object.entries(groupedMessages).map(([groupKey, group]) => (
                        <div className="course-chat-date-group" key={groupKey}>
                            <div className="course-chat-date-divider">
                                <span>{group.label}</span>
                            </div>

                            {group.items.map((item) => {
                                const senderName = getSenderName(item);
                                const own = isOwnMessage(item);
                                const imageSrc = buildImageUrl(item.imageUrl);

                                return (
                                    <article
                                        key={item._id || `${item.createdAt}-${item.content}`}
                                        className={
                                            own
                                                ? "course-chat-message own"
                                                : "course-chat-message"
                                        }
                                    >
                                        {!own && (
                                            <div className="course-chat-avatar" aria-hidden="true">
                                                {getInitial(senderName)}
                                            </div>
                                        )}

                                        <div className="course-chat-message-stack">
                                            <div className="course-chat-meta">
                                                <strong>{own ? "Bạn" : senderName}</strong>
                                                <span>{formatTime(item.createdAt)}</span>
                                            </div>

                                            {item.type === "text" ? (
                                                <div className="course-chat-bubble text-bubble">
                                                    {item.content}
                                                </div>
                                            ) : (
                                                <button
                                                    type="button"
                                                    className="course-chat-bubble image-bubble"
                                                    onClick={() =>
                                                        setLightboxImage({
                                                            src: imageSrc,
                                                            senderName,
                                                            time: item.createdAt,
                                                        })
                                                    }
                                                    title="Ấn để phóng to ảnh"
                                                >
                                                    <img
                                                        src={imageSrc}
                                                        alt={`Ảnh do ${senderName} gửi`}
                                                        className="course-chat-image"
                                                        loading="lazy"
                                                    />
                                                    <span className="course-chat-image-zoom">
                                                        Phóng to
                                                    </span>
                                                </button>
                                            )}
                                        </div>
                                    </article>
                                );
                            })}
                        </div>
                    ))
                ) : (
                    <div className="course-chat-empty">
                        <div className="course-chat-empty-icon">💬</div>
                        <strong>Chưa có cuộc trò chuyện</strong>
                        <p>{emptyText}</p>
                    </div>
                )}
            </div>

            {!isNearBottom && messages.length > 0 && (
                <button
                    type="button"
                    className="course-chat-scroll-bottom"
                    onClick={() => scrollToBottom("smooth")}
                >
                    Tin mới ↓
                </button>
            )}

            <form className="course-chat-composer" onSubmit={handleSendText}>
                {previewUrl ? (
                    <div className="course-chat-image-preview">
                        <img src={previewUrl} alt="Ảnh đang chờ gửi" />
                        <div className="course-chat-preview-content">
                            <strong>Ảnh đã sẵn sàng gửi</strong>
                            <span>{pastedImage?.name || "Ảnh từ clipboard"}</span>
                            <div className="course-chat-preview-actions">
                                <button
                                    type="button"
                                    className="course-chat-secondary-btn"
                                    onClick={clearImagePreview}
                                >
                                    Xóa ảnh
                                </button>

                                <button
                                    type="button"
                                    className="course-chat-primary-btn"
                                    onClick={handleSendImage}
                                    disabled={sending}
                                >
                                    {sending ? "Đang gửi..." : "Gửi ảnh"}
                                </button>
                            </div>
                        </div>
                    </div>
                ) : null}

                {error && <div className="course-chat-error">{error}</div>}

                <div className="course-chat-input-row">
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        className="course-chat-file-input"
                        onChange={handleFileChange}
                    />

                    <button
                        type="button"
                        className="course-chat-icon-btn"
                        onClick={() => fileInputRef.current?.click()}
                        title="Chọn ảnh"
                    >
                        🖼️
                    </button>

                    <textarea
                        ref={textareaRef}
                        rows={1}
                        placeholder="Nhập tin nhắn... Enter để gửi, Shift + Enter để xuống dòng"
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        onPaste={handlePaste}
                        onKeyDown={handleKeyDown}
                    />

                    <button
                        type="submit"
                        className="course-chat-send-btn"
                        disabled={sending || !content.trim()}
                        title="Gửi tin nhắn"
                    >
                        {sending ? "…" : "➤"}
                    </button>
                </div>

                <div className="course-chat-hint">
                    Dán ảnh bằng Ctrl + V, kéo thả ảnh vào khung chat hoặc chọn từ máy.
                </div>
            </form>

            {lightboxImage && (
                <div className="course-chat-lightbox" role="dialog" aria-modal="true">
                    <button
                        type="button"
                        className="course-chat-lightbox-backdrop"
                        aria-label="Đóng ảnh"
                        onClick={() => setLightboxImage(null)}
                    />

                    <div className="course-chat-lightbox-content">
                        <div className="course-chat-lightbox-header">
                            <div>
                                <strong>{lightboxImage.senderName}</strong>
                                <span>{
                                    lightboxImage.time
                                        ? new Date(lightboxImage.time).toLocaleString("vi-VN")
                                        : ""
                                }</span>
                            </div>

                            <div className="course-chat-lightbox-actions">
                                <a
                                    href={lightboxImage.src}
                                    target="_blank"
                                    rel="noreferrer"
                                    title="Mở ảnh ở tab mới"
                                >
                                    Mở ảnh
                                </a>
                                <button
                                    type="button"
                                    onClick={() => setLightboxImage(null)}
                                    aria-label="Đóng"
                                >
                                    ×
                                </button>
                            </div>
                        </div>

                        <img src={lightboxImage.src} alt="Ảnh phóng to trong chat" />
                    </div>
                </div>
            )}
        </div>
    );
}

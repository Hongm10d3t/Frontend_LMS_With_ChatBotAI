import axiosClient from "../../api/axiosClient";

export async function sendAIChatMessageApi({ message = "", conversationId = "", files = [] }) {
    const formData = new FormData();

    formData.append("message", message || "");

    if (conversationId) {
        formData.append("conversationId", conversationId);
    }

    files.forEach((file) => {
        formData.append("files", file);
    });

    const response = await axiosClient.post("/ai/chat", formData, {
        headers: {
            "Content-Type": "multipart/form-data",
        },
    });

    return response.data;
}

export async function getAIConversationsApi() {
    const response = await axiosClient.get("/ai/conversations");
    return response.data;
}

export async function createAIConversationApi(title = "Cuộc trò chuyện mới") {
    const response = await axiosClient.post("/ai/conversations", { title });
    return response.data;
}

export async function getAIConversationDetailApi(conversationId) {
    const response = await axiosClient.get(`/ai/conversations/${conversationId}`);
    return response.data;
}

export async function updateAIConversationTitleApi(conversationId, title) {
    const response = await axiosClient.patch(`/ai/conversations/${conversationId}`, { title });
    return response.data;
}

export async function deleteAIConversationApi(conversationId) {
    const response = await axiosClient.delete(`/ai/conversations/${conversationId}`);
    return response.data;
}

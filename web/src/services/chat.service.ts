import api from "./api";

export type ChatMessage = { role: "user" | "assistant"; content: string };

export const sendChatMessage = async (
  message: string,
  history: ChatMessage[] = []
): Promise<{ reply: string }> => {
  const { data } = await api.post<{ reply: string }>("/chat", {
    message,
    history,
  });
  return data;
};

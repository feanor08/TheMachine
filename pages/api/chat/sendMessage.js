import { OpenAIEdgeStream } from "openai-edge-stream";
export const config = {
    runtime: "edge",
};

export default async function handler(req) {
    try {
        const { chatId: chatIdFromParam, message } = await req.json();
        //validate message data
        if (!message || typeof message !== "string" || message.length > 200) {
            return new Response(
                {
                    message: "message and required and < 200 charecters"
                },
                {
                    status: 422,
                },
            )
        }



        let chatId = chatIdFromParam;
        const initialChatMessage = {
            role: "system",
            content: "your name is chatty."
        }
        let newChatId;
        let chatMessages = [];

        if (chatId) {
            const response = await fetch(
                `${req.headers.get("origin")}/api/chat/addMessageToChat`,
                {
                    method: "POST",
                    headers: {
                        "content-type": "application/json",
                        cookie: req.headers.get("cookie"),
                    },
                    body: JSON.stringify({
                        chatId,
                        role: "user",
                        content: message
                    }),
                },
            );
            const json = await response.json();
            chatMessages = json.chat.messages || [];

        } else {
            const response = await fetch(`${req.headers.get("origin")}/api/chat/createNewChat`,
                {
                    method: "POST",
                    headers: {
                        "content-type": "application/json",
                        cookie: req.headers.get("cookie"),
                    },
                    body: JSON.stringify({ message: message })
                });

            const json = await response.json();
            console.log("NewChat", json);
            chatId = json._id;
            newChatId = json._id;
            chatMessages = json.messages || [];

        }

        const messagesToInclude = [];
        chatMessages.reverse();
        let usedTokens = 0;
        for (let chatMessage of chatMessages) {
            const messageTokens = chatMessage.content.length / 4;
            usedTokens += messageTokens;
            if (usedTokens <= 2000) {
                messagesToInclude.push(chatMessage);
            } else {
                break;
            }
        }
        messagesToInclude.reverse();


        const stream = await OpenAIEdgeStream(
            'https://api.openai.com/v1/chat/completions',
            {
                headers: {
                    "content-type": "application/json",
                    Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
                },
                method: "POST",
                body: JSON.stringify({
                    model: "gpt-4o-mini",
                    messages: [initialChatMessage, ...messagesToInclude],
                    stream: true
                }),
            },
            {
                onBeforeStream: ({ emit }) => {
                    if (newChatId) {
                        emit(newChatId, "newChatId");
                    }
                },
                onAfterStream: async ({ fullContent }) => {
                    await fetch(
                        `${req.headers.get("origin")}/api/chat/addMessageToChat`,
                        {
                            method: "POST",
                            headers: {
                                "content-type": "application/json",
                                cookie: req.headers.get("cookie"),
                            },
                            body: JSON.stringify({
                                chatId,
                                role: "assistant",
                                content: fullContent,
                            })
                        });
                }
            }
        );
        return new Response(stream)
    } catch (e) {
        return new Response(
            {
                message: "An error occured in send message"
            },
            { status: 500 }
        )
    }
}
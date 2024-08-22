import Head from "next/head";
import { ChatSidebar } from "components/ChatSidebar";
import { useState } from "react";
import { OpenAIEdgeStream } from "openai-edge-stream";

import { streamReader } from "openai-edge-stream";

export default function ChatPage() {
    const [incomingMessage, setIncomingMesasge] = useState("");
    const [messageText, setMessageText] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();
        const response = await fetch(`/api/chat/sendMessage`, {
            method: "POST",
            headers: {
                "content-type": "application/json",
            },
            body: JSON.stringify({ message: messageText }),
        });




        const data = response.body;
        if (!data) {
            console.log("nooo")
            return;
        }
        const reader = data.getReader();

        await streamReader(reader, (message) => {
            console.log("Message: ", message);
            setIncomingMesasge(s => `${s}${message.content}`);
        })

    }
    return (
        <>
            <Head>
                <title>New Chat</title>
            </Head>
            <div className="grid h-screen grid-cols-[260px_1fr]">
                <ChatSidebar />
                <div className="bg-gray-700 flex flex-col">
                    <div className="flex-1 text-white">{incomingMessage}</div>
                    <div className="bg-gray-800 p-10">
                        <form onSubmit={handleSubmit}>
                            <fieldset className="flex gap-2">
                                <textarea
                                    value={messageText}
                                    onChange={e => setMessageText(e.target.value)}
                                    placeholder="Send a message"
                                    className="w-full resize-none rounded-md bg-gray-700 p-2 text-white focus:border-emerald-500 focus:bg-gray-600 focus:outline focus:outline-emerald-500"
                                />
                                <button className="btn" type="submit">Send</button>
                            </fieldset>
                        </form>
                    </div>
                </div>
            </div>
        </>
    );
}

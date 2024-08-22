import Head from "next/head";
import { ChatSidebar } from "components/ChatSidebar";
import { useState } from "react";

import { streamReader } from "openai-edge-stream";
import { v4 as uuid } from 'uuid'
import { Message } from "components/Message";

export default function ChatPage() {
    const [incomingMessage, setIncomingMesasge] = useState("");
    const [messageText, setMessageText] = useState("");
    const [newChatMessages, setNewChatMessages] = useState([]);
    const [generatingResponse, setGeneratingResponse] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setGeneratingResponse(true);

        setNewChatMessages(prev => {
            const newChatMessages = [...prev, {
                _id: uuid(),
                role: "user",
                content: messageText
            }];
            return newChatMessages
        });
        setMessageText("")

        const response = await fetch(`api/chat/createNewChat`, {
            method: "POST",
            headers: {
                "content-type": "application/json"
            },
            body: JSON.stringify({ message: messageText })
        });

        const json = await response.json();
        console.log("NewChat", json);

        // const response = await fetch(`/api/chat/sendMessage`, {
        //     method: "POST",
        //     headers: {
        //         "content-type": "application/json",
        //     },
        //     body: JSON.stringify({ message: messageText }),
        // });




        // const data = response.body;
        // if (!data) {
        //     console.log("nooo")
        //     return;
        // }
        // const reader = data.getReader();

        // await streamReader(reader, (message) => {
        //     console.log("Message: ", message);
        //     setIncomingMesasge(s => `${s}${message.content}`);
        // });

        setGeneratingResponse(false)

    };
    return (
        <>
            <Head>
                <title>New Chat</title>
            </Head>
            <div className="grid h-screen grid-cols-[260px_1fr]">
                <ChatSidebar />
                <div className="bg-gray-700 flex flex-col overflow-hidden">
                    <div className="flex-1 text-white overflow-scroll">
                        {newChatMessages.map(message => (
                            <Message
                                key={message._id}
                                role={message.role}
                                content={message.content}
                            />
                        ))}
                        {!!incomingMessage && (<Message
                            role="assistant"
                            content={incomingMessage}
                        />)}
                    </div>
                    <div className="bg-gray-800 p-10">
                        <form onSubmit={handleSubmit}>
                            <fieldset className="flex gap-2" disabled={generatingResponse}>
                                <textarea
                                    value={messageText}
                                    onChange={e => setMessageText(e.target.value)}
                                    placeholder={generatingResponse ? "" : "Send a message..."}
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

import Head from "next/head";
import { ChatSidebar } from "components/ChatSidebar";
import { useEffect, useState } from "react";

import { streamReader } from "openai-edge-stream";
import { v4 as uuid } from 'uuid'
import { Message } from "components/Message";
import { useRouter } from "next/router";
import { getSession } from "@auth0/nextjs-auth0";
import clientPromise from "lib/mongodb";
import { ObjectId } from "mongodb";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faRobot } from "@fortawesome/free-solid-svg-icons";

export default function ChatPage({ chatId, title, messages = [] }) {
    const [newChatId, setNewChatId] = useState(null);
    const [incomingMessage, setIncomingMesasge] = useState("");
    const [messageText, setMessageText] = useState("");
    const [newChatMessages, setNewChatMessages] = useState([]);
    const [generatingResponse, setGeneratingResponse] = useState(false);
    const [fullMessage, setFullMessage] = useState(false);
    const [originalChatId, setOriginalChatId] = useState(chatId);
    const router = useRouter();

    const routeHasChanged = chatId !== originalChatId;

    //When our route changes
    useEffect(() => {
        setNewChatMessages([]);
        setNewChatId(null);
    }, [chatId]);

    //save newly streamed mesages 
    useEffect(() => {
        if (!generatingResponse && fullMessage) {
            setNewChatMessages(prev => [
                ...prev,
                {
                    _id: uuid(),
                    role: "assistant",
                    content: fullMessage
                }])
            setFullMessage("");
        }
    }, [generatingResponse, fullMessage, routeHasChanged]);

    //if we have created a new chat
    useEffect(() => {
        if (!generatingResponse && newChatId) {
            setNewChatId(null);
            router.push(`/chat/${newChatId}`)
        }
    }, [newChatId, generatingResponse, router]);


    const handleSubmit = async (e) => {
        e.preventDefault();
        setGeneratingResponse(true);
        setOriginalChatId(chatId);
        setNewChatMessages(prev => {
            const newChatMessages = [...prev, {
                _id: uuid(),
                role: "user",
                content: messageText,
            }];
            return newChatMessages
        });
        setMessageText("")

        const response = await fetch(`/api/chat/sendMessage`, {
            method: "POST",
            headers: {
                "content-type": "application/json",
            },
            body: JSON.stringify({ chatId, message: messageText }),
        });




        const data = response.body;
        if (!data) {
            console.log("nooo")
            return;
        }
        const reader = data.getReader();
        let content = "";
        await streamReader(reader, (message) => {
            if (message.event === "newChatId") {
                setNewChatId(message.content);
            } else {
                setIncomingMesasge(s => `${s}${message.content}`);
                content += message.content;
            }
        });
        setFullMessage(content);

        setIncomingMesasge("");
        setGeneratingResponse(false);

    };

    const allchatMessages = [...messages, ...newChatMessages]

    return (
        <>
            <Head>
                <title>New Chat</title>
            </Head>
            <div className="grid h-screen grid-cols-[260px_1fr]">
                <ChatSidebar chatId={chatId} />
                <div className="bg-gray-700 flex flex-col overflow-hidden">
                    <div className="flex-1 flex flex-col-reverse text-white overflow-scroll">
                        {!allchatMessages.length && !incomingMessage &&
                            <div className="m-auto justify-center flex items-center text-center">
                                <div>
                                    <FontAwesomeIcon icon={faRobot} className="text-6xl text-emerald-200" />
                                    <h1 className="text-4xl font-bold text-white/50 mt-2">Ask a question</h1>
                                </div >
                            </div>
                        }
                        {!!allchatMessages.length && (
                            <div className="mb-auto">
                                {allchatMessages.map(message => (
                                    <Message
                                        key={message._id}
                                        role={message.role}
                                        content={message.content}
                                    />
                                ))}
                                {!!incomingMessage && !routeHasChanged && (
                                    <Message
                                        role="assistant"
                                        content={incomingMessage}
                                    />)}
                                {!!incomingMessage && !!routeHasChanged && (
                                    <Message
                                        role="notice"
                                        content="Only one message at a time, please allow the Machine to finish."
                                    />)}
                            </div>
                        )}
                    </div>
                    <footer className="bg-gray-800 p-10">
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
                    </footer>
                </div>
            </div >
        </>
    );
}


export const getServerSideProps = async (context) => {
    const chatId = context.params?.chatId?.[0] || null;
    if (chatId) {
        let objectId;

        try {
            objectId = new ObjectId(chatId);
        } catch (e) {
            return {
                redirect: {
                    destination: "/chat"
                },
            };
        };


        const { user } = await getSession(context.req, context.res);
        const client = await clientPromise;
        const db = client.db("Chatty");
        const chat = await db.collection("chats").findOne({
            userId: user.sub,
            _id: objectId
        });
        if (!chat) {
            return {
                redirect: {
                    destination: "/chat"
                },
            };
        }
        return {
            props: {
                chatId,
                title: chat.title,
                messages: chat.messages.map(message => ({
                    ...message,
                    _id: uuid(),
                }))
            },
        };

    }
    return {
        props: {},
    };

};
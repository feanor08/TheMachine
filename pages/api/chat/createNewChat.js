import clientPromise from "lib/mongodb";
import { getSession } from "@auth0/nextjs-auth0";


export default async function handler(req, res) {
    try {
        console.log("Im here");
        const { user } = await getSession(req, res);
        const { message } = req.body;

        //validate message data
        if (!message || typeof message !== "string" || message.length > 200) {
            res.status(422).json({
                message: "message and required and < 200 charecters"
            });
            return;
        }


        const newUserMessage = {
            role: "user",
            content: message,
        };
        const client = await clientPromise;
        const db = client.db("Chatty");
        const chat = await db.collection("chats").insertOne({
            userId: user.sub,
            messages: [newUserMessage],
            title: message
        });
        res.status(200).json({
            _id: chat.insertedId.toString(),
            messages: [newUserMessage],
            title: message
        })

    } catch (e) {
        res.status(500)
            .json({ message: " an error occured when creating a new chat " })
        console.log("ERROR IN NEW CHAT", e);
    }
}
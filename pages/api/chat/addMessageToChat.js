import { getSession } from "@auth0/nextjs-auth0"
import clientPromise from "lib/mongodb";
import { ObjectId } from "mongodb";

export default async function handler(req, res) {
    try {
        const { user } = await getSession(req, res);
        const client = await clientPromise;
        const db = client.db("Chatty");


        const { chatId, role, content } = req.body;

        let objectId;

        try {
            objectId = new ObjectId(chatId);
        } catch (e) {
            res.ststus(422).json({
                message: "Invalid Chat Id"
            })
            return;
        };

        //validate content data
        // if (!content || typeof content !== "string" || (role === "user" && content.length > 200)) {

        if (!content || typeof content !== "string") {
            res.status(422).json({
                message: "content  required and < 200 charecters"
            });
            return;
        }

        //validate role
        if (role !== "user" && role !== "assistant") {
            res.ststus(422).json({
                message: "Invalid Role"
            });
            return;
        }


        const chat = await db.collection("chats").findOneAndUpdate(
            {
                _id: objectId,
                userId: user.sub,
            },
            {
                $push: {
                    messages: {
                        role,
                        content
                    },
                },
            },
            {
                returnDocument: "after"
            }
        );
        res.status(200).json({
            chat: {
                ...chat.value,
                _id: chat.value._id.toString(),
            },
        });

    } catch (e) {
        res.status(500).json({ message: "An error occurred when adding a message", e })
    }
}
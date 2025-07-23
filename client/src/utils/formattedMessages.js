export const formattedMessages = async (messages, senderID) => {
    let responses = []
    messages.map((message) => {
        let sender = "other";

        if(message.sender_id === senderID){
            sender = "user"
        }

        responses.push({
            "text": message.content,
            "sender": sender})
    })

    return responses
}
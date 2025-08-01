import { TimeAgo } from "./timeAgo.js";

export const formattedNotifications = async (notifications) => {
    let responses = []
    notifications.map((notification) => {
        let title = "";
        let time = TimeAgo(notification.timestamp)

        if(notification.notification_type === "meetup"){
            title = "Meetup Reminder";
        }else if(notification.notification_type === "listing-approved"){
            title = "Listing Approved";
        }

        responses.push({
            "type": notification.notification_type,
            "title": title,
            "time": time,
            "message": notification.content
        })
    })

    return responses;
}
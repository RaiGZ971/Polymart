import { TimeAgo } from './timeAgo.js';

export const formattedNotification = ({
  userID,
  notificationType,
  content,
  relatedID,
}) => {
  const response = {
    user_id: userID,
    notification_type: notificationType,
    content: content,
    related_id: relatedID,
  };

  return response;
};

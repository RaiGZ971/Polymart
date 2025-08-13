export const formattedNotification = ({
  userID,
  notificationType,
  content,
  details = undefined,
  relatedID,
}) => {
  const response = {
    user_id: userID,
    notification_type: notificationType,
    content: content,
    details: details,
    related_id: relatedID,
  };

  return response;
};

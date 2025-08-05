import { TimeAgo } from './timeAgo';

export const formattedContacts = (contactUsersDetails, latestMessages) => {
  return contactUsersDetails.map((contactUserDetails, index) => ({
    id: contactUserDetails.user_id,
    username: contactUserDetails.username,
    sent: TimeAgo(latestMessages[index].sent),
    message: latestMessages[index].message,
    avatarUrl: contactUserDetails.profile_photo_url,
    isUnread: latestMessages[index].isUnread,
  }));
};

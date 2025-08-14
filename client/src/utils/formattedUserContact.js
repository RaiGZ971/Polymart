export const formattedUserContact = (contactUserDetails) => {
  return {
    id: contactUserDetails.user_id,
    username: contactUserDetails.username,
    avatarUrl: contactUserDetails.profile_photo_url,
  };
};

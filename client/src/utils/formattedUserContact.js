export const formattedUserContact = (contactUserDetails) => {
  console.log('NOT WORKING?', contactUserDetails);
  return {
    id: contactUserDetails.user_id,
    username: contactUserDetails.username,
    avatarUrl: contactUserDetails.profile_photo_url,
  };
};

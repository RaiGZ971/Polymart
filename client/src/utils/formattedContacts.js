import { TimeAgo } from './timeAgo';

export const formattedContacts = (
  contactUsersDetails,
  productsDetails,
  latestMessages
) => {
  return contactUsersDetails.map((contactUserDetails, index) => ({
    id: contactUserDetails.user_id,
    username: contactUserDetails.username,
    senderID: latestMessages[index].senderID,
    sent: TimeAgo(latestMessages[index].sent),
    message: latestMessages[index].message,
    avatarUrl: contactUserDetails.profile_photo_url,
    readStatus: latestMessages[index].readStatus,
    productID: productsDetails[index].listing_id,
    productImage: productsDetails[index].images[0].image_url,
    productName: productsDetails[index].name,
    productPrice:
      productsDetails[index].price_min !== productsDetails[index].price_max
        ? `PHP ${productsDetails[index].price_min} - PHP ${productsDetails[index].price_max}`
        : `PHP ${productsDetails[index].price_max}`,
  }));
};

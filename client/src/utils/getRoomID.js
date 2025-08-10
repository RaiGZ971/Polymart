export const getRoomID = (userID, sellerID) => {
  return [userID, sellerID].sort().join('');
};

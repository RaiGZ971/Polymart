export const getTime = (date) => {
  const response = new Date(date);

  const formattedTime = response.toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
  });

  return formattedTime;
};

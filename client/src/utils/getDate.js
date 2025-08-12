export const getDate = (date) => {
  const response = new Date(date);

  const formattedDate = response.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return formattedDate;
};

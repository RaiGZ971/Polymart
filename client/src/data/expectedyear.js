const currentYear = new Date().getFullYear();

export const expectedYearOptions = Array.from({ length: 11 }, (_, i) => {
  const year = currentYear + i;
  return {
    value: year.toString(),
    label: year.toString()
  };
});

export default expectedYearOptions;
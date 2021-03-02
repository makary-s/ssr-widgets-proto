export const resolveRandomNumber = () =>
  new Promise((resolve) =>
    setTimeout(() => resolve(Math.round(Math.random() * 100)), 3000)
  );

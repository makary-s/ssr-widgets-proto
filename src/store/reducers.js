export const smth = (
  state = {
    value: 0
  },
  action
) => {
  switch (action.type) {
    case "INCREMENT":
      return { ...state, value: state.value + 1 };
    case "DECREASE":
      return { ...state, value: state.value - 1 };
    default:
      return state;
  }
};

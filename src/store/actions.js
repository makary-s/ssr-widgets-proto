const INCREMENT = "INCREMENT";
const DECREASE = "DECREASE";

export function incrementAction() {
  return {
    type: INCREMENT
  };
}
export function decreaseAction() {
  return {
    type: DECREASE
  };
}

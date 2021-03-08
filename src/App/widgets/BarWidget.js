import React from "react";
import WidgetHelper, { useAction } from "../../widgetHelper";
import { resolveRandomNumber } from "../../resolvers";
import Placeholder from "./Placeholder";

/////////////////////////////////////////////////

const subAction = () => ({
  type: "SUB"
});

/////////////////////////////////////////////////

const reducers = {
  num: (state = 1, { type }) => {
    switch (type) {
      case "SUB": {
        return --state;
      }
      default: {
        return state;
      }
    }
  }
};

/////////////////////////////////////////////////

const getInitialState = (props) => ({ num: resolveRandomNumber() });

/////////////////////////////////////////////////

const Bar = ({ num, name }) => {
  const sub = useAction(subAction);

  return (
    <button
      onClick={sub}
      style={{ background: "lightGrey" }}
    >{`${name}-${num}`}</button>
  );
};

const BarWidget = WidgetHelper.create({
  Component: Bar,
  Placeholder: ({ name }) => <Placeholder name={name} />,
  getInitialState,
  reducers
});

export default BarWidget;

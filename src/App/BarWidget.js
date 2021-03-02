import React from "react";
import WidgetHelper, { useAction } from "../widgetHelper";

/////////////////////////////////////////////////

const resolveRandomNumber = () =>
  new Promise((resolve) =>
    setTimeout(() => resolve(Math.round(Math.random() * 100)), 1000)
  );

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
  const sub = useAction(BarWidget, subAction);

  return <button onClick={sub}>{`${name}-${num}`}</button>;
};

const BarWidget = WidgetHelper.create({
  Component: Bar,
  getInitialState,
  reducers
});

export default BarWidget;

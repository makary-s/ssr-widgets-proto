import React from "react";
import WidgetHelper, { useAction } from "../../widgetHelper";
import { resolveRandomNumber } from "../../resolvers";

/////////////////////////////////////////////////

const addAction = () => ({
  type: "ADD"
});

/////////////////////////////////////////////////

const reducers = {
  num: (state = 1, { type }) => {
    switch (type) {
      case "ADD": {
        return ++state;
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

const Unused = ({ num, name }) => {
  const add = useAction(addAction);

  return <button onClick={add}>{`${name}-${num}`}</button>;
};

const UnusedWidget = WidgetHelper.create({
  Component: Unused,
  getInitialState,
  reducers
});

export default UnusedWidget;

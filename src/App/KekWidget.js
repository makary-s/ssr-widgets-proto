import React from "react";
import WidgetHelper, { useAction } from "../widgetHelper";
import { resolveRandomNumber } from "../resolvers";

import Placeholder from "./Placeholder";

/////////////////////////////////////////////////

const addAction = () => ({
  type: "ADD"
});

/////////////////////////////////////////////////

const reducers = {
  num: (state = -100, { type }) => {
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

const Kek = ({ num, name }) => {
  const add = useAction(addAction);

  return (
    <button
      onClick={add}
      style={{ background: "wheat" }}
    >{`${name}-${num}`}</button>
  );
};

const KekWidget = WidgetHelper.create({
  Component: Kek,
  Placeholder: ({ name }) => <Placeholder name={name} />,
  getInitialState,
  reducers
});

export default KekWidget;

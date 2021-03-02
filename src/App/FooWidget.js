import React from "react";
import WidgetHelper, { useAction } from "../widgetHelper";

/////////////////////////////////////////////////

const resolveRandomNumber = () =>
  new Promise((resolve) =>
    setTimeout(() => resolve(Math.round(Math.random() * 100)), 1000)
  );

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

const Foo = ({ num, name }) => {
  const add = useAction(FooWidget, addAction);

  return <button onClick={add}>{`${name}-${num}`}</button>;
};

const FooWidget = WidgetHelper.create({
  Component: Foo,
  getInitialState,
  reducers
});

export default FooWidget;

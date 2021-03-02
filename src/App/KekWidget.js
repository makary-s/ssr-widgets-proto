import React, { useState, useEffect } from "react";
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
  const add = useAction(KekWidget, addAction);

  return (
    <button
      onClick={add}
      style={{ background: "wheat" }}
    >{`${name}-${num}`}</button>
  );
};

const KekPlaceholder = ({ name }) => <span>{`Loading ${name}...`}</span>;

const KekWidget = WidgetHelper.create({
  Component: Kek,
  Placeholder: KekPlaceholder,
  getInitialState,
  reducers
});

export default KekWidget;

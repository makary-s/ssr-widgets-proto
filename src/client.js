console.log(11111);

import React from "react";
import { render, hydrate } from "react-dom";

import App from "./App";
import { getStore, runEpics } from "./store";
import WidgetHelper from "./widgetHelper";

const initialState = window.__INITIAL_STATE__;

const store = getStore(initialState);

WidgetHelper.prepareClient(store);
runEpics();

if (WidgetHelper.wsModeComponent) {
  render(WidgetHelper.wsModeComponent, document.getElementById("root"));
} else {
  hydrate(
    <App store={store} isClient={true} />,
    document.getElementById("root")
  );
}

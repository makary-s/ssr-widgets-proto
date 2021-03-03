import React from "react";
import { render, hydrate } from "react-dom";

import App from "./App";
import createStore from "./store";
import WidgetHelper from "./widgetHelper";

const initialState = window.__INITIAL_STATE__;

const store = createStore(initialState);

WidgetHelper.prepareClient(store);

if (WidgetHelper.wsModeCom) {
  render(WidgetHelper.wsModeCom, document.getElementById("root"));
} else {
  hydrate(
    <App store={store} isClient={true} />,
    document.getElementById("root")
  );
}

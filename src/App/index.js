import React from "react";
import { Provider } from "react-redux";

import AppBase from "./App";
import { getStore, runEpics } from "../store";
import { renderApp } from "../widgetHelper";

const App = ({ store, isClient }) => (
  <Provider store={store}>
    <AppBase />
  </Provider>
);

export default renderApp({
  App,
  getStore,
  rootSelector: "#root",
  after: () => {
    runEpics();
  }
});

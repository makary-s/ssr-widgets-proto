import React from "react";
import { hydrate } from "react-dom";

import App from "./App";
import createStore from "./store";

const initialState = window.__INITIAL_STATE__;

const store = createStore(initialState);

hydrate(<App store={store} isClient={true} />, document.getElementById("root"));

import React from "react";
import { Provider } from "react-redux";

import AppBase from "./App";

const App = ({ store, isClient }) => (
  <Provider store={store}>
    <AppBase />
  </Provider>
);

export default App;

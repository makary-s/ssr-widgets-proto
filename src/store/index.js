import { createStore, combineReducers } from "redux";
import * as reducers from "./reducers";
import WidgetHelper from "../widgetHelper";
import { composeWithDevTools } from "redux-devtools-extension";

export default (intitialState) =>
  createStore(
    combineReducers({ ...reducers, ...WidgetHelper.getReducers() }),
    intitialState,
    composeWithDevTools()
  );

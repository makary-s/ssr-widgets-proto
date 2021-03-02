import { createStore, combineReducers } from "redux";
import * as reducers from "./reducers";
import WidgetHelper from "../widgetHelper";

export default (intitialState) =>
  createStore(
    combineReducers({ ...reducers, ...WidgetHelper.getReducers() }),
    intitialState
  );

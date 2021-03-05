import { createStore, combineReducers, applyMiddleware } from "redux";
import * as reducers from "./reducers";
import WidgetHelper from "../widgetHelper";
import { composeWithDevTools } from "redux-devtools-extension";
import { createEpicMiddleware } from "redux-observable";
import { combineEpics } from "redux-observable";

const rootReducer = combineReducers({
  ...reducers,
  ...WidgetHelper.getReducers()
});

const epicMiddleware = createEpicMiddleware();

export const runEpics = () =>
  epicMiddleware.run(combineEpics(WidgetHelper.getEpic()));

export const getStore = (intitialState) =>
  createStore(
    rootReducer,
    intitialState,
    composeWithDevTools(applyMiddleware(epicMiddleware))
  );

import React from "react";
import WidgetHelper, { useAction } from "../widgetHelper";
import { resolveRandomNumber } from "../resolvers";
import { ofType } from "redux-observable";
import { tap, mapTo, ignoreElements } from "rxjs/operators";
import { of } from "rxjs";

import Placeholder from "./Placeholder";

/////////////////////////////////////////////////

const CLICK = "CLICK";
const NEW_VALUE = "NEW_VALUE";

const addAction = () => ({
  type: CLICK
});

const newValueAction = (payload) => ({
  type: NEW_VALUE,
  payload
});

/////////////////////////////////////////////////

const reducers = {
  num: (state = -100, { type, payload }) => {
    switch (type) {
      case NEW_VALUE: {
        return payload.value;
      }
      default: {
        return state;
      }
    }
  }
};

/////////////////////////////////////////////////

const clickEpic = (action$) =>
  action$.pipe(
    ofType(CLICK),
    tap(({ meta: { id } }) => console.log(`Foo's clickEpic; id: ${id}`)),
    mapTo(newValueAction({ value: Math.round(Math.random() * 100) }))
  );

const newValueEpic = (action$) =>
  action$.pipe(
    ofType(NEW_VALUE),
    tap(({ meta: { id } }) => console.log(`Foo's newValueEpic; id: ${id}`)),
    ignoreElements()
  );

const epics = [clickEpic, newValueEpic];

/////////////////////////////////////////////////

const getInitialState = (props) => ({ num: resolveRandomNumber() });

/////////////////////////////////////////////////

const Kek = ({ num, name }) => {
  const add = useAction(addAction);

  return (
    <button
      onClick={add}
      style={{ background: "wheat" }}
    >{`${name}-${num}`}</button>
  );
};

const KekWidget = WidgetHelper.create({
  Component: Kek,
  Placeholder: ({ name }) => <Placeholder name={name} />,
  getInitialState,
  reducers,
  epics
});

export default KekWidget;

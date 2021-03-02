import React, { useCallback, useMemo } from "react";
import { useSelector, useDispatch } from "react-redux";
import { combineReducers } from "redux";
import { renderToString } from "react-dom/server";

const getCompName = (comp) => comp.name || comp.displayName;

// TODO
let idCount = 0;
const createId = () => ++idCount;

const Placeholder = ({ id }) => (
  <div id={id} data-widget>
    {id}
  </div>
);

const checkIsClient = () => {
  try {
    // eslint-disable-next-line
    window;
    return true;
  } catch {
    return false;
  }
};

const resolveObj = (obj) => {
  const result = {};
  const promises = [];

  promises.push(
    ...Object.entries(obj).map(async ([key, val]) => {
      result[key] = await val;
    })
  );

  return Promise.all(promises).then(() => result);
};

class WidgetHelper {
  constructor() {
    this.reducers = {};
    this.initialState = {};
    this.components = {};
    this.inited = new Set();
    this.isClient = checkIsClient();
  }

  getReducers() {
    return {
      _widgets: (state = {}, action) => {
        const { id } = action.meta || {};

        if (action.type === "_UPDATE") {
          const newState = {
            ...state,
            [id]: action.payload
          };

          return newState;
        }

        const widgetReducers = this.reducers[id];
        if (!widgetReducers) return state;

        const widgetState = state[id];
        const newWidgetState = widgetReducers(widgetState, action);

        return newWidgetState === widgetState
          ? state
          : {
              ...state,
              [id]: newWidgetState
            };
      }
    };
  }

  getId({
    Component,
    currentProps,
    getInitialState,
    reducers,
    state,
    dispatch
  }) {
    const id = `${getCompName(Component)}-${createId()}`;
    this.reducers[id] = combineReducers(reducers);

    console.log("!!!!", state);
    if (!this.isClient) {
      this.initialState[id] = getInitialState(currentProps);
      this.components[id] = { Component, currentProps };
    } else if (!(state && state._widgets && state._widgets[id])) {
      resolveObj(getInitialState(currentProps)).then((res) => {
        dispatch({
          type: "_UPDATE",
          payload: res,
          meta: { id }
        });
      });
    }

    return id;
  }

  // TODO сделать рекурсивной
  async getState() {
    const result = {};
    const promises = [];

    for (const [id, initialState] of Object.entries(this.initialState)) {
      promises.push(
        ...Object.entries(initialState).map(async ([key, val]) => {
          if (!result[id]) result[id] = {};

          result[id][key] = await val;
        })
      );
    }

    await Promise.all(promises);

    return result;
  }

  async prepareRenderData(app, state) {
    const html = renderToString(app);

    const initialState = {
      ...state,
      // порядок важен
      _widgets: await this.getState()
    };

    const finalHtml = html.replace(
      /<div id="[^"]*" data-widget="true">[^<>]*<\/div>/g,
      (sel) => {
        const id = sel.match(/id="([^"]*)"/)[1];

        const { Component, currentProps } = this.components[id];
        const widgetState =
          (initialState._widgets && initialState._widgets[id]) || {};

        return renderToString(
          <Component {...{ ...widgetState, ...currentProps }} />
        );
      }
    );

    // Очищаем чтобы не накапливалось
    idCount = 0;
    this.initialState = {};
    this.components = {};
    this.reducers = {};

    return { html: finalHtml, initialState };
  }

  create({ Component, getInitialState = () => ({}), reducers }) {
    const Widget = (props) => {
      const state = useSelector((state) => state);
      const dispatch = useDispatch();

      const id = useMemo(() => {
        const _id = this.getId({
          Component,
          currentProps: props,
          getInitialState,
          reducers,
          dispatch,
          state
        });

        Widget.getInfo = () => ({ id: _id, isClient: this.isClient });

        return _id;
      }, []);

      const widgetState = state && state._widgets && state._widgets[id];

      return this.isClient
        ? Component({ ...widgetState, ...props })
        : Placeholder({ id, ...props });
    };

    Widget.displayName = getCompName(Component);

    return Widget;
  }
}

export default new WidgetHelper();

export const useAction = (Widget, actionCreator, deps = []) => {
  const { id, isClient } = Widget.getInfo();

  if (!isClient) return;

  // eslint-disable-next-line react-hooks/rules-of-hooks
  const dispatch = useDispatch();
  const callback = (...args) => {
    // TODO мета уже может быть задана
    const result = { ...actionCreator(...args), meta: { id } };
    if (!result) return;

    dispatch(result);
  };

  // eslint-disable-next-line react-hooks/rules-of-hooks
  return useCallback(callback, [dispatch, ...deps]);
};

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

class WidgetHelper {
  constructor() {
    this.reducers = {};
    this.initialState = {};
    this.components = {};
    this.isClient = checkIsClient();
  }

  getReducers() {
    return {
      _widgets: (state = {}, action) => {
        const { meta: id } = action;

        console.log(state, action, this.reducers);

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

  getId({ Component, currentProps, getInitialState, reducers }) {
    const id = `${getCompName(Component)}-${createId()}`;
    this.reducers[id] = combineReducers(reducers);

    if (!this.isClient) {
      this.initialState[id] = getInitialState(currentProps);
      this.components[id] = { Component, currentProps };
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
    console.log(html);

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

    console.log(finalHtml);

    // Очищаем чтобы не накапливалось
    idCount = 0;
    this.initialState = {};
    this.components = {};
    this.reducers = {};

    return { html: finalHtml, initialState };
  }

  create({ Component, getInitialState = () => ({}), reducers }) {
    const Widget = (props) => {
      const id = useMemo(() => {
        const _id = this.getId({
          Component,
          currentProps: props,
          getInitialState,
          reducers
        });

        console.log(_id, "??");

        Widget.getInfo = () => ({ id: _id, isClient: this.isClient });

        return _id;
      }, []);

      const widgetState = useSelector(
        (state) => state && state._widgets && state._widgets[id]
      );

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
    const result = { ...actionCreator(...args), meta: id };
    if (!result) return;

    dispatch(result);
  };

  // eslint-disable-next-line react-hooks/rules-of-hooks
  return useCallback(callback, [dispatch, ...deps]);
};

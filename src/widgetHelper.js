import React, { useCallback, useMemo } from "react";
import { useSelector, useDispatch } from "react-redux";
import { combineReducers } from "redux";
import { renderToString } from "react-dom/server";

const getCompName = (comp) => comp.name || comp.displayName;

// TODO
let idCount = 0;
const createId = () => ++idCount;

const SsrPlaceholder = ({ id }) => (
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

const getWidgetState = (state, id) =>
  state && state._widgets && state._widgets[id];

const renderComp = ({ Component, Placeholder, state, props, id }) => {
  const widgetState = getWidgetState(state, id);
  const result = Component({ ...(widgetState || {}), ...props });

  if (!widgetState && Placeholder) return Placeholder(props);
  return result;
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

    // надо поедлить по запросам чтобы не пересекалось
    this.widetsStateClientPromises = {};
    this.waitPath = "/init_widgets";
    this.serverWaiter = this.serverWaiter.bind(this);
  }

  getReducers() {
    return {
      _widgets: (state = {}, action) => {
        const { id } = action.meta || {};

        if (action.type === "_INIT_WIDGET") {
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

  // TODO нейминг; костыльно
  getId({
    Component,
    Placeholder,
    currentProps,
    getInitialState,
    reducers,
    state,
    dispatch
  }) {
    const id = `${getCompName(Component)}-${createId()}`;
    this.reducers[id] = combineReducers(reducers);

    if (!this.isClient) {
      this.initialState[id] = getInitialState(currentProps);
      this.components[id] = { Component, currentProps, Placeholder };
    } else {
      const widgetState = getWidgetState(state, id);
      // TODO вмесо null статус; null - значит ждем ответ с сервера
      if (!widgetState && widgetState !== null) {
        resolveObj(getInitialState(currentProps)).then((res) => {
          dispatch({
            type: "_INIT_WIDGET",
            payload: res,
            meta: { id }
          });
        });
      }
    }

    return id;
  }

  // TODO сделать рекурсивной
  async getState() {
    const result = {};
    const clientPromises = [];
    const blockingPromises = [];

    for (const [id, initialState] of Object.entries(this.initialState)) {
      // TODO детектим блокирующие компоненты

      if (this.components[id].currentProps.$isBlocking) {
        blockingPromises.push(
          ...Object.entries(initialState).map(async ([key, val]) => {
            if (!result[id]) result[id] = {};

            result[id][key] = await val;
          })
        );
      } else {
        // TODO нужно чтобы компонент дождался ответа с сервера после рендера; придумать нормальный статус
        result[id] = null;

        clientPromises.push({ id, initialState });
      }
    }

    await Promise.all(blockingPromises);

    return { widgetsState: result, widetsStateClientPromises: clientPromises };
  }

  async prepareRenderData(app, state) {
    const html = renderToString(app);

    const { widgetsState, widetsStateClientPromises } = await this.getState();

    const initialState = {
      ...state,
      // порядок важен
      _widgets: widgetsState
    };

    const finalHtml = html.replace(
      /<div id="[^"]*" data-widget="true">[^<>]*<\/div>/g,
      (sel) => {
        const id = sel.match(/id="([^"]*)"/)[1];

        const { Component, Placeholder, currentProps } = this.components[id];

        return renderToString(
          renderComp({
            Component,
            Placeholder,
            id,
            state: initialState,
            props: currentProps
          })
        );
      }
    );

    // Очищаем чтобы не накапливалось
    idCount = 0;
    this.initialState = {};
    this.components = {};
    this.reducers = {};

    // TODO разделить на запросы
    this.widetsStateClientPromises = widetsStateClientPromises;

    return { html: finalHtml, initialState };
  }

  create({ Component, Placeholder, getInitialState = () => ({}), reducers }) {
    const Widget = (props) => {
      const state = useSelector((state) => state);
      const dispatch = useDispatch();

      const id = useMemo(() => {
        const _id = this.getId({
          Component,
          Placeholder,
          currentProps: props,
          getInitialState,
          reducers,
          dispatch,
          state
        });

        Widget.getInfo = () => ({ id: _id, isClient: this.isClient });

        return _id;
      }, []);

      if (this.isClient) {
        return renderComp({ Component, Placeholder, state, props, id });
      }

      return SsrPlaceholder({ id, ...props });
    };

    Widget.displayName = getCompName(Component);

    return Widget;
  }

  waitForStates(store) {
    const source = new EventSource(this.waitPath);
    let closed = false;
    source.onmessage = (e) => {
      if (e.data === "CLOSE") {
        closed = true;
        source.close();
      }
      // TODO<4234f> почему-то не закрывается
      if (closed) return;

      const { id, state } = JSON.parse(e.data);
      store.dispatch({ type: "_INIT_WIDGET", payload: state, meta: { id } });
    };
  }

  async serverWaiter(req, res) {
    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive"
    });

    await Promise.all(
      this.widetsStateClientPromises.map(async ({ id, initialState }) => {
        const result = {};
        await Promise.all(
          Object.entries(initialState).map(async ([key, val]) => {
            result[key] = await val;
          })
        ).then(() => {
          res.write(`data: ${JSON.stringify({ id, state: result })}\n\n`);
        });
      })
    );

    res.write(`data: CLOSE\n\n`);

    res.end();
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

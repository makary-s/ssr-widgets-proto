import React, { useCallback, useMemo, useRef } from "react";
import { useSelector, useDispatch, Provider } from "react-redux";
import { combineReducers } from "redux";
import { renderToString } from "react-dom/server";
import { combineEpics } from "redux-observable";
import { map, mergeMap } from "rxjs/operators";
import { of, EMPTY } from "rxjs";

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

const renderComp = ({ Component, Placeholder, state, props, id, ref }) => {
  const widgetState = getWidgetState(state, id);
  // рендерим в любом случае, хак для хуков
  let result = Component({ ...(widgetState || {}), ...props, ref });

  if (!widgetState && Placeholder) result = Placeholder(props);

  if (checkIsClient() && window.location.search.match(/\Wsw(\W|$)/)) {
    return (
      <div
        style={{ display: "inline-block", position: "relative" }}
        data-id={id}
      >
        <a
          style={{
            position: "absolute",
            display: "inline-block",
            top: 0,
            left: 0,
            fontSize: "12px",
            background: "red",
            padding: "2px"
          }}
          href={`/widget?name=${getCompName(Component)}&props=${JSON.stringify(
            props
          )}`}
        >
          +{getCompName(Component)}
        </a>
        {result}
      </div>
    );
  }

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
    this.epics = {};

    this.initialState = {};
    this.components = {};
    this.inited = new Set();
    this.isClient = checkIsClient();

    // надо поедлить по запросам чтобы не пересекалось
    this.widetsStateClientPromises = {};
    this.waitPath = "/init_widgets";
    this.wsModePath = "/widget";
    this.serverWaiter = this.serverWaiter.bind(this);

    this.temp = {};
    this.witgets = {};
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

  getEpic() {
    const epic = (action$, state$) =>
      action$.pipe(
        mergeMap((action, state) => {
          const id = action.meta && action.meta.id;
          if (!id) return EMPTY;

          const { name: widgetName } = this.components[id] || {};
          const widgetEpic = this.epics[widgetName];
          if (!widgetEpic) return EMPTY;

          return widgetEpic(of(action), state$).pipe(
            map((x) =>
              x && x.type && !(x.meta && x.meta.id)
                ? { ...x, meta: { ...x.meta, id } }
                : x
            )
          );
        })
      );

    return epic;
  }

  // TODO нейминг; костыльно
  getId({
    name,
    Component,
    Placeholder,
    currentProps,
    getInitialState,
    reducers,
    epics,
    state,
    dispatch
  }) {
    const id = `${name}-${createId()}`;

    this.components[id] = {
      name,
      Component,
      currentProps,
      Placeholder
    };

    if (reducers) this.reducers[id] = combineReducers(reducers);

    if (!this.isClient) {
      this.initialState[id] = getInitialState(currentProps);
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

  create({
    Component,
    Placeholder,
    getInitialState = () => ({}),
    reducers,
    epics
  }) {
    const name = getCompName(Component);

    if (epics) this.epics[name] = combineEpics(...epics);

    const Widget = (props) => {
      const state = useSelector((state) => state);
      const dispatch = useDispatch();
      const ref = useRef();

      const id = useMemo(() => {
        const _id = this.getId({
          name,
          Component,
          Placeholder,
          currentProps: props,
          getInitialState,
          reducers,
          epics,
          dispatch,
          state
        });

        widgetHelper.temp.getId = () => _id;

        return _id;
      }, []);

      if (this.isClient) {
        return renderComp({ Component, Placeholder, state, props, id, ref });
      }

      return SsrPlaceholder({ id, ...props });
    };

    Widget.displayName = name;
    this.witgets[name] = Widget;

    return Widget;
  }

  prepareClient(store) {
    this.wsModeCom = null;
    if (window.location.pathname === this.wsModePath) {
      const qparams = new URLSearchParams(window.location.search);

      let props = {};
      try {
        props = JSON.parse(qparams.get("props"));
        if (!props || typeof props !== "object") props = {};
      } catch {}

      const Comp = this.witgets[qparams.get("name")];

      if (Comp)
        this.wsModeCom = (
          <Provider store={store}>
            <Comp {...props} />
          </Provider>
        );
    }

    /////
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

const widgetHelper = new WidgetHelper();

export default widgetHelper;

export const useWidgetId = () => {
  if (!widgetHelper.isClient) return;

  // eslint-disable-next-line react-hooks/rules-of-hooks
  return useMemo(() => widgetHelper.temp.getId(), []);
};

export const useAction = (actionCreator, deps = []) => {
  // TODO опасненько
  const id = widgetHelper.temp.getId();

  if (!widgetHelper.isClient) return;

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

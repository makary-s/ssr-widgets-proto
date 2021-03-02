import React from "react";
import { join } from "path";
import express from "express";
import renderTemplate from "./renderTemplate";
import App from "./App";
import createStore from "./store";
import WidgetHelper from "./widgetHelper";

const server = express();

server.use("/assets", express.static(join(__dirname, "assets")));

server.get("/", async (req, res) => {
  const store = createStore({});

  const { html, initialState } = await WidgetHelper.prepareRenderData(
    <App store={store} isClient={false} />,
    store.getState()
  );

  // eslint-disable-next-line no-console
  console.log("Server initial state:\n", initialState);
  res.send(
    renderTemplate({
      html,
      initialState
    })
  );
});

server.get(WidgetHelper.waitPath, WidgetHelper.serverWaiter);

server.listen(8080, () => {
  // eslint-disable-next-line no-console
  console.log("Listening on: http://localhost:8080");
});

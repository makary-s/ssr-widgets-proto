import React from "react";
import { join } from "path";
import express from "express";
import fs from "fs";
import renderTemplate from "./renderTemplate";
import App from "./App";
import { getStore } from "./store";
import WidgetHelper from "./widgetHelper";

const server = express();

const entrypoints = JSON.parse(
  fs.readFileSync(join(__dirname, "assets/entrypoints.json"))
);

server.use("/assets", express.static(join(__dirname, "assets")));

server.get("/", async (req, res) => {
  const store = getStore({});

  const { html, initialState } = await WidgetHelper.prepareRenderData(
    // TODO isClient не нужен
    <App store={store} isClient={false} />,
    store.getState()
  );

  // eslint-disable-next-line no-console
  console.log("Server initial state:\n", initialState);
  console.log(
    "Page widgets: ",
    entrypoints.client.js
      .map((x) => (x.match(/widget-(.*?)\.js/) || [])[1])
      .filter(Boolean)
  );

  res.send(
    renderTemplate({
      html,
      initialState,
      entrypoints: entrypoints.client
    })
  );
});

server.get(WidgetHelper.wsModePath, async (req, res) => {
  res.send(
    renderTemplate({
      entrypoints: entrypoints.client
    })
  );
});

// вернет начальные стейты неблокирующих отрендеренных виджетов
server.get(WidgetHelper.waitPath, WidgetHelper.serverWaiter);

server.listen(8080, () => {
  // eslint-disable-next-line no-console
  console.log("Listening on: http://localhost:8080");
});

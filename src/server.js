import { join } from "path";
import express from "express";
import renderTemplate from "./renderTemplate";
import WidgetHelper from "./widgetHelper/server";

const server = express();

server.use("/assets", express.static(join(__dirname, "assets")));

server.get("/", async (req, res) => {
  const { html, initialState } = await WidgetHelper.prepareApp(
    "assets/client.bundle.js"
  );

  console.log("Server initial state:\n", initialState);

  res.send(
    renderTemplate({
      html,
      initialState
    })
  );
});

server.get(WidgetHelper.wsModePath, async (req, res) => {
  res.send(renderTemplate());
});

// вернет начальные стейты неблокирующих отрендеренных виджетов
server.get(WidgetHelper.waitPath, WidgetHelper.serverWaiter);

server.listen(8080, () => {
  console.log("Listening on: http://localhost:8080");
});

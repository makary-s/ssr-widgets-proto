import fs from "fs";
import { join } from "path";
import { wsModePath, waitPath, serverWaiter } from "./shared";

class WidgetHelper {
  constructor() {
    this.widetsStateClientPromises = [];
    this.wsModePath = wsModePath;
    this.waitPath = waitPath;

    this.prepareAppMap = {};
    this.serverWaiter = serverWaiter.bind(this);
  }

  async prepareApp(bundlePath) {
    if (!this.prepareAppMap[bundlePath]) {
      const code = fs.readFileSync(join(__dirname, bundlePath), {
        encoding: "utf8",
        flag: "r"
      });

      // eslint-disable-next-line no-eval
      this.prepareAppMap[bundlePath] = () => eval(code).default();
    }

    const { html, initialState, promises } = await this.prepareAppMap[
      bundlePath
    ]();
    this.widetsStateClientPromises = promises;

    return { html, initialState };
  }
}

export default new WidgetHelper();

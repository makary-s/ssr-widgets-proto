import React from "react";
import FooWidget from "./FooWidget";
import BarWidget from "./BarWidget";
import KekWidget from "./KekWidget";

const AppBase = () => (
  <>
    <div>Hello!</div>
    <FooWidget name="world1" />
    <FooWidget name="world2" />
    <BarWidget name="world3" />
    {false ? <BarWidget name="world4" /> : null}
    {false ? <KekWidget name="world5" /> : null}
  </>
);

export default AppBase;

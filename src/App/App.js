import React, { useEffect, useState } from "react";
import FooWidget from "./FooWidget";
import BarWidget from "./BarWidget";
import KekWidget from "./KekWidget";

const AppBase = () => {
  const [Comp, setComp] = useState(null);
  useEffect(() => {
    setTimeout(() => {
      setComp([<BarWidget name="world6" />, <KekWidget name="world7" />]);
    }, 2000);
  });

  return (
    <>
      <div>Hello!</div>
      <FooWidget name="world1" />
      <FooWidget name="world2" />
      <BarWidget name="world3" />
      {false ? <BarWidget name="world4" /> : null}
      {false ? <KekWidget name="world5" /> : null}
      {Comp}
    </>
  );
};

export default AppBase;
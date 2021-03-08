import React, { useEffect, useState } from "react";
import FooWidget from "./widgets/FooWidget";
import BarWidget from "./widgets/BarWidget";
import KekWidget from "./widgets/KekWidget";
// import UnusedWidget from "./widgets/UnusedWidget";

const AppBase = () => {
  const [Comps, setComp] = useState(null);
  useEffect(() => {
    setComp([
      <BarWidget name="bar-b" key="6" />,
      <KekWidget name="kek-a" key="7" />,
      <KekWidget name="kek-b" key="8" />
    ]);
  }, []);

  return (
    <>
      <div>Hello!</div>
      {/* isBlocking - сервер не вернет рендер 
      пока не будет срезолвен стейт этого компонента */}
      <FooWidget name="foo-a" $isBlocking />
      {/* нет isBlocking - результат уже резолвится на сервере, 
      но это не тормозит загрузку страницы. Стейт пришлется как только будет готов */}
      {/* FooWidget не исеет плейхолдера - до загрузки стейта он будет отрендерен с пустым стейтом */}
      <FooWidget name="foo-b" />
      <BarWidget name="bar-a" />
      {/* Компоненты Comp отрендарятся в useEffect */}
      {/* нет isBlocking и не было отрендерено на сервере - 
      резульат срезолвится на клиенте */}
      {Comps}
      {false ? <BarWidget name="bar-c" /> : null}
      {false ? <KekWidget name="kek-c" /> : null}
    </>
  );
};

export default AppBase;

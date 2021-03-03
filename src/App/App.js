import React, { useEffect, useState } from "react";
import FooWidget from "./FooWidget";
import BarWidget from "./BarWidget";
import KekWidget from "./KekWidget";

const AppBase = () => {
  console.log(111);
  const [Comps, setComp] = useState(null);
  useEffect(() => {
    setTimeout(() => {
      setComp([
        <BarWidget name="bar-b" key="6" />,
        <KekWidget name="kek-b" key="7" />
      ]);
    }, 0);
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
      {false ? <BarWidget name="bar-c" /> : null}
      {false ? <KekWidget name="kek-a" /> : null}
      {/* Компоненты Comp отрендарятся через пару секунд в useEffect */}
      {/* нет isBlocking и не было отрендерено на сервере - 
      резульат срезолвится на клиенте */}
      {Comps}
    </>
  );
};

export default AppBase;

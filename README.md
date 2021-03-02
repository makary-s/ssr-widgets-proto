# Использование

```js

const Foo = (propsAndState) => ...
const FooPlaceholder = (props) => ...

const FooWidget = WidgetHelper.create({
  // Компонент; получает пропсы + стейт
  Component: Foo,
  // То что отрендерится, если нет стейта. Если не указано, то будет рендериться Component только с пропсами
  Placeholder: FooPlaceholder,
  // Функция возвращающая начальный стей (на клиента или сервере)
  getInitialState,
  // редьюсеры
  reducers
});
```

```js
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
```

# Настройка

На сервере:

```js
server.get("/", async (req, res) => {
  ...
  // получаем финальные html и стейт
    <App store={store} isClient={false} />,
    store.getState()
  );
```

```js
// Server-Sent Events которые вернут начальные стейты неблокирующих отрендеренных виджетов
server.get(WidgetHelper.waitPath, WidgetHelper.serverWaiter);
```

На клиенте:

```js
// наблюдаем за Server-Sent Events, которые обновят неблокирущие отрендеренные виджеты,
// стейт которых начал резолиться во время запроса к странице
WidgetHelper.waitForStates(store);
```

# TODO

- [ ] добавить эпики

- [ ] код widgetHelper ужасен
- [ ] просмисы в getInitialState будут резолвиться только в корне обьекта
- [ ] ответ из запросов widetsStateClientPromises может пересекаться

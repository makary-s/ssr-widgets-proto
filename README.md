[сендбокс](https://codesandbox.io/s/ssr-widgets-proto-0rlx2)

# Использование

### Создание:

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
  reducers,
  // эпики
  epics,
});
```

### Блокирование и получение стейта:

Начальный стейт компонент получает из результата выполнения getInitialState. Он может содержать промисы, и они будут автоматически срезолвены прежде чем попасть в финальный стейт.

Аттрибут `$isBlocking` означает, что сервер не вернет рендер пока не будет срезолвен стейт этого компонента:

```js
<FooWidget $isBlocking />
```

Без этого аттрибута стейт тоже начнет сразу же резолвится еще на сервере, но это не будет блокировать загрузку страницы. Клиент получит данные, как только они будут готовы.

```js
<FooWidget />
```

Это не распространяется на виджиты, которые не попали в начальный рендер страницы. Их стейт будет срезолвен на клиенте.

```js
{
  isVisible ? <FooWidget /> : null; // isVisible === false
}
```

### Эпики:

Указанные при создания виджета эпики реагируют только на экшены содержищие id экземпляра виджета в meta (про диспатч экшенов и widgetId см. в разделе Хуки). Эпики автоматически перекидывают дальше id виджета в meta возвращаемого ими экшна, если он не был указан вручную. Поэтому результат работы эпика не повлияет на остальные экземпляры виджета.

Пример:

```js
const clickAction = () => ({ type: CLICK });
const logAction = () => ({ type: LOG });

const clickEpic = (action$) => action$.pipe(ofType(CLICK), mapTo(logAction()));

const logEpic = (action$) =>
  action$.pipe(
    ofType(LOG),
    tap(({ meta: { id } }) => console.log(id)), // здесь появится id экземпляра виджета
    ignoreElements()
  );

const Widget = WidgetHelper.create({
  Component: function Button() {
    const onClick = useAction(clickAction);

    return <button onClick={onClick)} />;
  },
  epics: [clickEpic, logEpic]
});
```

### Хуки:

useAction автоматически просавляет `meta.id` в экшн. Поэтому после диспатча он попадет только в редьюсер данного экземпляра виджета.

```js
import { useAction } from "../widgetHelper";
...
// хук диспачащий акшены для экземпляра виджета
const onClick = useAction(sctionCreator);
return <button onClick={onClick}/>
```

Id виджета так же можно получить напрямую с помощью хука useWidgetId:

```js
import { useWidgetId } from "../widgetHelper";
...
// хук диспачащий акшены для экземпляра виджета
const widgetId = useWidgetId()
return <button onClick={() => dispatch(actionCreator(widgetId))}/>
```

### Режим изолированного рендера виджета:

Если добавить квери параметр `sw` то страница отрендерится с ссылками на изолированный просмотр виджетов.

# Настройка

## На клиенте:

Подключаем редьюсер виджетов:

```js
combineReducers({ ...reducers, ...WidgetHelper.getReducers() });
```

Подключаем эпик виджетов:

```js
combineEpics(...epics, WidgetHelper.getEpic());
```

Наблюдаем за Server-Sent Events, которые обновят неблокирущие отрендеренные виджеты, стейт которых начал резолиться во время запроса к странице:

```js
WidgetHelper.prepareClient(store);
```

В пропсе wsModeCom будет лежать компонент если мы находимся в режиме изолированного рендера виджета:

```js
render(WidgetHelper.wsModeCom, document.getElementById("root"));
```

## На сервере:

Получаем финальные html и стейт:

```js
const { html, initialState } = await WidgetHelper.prepareRenderData(
  <App store={store} isClient={false} />,
  store.getState()
);
```

Подключаем Server-Sent Events, которые вернут начальные стейты неблокирующих отрендеренных виджетов:

```js
server.get(WidgetHelper.waitPath, WidgetHelper.serverWaiter);
```

В пропсе WidgetHelper.wsModePath хранится адрес, на который будут указывать ссылки в режиме изолированного рендера.

```js
server.get(WidgetHelper.wsModePath, async (req, res) => ...
```

# TODO

- [x] добавить эпики

- [ ] код widgetHelper ужасен
- [ ] просмисы в getInitialState будут резолвиться только в корне объекта
- [ ] ответ из запросов widetsStateClientPromises может пересекаться
- [ ] сделать обработку вложенных виджетов рекурсивной
- [ ] инжект подписей-ссылок с именами виджитов - расхождение с ssr и ворнинг

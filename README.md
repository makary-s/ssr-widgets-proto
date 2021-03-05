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

```js
// isBlocking - сервер не вернет рендер
// пока не будет срезолвен стейт этого компонента
<FooWidget name="foo-a" $isBlocking />

// Нет isBlocking - результат уже резолвится на сервере,
// но это не тормозит загрузку страницы. Стейт пришлется как только будет готов
<FooWidget name="foo-b" />

// Если Comp не отрендерился, потому что значение isVisible === false,
// то он не понал в ssr рендер и его стейта еще нет в редуксе.
// Стейт появится как только компонент будет отрендерен на клиента и его стейт срезолвится.
{isVisible ? <FooWidget name="foo-b" /> : null}
```

### Эпики:

Эпики автоматически добавляют в экшн meta.id, если его нет. Поэтому результат работы эпика не повлияет на остальные экземпляры виджета.
Пример:

```js
const logAction = () => ({
  type: LOG
});

const Widget = WidgetHelper.create({
  Component: function Button() {
    return () => <button onClick={dispatch(logAction())} />;
  }
});

const clickEpic = (action$) => action$.pipe(ofType(CLICK), mapTo(logAction()));

const logEpic = (action$) =>
  action$.pipe(
    ofType(LOG),
    tap(({ meta: { id } }) => console.log(id)), // -> Button-1
    ignoreElements()
  );
```

### Хуки:

useAction автоматически просавляет meta.id в экшн. Поэтому после диспатча он попадет только в редьюсер данного экземпляра виджета.

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
  // TODO isClient не нужен
  <App store={store} isClient={false} />,
  store.getState()
);
```

Подключаем Server-Sent Events, которые вернут начальные стейты неблокирующих отрендеренных виджетов:

```js
server.get(WidgetHelper.waitPath, WidgetHelper.serverWaiter);
```

В пропсе WidgetHelper.wsModePath хранится адрес, на который будут указывать сссылки в режиме изолированного рендера.

```js
server.get(WidgetHelper.wsModePath, async (req, res) => ...
```

# TODO

- [ ] добавить эпики

- [ ] код widgetHelper ужасен
- [ ] просмисы в getInitialState будут резолвиться только в корне объекта
- [ ] ответ из запросов widetsStateClientPromises может пересекаться
- [ ] сделать обработку вложенных виджетов рекурсивной
- [ ] инжект подписей-ссылок с именами виджитов - расхождение с ssr и ворнинг

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
  reducers
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

### Хуки:

```js
import { useAction } from "../widgetHelper";

...
// хук диспачащий акшены для экземпляра виджета
const onClick = useAction(sctionCreator);
return <button onClick={onClick}/>
```

### Режим изолированного рендера виджета:

Если добавить квери параметр `sw` то страница отрендерится с ссылками на изолированный просмотр виджетов.

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
WidgetHelper.prepareClient(store);
```

```js
// В пропсе wsModeCom будет лежать компонент если мы находимся в режиме рендера одного виджета
render(WidgetHelper.wsModeCom, document.getElementById("root"));
```

# TODO

- [ ] добавить эпики

- [ ] код widgetHelper ужасен
- [ ] просмисы в getInitialState будут резолвиться только в корне объекта
- [ ] ответ из запросов widetsStateClientPromises может пересекаться
- [ ] сделать обработку вложенных виджетов рекурсивной
- [ ] инжект подписей-ссылок с именами виджитов - расхождение с ssr и ворнинг

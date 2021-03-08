export default ({ html = "", initialState = {} } = {}) =>
  `
<!doctype html>
<html>
  <head>
    <title>Hello</title>
  </head>
  <body>
    <div id="root">${html}</div>
    <script>
      // WARNING: See the following for security issues around embedding JSON in HTML:
      // https://redux.js.org/recipes/server-rendering/#security-considerations
      window.__INITIAL_STATE__ = ${JSON.stringify(initialState).replace(
        /</g,
        "\\u003c"
      )}
    </script>
    <script src="/assets/client.bundle.js"></script>
  </body>
</html>
`;

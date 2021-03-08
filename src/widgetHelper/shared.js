export const wsModePath = "/widget";
export const waitPath = "/init_widgets";

export async function serverWaiter(req, res) {
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive"
  });

  await Promise.all(
    this.widetsStateClientPromises.map(async ({ id, initialState }) => {
      const result = {};
      await Promise.all(
        Object.entries(initialState).map(async ([key, val]) => {
          result[key] = await val;
        })
      ).then(() => {
        res.write(`data: ${JSON.stringify({ id, state: result })}\n\n`);
      });
    })
  );

  res.write(`data: CLOSE\n\n`);

  res.end();
}

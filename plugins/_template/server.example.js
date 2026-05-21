/**
 * Volume plugin API — /app/plugins/custom/<id>/server.js
 * Routed via POST /api/plugins/<id>/…
 *
 * @param {{ pluginId: string, path: string[], request: Request }} ctx
 */
module.exports = async function handler(ctx) {
  if (ctx.request.method === 'GET') {
    return Response.json({ ok: true, pluginId: ctx.pluginId, path: ctx.path })
  }
  return Response.json({ error: 'method_not_allowed' }, { status: 405 })
}

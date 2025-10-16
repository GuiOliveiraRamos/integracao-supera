/**
 * Middlewares de correlação e logs de requisições
 */

// Gera um ID simples (sem depender de libs)
function genId() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

// Middleware para adicionar um requestId em cada requisição
export function correlationId(req, res, next) {
  const incomingId = req.headers["x-request-id"];
  req.requestId =
    incomingId && String(incomingId).trim() !== ""
      ? String(incomingId)
      : genId();
  res.setHeader("x-request-id", req.requestId);
  next();
}

// Middleware para logar início/fim das requisições
export function requestLogger(req, res, next) {
  const start = process.hrtime.bigint();

  const bodyKeys =
    req.body && typeof req.body === "object" ? Object.keys(req.body) : [];
  const headersSample = {
    "user-agent": req.headers["user-agent"],
    "x-forwarded-for": req.headers["x-forwarded-for"],
    "x-vercel-ip-country": req.headers["x-vercel-ip-country"],
  };

  console.log("[REQ]", {
    requestId: req.requestId,
    method: req.method,
    url: req.originalUrl || req.url,
    bodyKeys,
    headers: headersSample,
  });

  res.on("finish", () => {
    const end = process.hrtime.bigint();
    const durationMs = Number(end - start) / 1_000_000;
    console.log("[RES]", {
      requestId: req.requestId,
      method: req.method,
      url: req.originalUrl || req.url,
      statusCode: res.statusCode,
      durationMs: Number(durationMs.toFixed(2)),
    });
  });

  next();
}

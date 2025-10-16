/**
 * Middleware global de tratamento de erros
 */

/**
 * Handler de erros para a aplicação
 * @param {Error} err - Erro capturado
 * @param {Request} req - Request do Express
 * @param {Response} res - Response do Express
 * @param {Function} next - Próximo middleware
 */
export function errorHandler(err, req, res, next) {
  console.error("Erro capturado pelo errorHandler:", err);

  // Se a resposta já foi enviada, delegar para o handler padrão do Express
  if (res.headersSent) {
    return next(err);
  }

  // Determinar o status code
  const statusCode = err.statusCode || 500;

  // Construir resposta de erro
  const errorResponse = {
    success: false,
    error: err.message || "Erro interno do servidor",
    ...(process.env.NODE_ENV === "development" && {
      stack: err.stack,
      details: err.details,
    }),
  };

  res.status(statusCode).json(errorResponse);
}

/**
 * Handler para rotas não encontradas (404)
 * @param {Request} req - Request do Express
 * @param {Response} res - Response do Express
 */
export function notFoundHandler(req, res) {
  res.status(404).json({
    success: false,
    error: "Rota não encontrada",
    path: req.originalUrl,
    method: req.method,
  });
}

/**
 * Wrapper assíncrono para capturar erros em controllers
 * @param {Function} fn - Função controller assíncrona
 * @returns {Function} - Função wrapper
 */
export function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

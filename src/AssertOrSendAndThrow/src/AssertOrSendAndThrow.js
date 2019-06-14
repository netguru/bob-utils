module.exports = response => statusCode => (condition, error) => {
  if (!condition) {
    response.status(statusCode).json({
      ok: false,
      error,
    });

    throw error;
  }
};

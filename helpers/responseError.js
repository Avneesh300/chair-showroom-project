const responseError = (
  res,
  message = "Something went wrong",
  statusCode = 500,
  error = null
) => {
  return res.status(statusCode).json({
    success: false,
    message,
    error,
  });
};

export default responseError;
const badRequestHandler = (err, req, res, next) => {
  console.log("line2 -errorhandler", err);
  if (err.httpStatusCode === 401) {
    res.status(401).send("Un authorized");
  }
  next(err);
}; // 400
const authorizationHandler = (err, req, res, next) => {
  if (err.httpStatusCode === 403) {
    res.status(403).send("Forbiden");
  } else next(err);
};

const notFoundHandler = (err, req, res, next) => {
  if (err.httpStatusCode === 404) {
    res.status(404).send("Resource not found!");
  }
  next(err);
}; // 404

// catch all
const genericErrorHandler = (err, req, res, next) => {
  if (!res.headersSent) {
    // checks if another error middleware already sent a response
    res.status(err.httpStatusCode || 500).send(err.message);
  }
};

module.exports = {
  badRequestHandler,
  notFoundHandler,
  genericErrorHandler,
  authorizationHandler,
};

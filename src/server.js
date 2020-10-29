const express = require("express");
const app = express();
const cookieParser = require("cookie-parser");
const clientRoute = require("./routes/client");
const blogRoute = require("./routes/blog");
const listEndpoints = require("express-list-endpoints");
const cors = require("cors");
const mongoose = require("mongoose");
const cloudinary = require("cloudinary").v2;

const {
  badRequestHandler,
  notFoundHandler,
  genericErrorHandler,
  authorizationHandler,
} = require("./errorHandlers");
const { authorize } = require("./auth");

cloudinary.config({
  cloud_name: process.env.API_CloudName,
  api_key: process.env.API_Key,
  api_secret: process.env.API_Secret,
});

const port = process.env.PORT;
const whitelist =
  process.env.NODE_ENV === "production"
    ? [process.env.FE_URL]
    : ["http://localhost:3000", "http://localhost:3002"];

const corsOptions = {
  origin: function (origin, callback) {
    if (whitelist.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
};
app.use(express.json());

app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Credentials", true);
  res.header("Access-Control-Allow-Origin", req.headers.origin);
  res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE");
  res.header(
    "Access-Control-Allow-Headers",
    "X-Requested-With, X-HTTP-Method-Override, Content-Type, Accept"
  );
  next();
});
app.use(cookieParser());
app.use(cors({ credentials: true, origin: "*" }));

app.use("/client", clientRoute);
app.use("/blog", blogRoute);

app.use(
  badRequestHandler,
  notFoundHandler,
  authorizationHandler,
  genericErrorHandler
);
console.log(listEndpoints(app));

mongoose
  .connect(
    `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.wa0l0.mongodb.net/test?retryWrites=true&w=majority`,
    {
      useFindAndModify: false,
      useNewUrlParser: true,
      useUnifiedTopology: true,
    }
  )
  .then(
    app.listen(port, () => {
      console.log("Running on PORT", port);
    })
  )
  .catch((err) => console.log(err));

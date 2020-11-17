const route = require("express").Router();
const { authorize } = require("../../auth");
const upload = require("multer")();
const {
  createNewClient,
  addProfileImage,
  logUserIn,
  clientById,
  refreshToken,
  editClient,
  tryit,
} = require("./controllers");

//Create a new Client
route.post("/", createNewClient);
//Add profile Image
route.post("/image", authorize, upload.single("profile"), addProfileImage);
//Log Client in
route.post("/login", logUserIn);

//Get client by ID
route.get("/", authorize, clientById);

route.get("/trythis", tryit);

//Generate new tokens with refresh Token
route.post("/refresh", refreshToken);

//Edit Client Info
route.put("/", authorize, editClient);

// TODO : Add device

module.exports = route;

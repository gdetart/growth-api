const route = require("express").Router();
const clientModel = require("./schema");
const { authenticate, authorize, generateNewTokens } = require("../../auth");
const upload = require("multer")();
const { join } = require("path");
const { writeFile, unlink } = require("fs-extra");
const cloudinary = require("cloudinary").v2;
const bcrypt = require("bcrypt");
//Add a new Client
route.post("/", async (req, res, nex) => {
  try {
    const newClient = new clientModel(req.body);
    const client = await newClient.save();
    const tokens = await authenticate(client);
    res.cookie("tokens", { ...tokens }).send(client);
  } catch (error) {
    nex(error);
  }
});

route.post(
  "/image",
  authorize,
  upload.single("profile"),
  async (req, res, next) => {
    try {
      const imgDir = join(
        __dirname,
        `../../../public/profileImages/${req.user._id + req.file.originalname}`
      );
      await writeFile(imgDir, req.file.buffer);
      const imageURL = await cloudinary.uploader.upload(imgDir);
      console.log(imageURL.secure_url);

      const image = await clientModel.findByIdAndUpdate(req.user._id, {
        image: imageURL.secure_url,
      });
      unlink(imgDir, (err) => console.log(err));
      res.status(201).send(imageURL.secure_url);
    } catch (err) {
      console.log(err);
      next(err);
    }
  }
);
//Log Client in
route.post("/login", async (req, res, nex) => {
  try {
    const { email, password } = req.body;
    const user = await clientModel.findByCred(email, password);
    if (user.email === email) {
      user.password = "";
      const { accessToken, refreshToken } = await authenticate(user);
      res.cookie("tokens", { accessToken, refreshToken }, {sameSite="none",httpOnly:true,secure=true});
      res.send(user);
    } else {
      nex(user);
    }
  } catch (error) {
    nex(error);
  }
});

route.get("/", authorize, async (req, res, nex) => {
  const user = await clientModel.findById(req.user._id, {
    password: 0,
    refreshTokens: 0,
    _v: 0,
  });
  if (!user) res.status(401).send("notFound");
  res.send(user);
});

route.post("/refresh", async (req, res, nex) => {
  if (!req.cookies) res.status(404).send("Please authenticate");
  const { accessToken, refreshToken, user } = await generateNewTokens(
    req.cookies.tokens.refreshToken
  );
  const userData = await clientModel.findById(user);
  res
    .cookie(
      "tokens",
      {
        accessToken,
        refreshToken,
      },
      {sameSite="none",httpOnly:true}
    )
    .send(userData);
});

//Edit Client info
route.put("/", authorize, async (req, res, nex) => {
  if (req.body.password) {
    let newPassword = req.body.password;
    let oldPassword = req.body.oldPassword;
    delete req.body.password;
    delete req.body.oldPassword;
    delete req.body.confirmPassword;
    console.log(req.body);
    try {
      let client = await clientModel.changePassword(
        req.user._id,
        newPassword,
        oldPassword
      );
      if (!client) res.status(404).send("Something went wrong");
    } catch (error) {}
  }
  let client = await clientModel.findByIdAndUpdate(req.user._id, req.body);
  res.status(200).send(client);
});

//Add device

module.exports = route;

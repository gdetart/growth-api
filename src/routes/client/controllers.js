const clientModel = require("./schema");
const { join } = require("path");
const { writeFile, unlink } = require("fs-extra");
const cloudinary = require("cloudinary").v2;
const { authenticate, generateNewTokens } = require("../../auth");

const createNewClient = async (req, res, nex) => {
  const { name, surname, email, password } = req.body;

  if (!name || !surname || !email || !password) {
    const err = new Error(
      'Please provide all necessary fields {name:"STRING",surname:"STRING",email:"STRING-email",password:"string"}'
    );
    err.httpStatus = 500;
    nex(err);
  }
  try {
    const newClient = new clientModel({ name, surname, email, password });
    const client = await newClient.save();
    const { accessToken, refreshToken } = await authenticate(client);
    res
      .cookie("accessToken", accessToken, {
        sameSite: "none",
        secure: true,
        path: "/",
      })
      .cookie("refreshToken", refreshToken, {
        sameSite: "none",
        secure: true,
        path: "/",
      })
      .send(client);
  } catch (error) {
    nex(error);
  }
};

const addProfileImage = async (req, res, next) => {
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
};

const logUserIn = async (req, res, nex) => {
  try {
    const { email, password } = req.body;
    console.log("email", email);
    let user = await clientModel.findByCred(email, password);

    if (user.email === email) {
      const { accessToken, refreshToken } = await authenticate(user);
      res
        .cookie("accessToken", accessToken, {
          sameSite: "none",
          secure: true,
          path: "/",
        })
        .cookie("refreshToken", refreshToken, {
          sameSite: "none",
          secure: true,
          path: "/",
        })
        .send(user);
    } else {
      nex(user);
    }
  } catch (error) {
    nex(error);
  }
};

const refreshToken = async (req, res, nex) => {
  try {
    if (!req.cookies) res.status(404).send("Please authenticate");
    const { accessToken, refreshToken, user } = await generateNewTokens(
      req.cookies.refreshToken
    );
    const userData = await clientModel.findById(user);
    res
      .cookie("accessToken", accessToken, {
        sameSite: "none",
        secure: true,
        path: "/",
      })
      .cookie("refreshToken", refreshToken, {
        sameSite: "none",
        secure: true,
        path: "/",
      })
      .send(userData);
  } catch (error) {
    nex(error);
  }
};

const clientById = async (req, res, nex) => {
  try {
    const client = await clientModel.findById(req.client._id, {
      password: 0,
      refreshTokens: 0,
      _v: 0,
    });
    if (!client) res.status(401).send("notFound");
    res.send(client);
  } catch (error) {
    nex(error);
  }
};

const editClient = async (req, res, nex) => {
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
};

module.exports = Object.freeze({
  createNewClient,
  addProfileImage,
  logUserIn,
  refreshToken,
  clientById,
  editClient,
});

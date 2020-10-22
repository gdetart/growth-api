const jwt = require("jsonwebtoken");
const { Error } = require("mongoose");
const clientModel = require("./routes/client/schema");

const authorize = async (req, res, next) => {
  try {
    // check if COOKIES contain tokens !!
    if (!req.cookies.tokens) {
      const err = new Error();
      err.message = "Please authenticate";
      err.httpStatusCode = 401;
      next(err);
    }

    const { accessToken, refreshToken } = req.cookies.tokens;

    const decoded = await verifyAccessToken(accessToken);
    const user = await clientModel.findById(decoded._id);
    if (!user) {
      const err = new Error();
      err.message = "You are not authorized";
      err.httpStatusCode = 401;
      next(err);
    }
    req.accessToken = accessToken;
    req.refreshToken = refreshToken;
    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
};

const authenticate = async (user) => {
  try {
    // generate tokens
    const accessToken = await generateAccesToken({ _id: user._id });
    const refreshToken = await generateRefreshToken({ _id: user._id });
    const addRefreshToDB = await clientModel.findByIdAndUpdate(user._id, {
      $push: { refreshTokens: refreshToken },
    });
    tokens = { accessToken, refreshToken };
    return tokens;
  } catch (error) {
    console.log(error);
    throw new Error(error);
  }
};

const generateAccesToken = (payload) =>
  new Promise((res, rej) =>
    jwt.sign(
      payload,
      process.env.JWT_SECRET_KEY,
      { expiresIn: 1200 },
      (err, token) => {
        if (err) rej(err);
        res(token);
      }
    )
  );

const generateRefreshToken = (payload) =>
  new Promise((res, rej) =>
    jwt.sign(
      payload,
      process.env.REFRESH_SECRET_KEY,
      { expiresIn: "1y" },
      (err, token) => {
        if (err) rej(err);
        res(token);
      }
    )
  );

const verifyAccessToken = async (token) => {
  try {
    const user = jwt.verify(token, process.env.JWT_SECRET_KEY);
    return user;
  } catch (error) {
    return error;
  }
};

const verifyRefreshToken = async (token) => {
  try {
    const user = jwt.verify(token, process.env.REFRESH_SECRET_KEY);
    return user;
  } catch (error) {
    return error;
  }
};

const generateNewTokens = async (refreshToken) => {
  try {
    const user = jwt.verify(refreshToken, process.env.REFRESH_SECRET_KEY);
    if (user._id) {
      const removeOldRefresh = await clientModel.findByIdAndUpdate(user._id, {
        $pull: { refreshTokens: refreshToken },
      });
      const tokens = await authenticate(user);
      return { ...tokens, user: user._id };
    } else {
      throw new Error();
    }
  } catch (error) {
    console.log(error);
  }
};
module.exports = { authenticate, authorize, generateNewTokens };

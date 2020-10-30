const jwt = require("jsonwebtoken");
const clientModel = require("./routes/client/schema");

const authorize = async (req, res, next) => {
  try {
    // check if COOKIES contain tokens !!
    if (!req.cookies) {
      const err = new Error();
      err.httpStatusCode = 401;
      next(err);
    }

    const { accessToken, refreshToken } = req.cookies;
    console.log("line16 authjs", req.cookies);

    const decoded = await verifyAccessToken(accessToken);
    console.log("line 19 authjs", decoded);

    const client = await clientModel.findById(decoded._id);
    if (!client) {
      const err = new Error();
      err.httpStatusCode = 401;
      next(err);
    }
    req.accessToken = accessToken;
    req.refreshToken = refreshToken;
    req.client = client;
    next();
  } catch (err) {
    next(err);
  }
};

const authenticate = async (client) => {
  try {
    // generate tokens
    const accessToken = await generateAccesToken({ _id: client._id });
    const refreshToken = await generateRefreshToken({ _id: client._id });
    const addRefreshToDB = await clientModel.findByIdAndUpdate(client._id, {
      $push: { refreshTokens: refreshToken },
    });
    tokens = { accessToken, refreshToken };
    return tokens;
  } catch (error) {
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
    const client = jwt.verify(token, process.env.JWT_SECRET_KEY);
    return client;
  } catch (error) {
    throw error;
  }
};

const verifyRefreshToken = async (token) => {
  try {
    const client = jwt.verify(token, process.env.REFRESH_SECRET_KEY);
    return client;
  } catch (error) {
    throw error;
  }
};

const generateNewTokens = async (refreshToken) => {
  try {
    const client = jwt.verify(refreshToken, process.env.REFRESH_SECRET_KEY);
    if (client._id) {
      const removeOldRefresh = await clientModel.findByIdAndUpdate(client._id, {
        $pull: { refreshTokens: refreshToken },
      });
      const tokens = await authenticate(client);
      return { ...tokens, client: client._id };
    } else {
      throw new Error();
    }
  } catch (error) {
    throw error;
  }
};

module.exports = Object.freeze({ authenticate, authorize, generateNewTokens });

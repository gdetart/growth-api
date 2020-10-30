const { Schema, model } = require("mongoose");
const bcrypt = require("bcrypt");

const clientSchema = new Schema({
  name: { type: String, required: true },
  surname: { type: String, required: true },
  email: { type: String, required: true },
  password: { type: String, required: true },
  image: {
    type: String,
    default:
      "https://cdn.shopify.com/s/files/1/3098/9156/products/20200103223455_1200x1200.png?v=1578090899",
  },
  device: { String },
  refreshTokens: [String],
});

//THIS IS A PRE SAVE FUNCTION THAT CHECKS FOR EMAIL, AND PASSWORD VALIDATION
//ALSO  CONVERTS THE PASSWORD INTO HASHED STRING !
clientSchema.pre("save", async function (next) {
  const user = this;

  if (user.password.length > 8) {
    const validation = await clientModel.findOne({ email: user.email });

    if (!validation) {
      const checkPw = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?!.*\s).*$/; //Check if pw has a number,lowercase and uppercase
      const validPw = user.password.match(checkPw);
      console.log(validPw);

      if (validPw) {
        const encryptedPassword = await bcrypt.hash(user.password, 8);
        user.password = encryptedPassword;
        next();
      } else {
        const err = new Error();
        err.message = "THE PASSWORD YOU PROVIDED IS NOT A SAFE PASSWORD";
        next(err);
      }
    } else {
      const err = new Error();
      err.message = "EMAIL ALREADY EXISTS";
      next(err);
    }
  } else {
    const err = new Error();
    err.message = "PASSWORD MUST HAVE MORE THAN 8 CHARACTERS";
    next(err);
  }
});

//FINDS A CLIENT BASED ON HIS EMAIL AND CHECK FOR PASSWORD VALIDITY.
clientSchema.statics.findByCred = async (email, password) => {
  try {
    let client = await clientModel.findOne({ email });

    if (!client) return { msg: "client not found !!!" };

    const doesMatch = await bcrypt.compare(password, client.password);
    if (!doesMatch) {
      const err = new Error();
      err.message = "Unable to Login,check Credentials";
      err.httpStatusCode = 404;
      throw err;
    } else {
      const { name, surname, email, _id, image, device } = client;
      return Object.freeze({ name, surname, email, _id, image, device });
    }
  } catch (error) {
    error.message = "Exception while finding user";
    throw error;
  }
};

//COMPARES THE PASSWORDS IF EVERYTHING IS OKAY IT CHANGES THE PASSWORD.
clientSchema.static.changePassword = async (_id, oldPassword, newPassword) => {
  try {
    let client = await clientModel.findById(_id);
    if (!client) return "Client not found";
    const doesMatch = await bcrypt.compare(password, user.password);
    if (!doesMatch) return false;
    client = await clientModel.findByIdAndUpdate(_id, {
      password: newPassword,
    });
    return true;
  } catch (error) {}
};

const clientModel = model("Client", clientSchema);

module.exports = clientModel;

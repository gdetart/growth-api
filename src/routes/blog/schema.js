const { Schema, model } = require("mongoose");

const postSchema = new Schema({
  title: { type: String, required: true },
  text: { type: String },
  image: {
    type: String,
    default:
      "https://www.danswholesaleplants.com.au/resources/themes/danswholesaleplants.com.au-theme/img/placeholder/default-900x900.png",
  },
  author: { type: Schema.Types.ObjectId, required: true, ref: "Client" },
  head: { type: Boolean, default: false },
});

const postModel = model("Post", postSchema);

module.exports = postModel;

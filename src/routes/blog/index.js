const route = require("express").Router();
const { authorize } = require("../../auth");
const upload = require("multer")();
const { join } = require("path");
const { writeFile, unlink } = require("fs-extra");
const cloudinary = require("cloudinary").v2;
const postModel = require("./schema");

//Create a post
route.post("/", authorize, async (req, res, nex) => {
  try {
    const newPost = new postModel({ ...req.body, author: req.user });
    const post = await newPost.save();
    res.status(200).send(post);
  } catch (error) {
    nex(error);
  }
});

route.post(
  "/image/:id",
  authorize,
  upload.single("image"),
  async (req, res, next) => {
    try {
      const postID = req.params.id;
      const imgDir = join(
        __dirname,
        `../../../public/blogImages/${postID + req.file.originalname}`
      );
      await writeFile(imgDir, req.file.buffer);
      const imageURL = await cloudinary.uploader.upload(imgDir);
      console.log(imageURL);

      const image = await postModel.findByIdAndUpdate(postID, {
        image: imageURL.secure_url,
      });
      unlink(imgDir, (err) => {
        console.log(err);
      });
      res.status(201).send(imageURL);
    } catch (err) {
      console.log(err);
      next(err);
    }
  }
);
//Get all posts
route.get("/", authorize, async (req, res, nex) => {
  try {
    const allPosts = await postModel
      .find()
      .populate("author", ["name", "surname", "image"]);
    res.status(200).send(allPosts);
  } catch (error) {
    console.log(error);
    nex(err);
  }
});

//Get a single Post
route.get("/:id", authorize, async (req, res, nex) => {
  try {
    const post = await postModel.findById(req.params.id);
    res.status(200).send(post);
  } catch (error) {
    nex(error);
  }
});

//Edit post
route.put("/:id", authorize, async (req, res, nex) => {
  try {
    const postID = req.params.id;
    const post = await postModel.findById(postID);

    if (!post.author === req.user._id) {
      res.status(401).send("Unauthorized");
      return;
    }
    const updatePost = await postModel.findByIdAndUpdate(req.body);
    res.status(200).send("updated");
  } catch (error) {
    nex(error);
  }
});

//Delete post
route.delete("/:id", authorize, async (req, res, nex) => {
  try {
    const postID = req.params.id;
    const post = await postModel.findById(postID);

    if (!post.author === req.user._id) {
      res.status(401).send("Unauthorized");
      return;
    }
    const deletePost = await postModel.findByIdAndDelete(req.params.id);
    res.status(200).send("deleted");
  } catch (error) {
    nex(error);
  }
});

module.exports = route;

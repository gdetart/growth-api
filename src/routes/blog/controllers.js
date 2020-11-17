const postModel = require("./schema");
const cloudinary = require("cloudinary").v2;
const upload = require("multer")();
const { join } = require("path");
const { writeFile, unlink } = require("fs-extra");

const createPost = async (req, res, nex) => {
  const { title, text } = req.body;
  if (!title || !text) {
    const err = new Error(
      "Body should contain Title and Text ex : {title:'Post Title',text:'postDescription'}"
    );
    err.httpStatus = 500;
  }
  try {
    const newPost = new postModel({ title, text, author: req.client._id });
    console.log(req.client);
    const post = await newPost.save();
    res.status(200).send(post);
  } catch (error) {
    nex(error);
  }
};

const createPostImage = async (req, res, nex) => {
  try {
    const postID = req.params.id;
    const imgDir = join(
      __dirname,
      `../../../public/blogImages/${postID + req.file.originalname}`
    );
    await writeFile(imgDir, req.file.buffer);
    const imageURL = await cloudinary.uploader.upload(imgDir);

    const image = await postModel.findByIdAndUpdate(postID, {
      image: imageURL.secure_url,
    });
    unlink(imgDir, (err) => {
      err.httpStatus = 500;
      err.message = "Image was not Deleted from Directory";
      throw err;
    });
    res.status(201).send(imageURL);
  } catch (err) {
    next(err);
  }
};

const getAllPosts = async (req, res, nex) => {
  try {
    const allPosts = await postModel
      .find()
      .populate("author", ["name", "surname", "image"]);
    res.status(200).send(allPosts);
  } catch (error) {
    nex(err);
  }
};

const getSinglePost = async (req, res, nex) => {
  try {
    const post = await postModel.findById(req.params.id);
    res.status(200).send(post);
  } catch (error) {
    nex(error);
  }
};

const editPost = async (req, res, nex) => {
  try {
    const postID = req.params.id;
    const post = await postModel.findById(postID);

    if (!(post.author === req.client._id)) {
      res.status(401).send("Unauthorized");
      return;
    }
    const updatePost = await postModel.findByIdAndUpdate(req.body);
    res.status(200).send("updated");
  } catch (error) {
    nex(error);
  }
};

const deletePost = async (req, res, nex) => {
  try {
    const postID = req.params.id;
    const post = await postModel.findById(postID);

    if (!post.author === req.client._id) {
      res.status(401).send("Unauthorized");
      return;
    }
    const deletePost = await postModel.findByIdAndDelete(req.params.id);
    res.status(200).send("deleted");
  } catch (error) {
    nex(error);
  }
};

module.exports = Object.freeze({
  createPost,
  createPostImage,
  getAllPosts,
  getSinglePost,
  editPost,
  deletePost,
});

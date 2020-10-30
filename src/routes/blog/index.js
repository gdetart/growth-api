const route = require("express").Router();
const { authorize } = require("../../auth");
const upload = require("multer")();
const {
  createPost,
  createPostImage,
  getAllPosts,
  getSinglePost,
  editPost,
  deletePost,
} = require("./controllers");

//Create a post
route.post("/", authorize, createPost);
//Create post Image
route.post("/image/:id", authorize, upload.single("image"), createPostImage);
//Get all posts
route.get("/", authorize, getAllPosts);
//Get a single Post
route.get("/:id", authorize, getSinglePost);
//Edit post
route.put("/:id", authorize, editPost);
//Delete post
route.delete("/:id", authorize, deletePost);

module.exports = route;

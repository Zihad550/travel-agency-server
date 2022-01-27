const express = require("express");
const cors = require("cors");
const { MongoClient } = require("mongodb");
require("dotenv").config();
const app = express();
const ObjectId = require("mongodb").ObjectId;
const fileUpload = require("express-fileupload");

const port = process.env.PORT || 8000;

// middle ware
app.use(cors());
app.use(express.json());
app.use(fileUpload());

// mongo client
const client = new MongoClient(process.env.URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function run() {
  try {
    await client.connect();

    const database = client.db("travelAgency");
    const blogsCollection = database.collection("blogs");

    // get  blogs
    app.get("/blogs", async (req, res) => {
      const { page, size, status } = req.query;
      let cursor;
      if (status === "approved") {
        cursor = blogsCollection.find({ status });
      } else {
        cursor = blogsCollection.find({ status: { $ne: "approved" } });
      }
      let blogs;
      const count = await cursor.count();
      if (page) {
        blogs = await cursor
          .skip(page * size)
          .limit(parseInt(size))
          .toArray();
      } else {
        blogs = await cursor.toArray();
      }

      res.json({ blogs, count });
    });

    // save blogs
    /* app.post("/blogs", async (req, res) => {
      const blog = req.body;
      const result = await blogsCollection.insertOne(blog);
      res.json(result);
    }); */

    // delete a blog
    app.delete("/blogs", async (req, res) => {
      const id = req.query.id;
      const result = await blogsCollection.deleteOne({ _id: ObjectId(id) });
      res.json(result);
    });

    app.post("/blogs", async (req, res) => {
      const pic = req.files.src;
      const picData = pic.data;
      const encodedPic = picData.toString("base64");
      const imageBuffer = Buffer.from(encodedPic, "base64");
      const blog = {
        ...req.body,
        image: imageBuffer,
      };
      const result = await blogsCollection.insertOne(blog);
      res.json(result);
    });

    app.put("/blogs", async (req, res) => {
      const { id } = req.query;
      const result = await blogsCollection.updateOne(
        { _id: ObjectId(id) },
        { $set: { status: "approved" } }
      );
      res.json(result);
    });
  } finally {
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Welcome to travel agency server");
});

app.listen(port, () => {
  console.log("port running at localhost:", port);
});

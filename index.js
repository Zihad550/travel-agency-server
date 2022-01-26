const express = require("express");
const cors = require("cors");
const { MongoClient } = require("mongodb");
require("dotenv").config();
const app = express();
const ObjectId = require("mongodb").ObjectId;

const port = process.env.PORT || 8000;

// middle ware
app.use(cors());
app.use(express.json());

// mongo client
const client = new MongoClient(process.env.URI);

async function run() {
  try {
    await client.connect();

    const database = client.db("travelAgency");
    const blogsCollection = database.collection("blogs");

    // get all blogs
    app.get("/blogs", async (req, res) => {
      const { page, size } = req.query;
      const cursor = blogsCollection.find({});
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

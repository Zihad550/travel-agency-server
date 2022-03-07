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
    const usersCollection = database.collection("users");

    // get  blogs
    /* app.get("/blogs", async (req, res) => {
      const { page, size, status, filter } = req.query;
      console.log(filter);
      let cursor;
      if (status === "approved") {
        if (filter === "topRated") {
          cursor = blogsCollection.find({ status }).sort({ rating: -1 });
        } else if (filter === "leastRated") {
          cursor = blogsCollection.find({ status }).sort({ rating: 1 });
        } else if (filter === "mostExpensive") {
          cursor = blogsCollection.find({ status }).sort({ expense: -1 });
        } else if (filter === "leastExpensive") {
          cursor = blogsCollection.find({ status }).sort({ expense: 1 });
        } else {
          cursor = blogsCollection.find({ status });
        }
      } else {
        cursor = blogsCollection
          .find({ status: { $ne: "approved" } })
          .sort({ rating: -1 });
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
    }); */
    app.get("/blogs", async (req, res) => {
      const {
        page,
        size,
        status,
        filter,
        author,
        country,
        minPrice,
        maxPrice,
        applyFilter,
      } = req.query;
      let cursor;
      if (status === "approved") {
        if (filter === "topRated") {
          cursor = blogsCollection.find({ status }).sort({ rating: -1 });
        } else if (filter === "leastRated") {
          cursor = blogsCollection.find({ status }).sort({ rating: 1 });
        } else if (filter === "mostExpensive") {
          cursor = blogsCollection.find({ status }).sort({ expense: -1 });
        } else if (filter === "leastExpensive") {
          cursor = blogsCollection.find({ status }).sort({ expense: 1 });
        } else if (
          applyFilter === "true" &&
          author !== "Select Author name" &&
          country !== "Select Country"
        ) {
          cursor = blogsCollection.find({
            $and: [{ status }, { author }, { location: country }],
          });
        }

        // apply custom filter start
        else if (applyFilter === "true" && author !== "Select Author name") {
          cursor = blogsCollection.find({
            $and: [{ status }, { author }],
          });
        } else if (applyFilter === "true" && country !== "Select Country") {
          cursor = blogsCollection.find({
            $and: [
              { status },
              { location: country },
              // { expense: { $gte: minPrice, $lte: maxPrice } },
            ],
          });
        } else {
          cursor = blogsCollection.find({ status });
        }
      } else {
        cursor = blogsCollection
          .find({ status: { $ne: "approved" } })
          .sort({ rating: -1 });
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

    // delete a blog
    app.delete("/blogs", async (req, res) => {
      const id = req.query.id;
      const result = await blogsCollection.deleteOne({ _id: ObjectId(id) });
      res.json(result);
    });

    app.post("/blogs", async (req, res) => {
      const pic = req.files.src;
      if (pic.size > 200000) {
        res.json({
          error: "Please select a image file less then 200kb",
        });
      } else {
        const picData = pic.data;

        const encodedPic = picData.toString("base64");
        const imageBuffer = Buffer.from(encodedPic, "base64");
        const blog = {
          ...req.body,
          image: imageBuffer,
        };
        const result = await blogsCollection.insertOne(blog);
        res.json(result);
      }
    });

    app.put("/blogs", async (req, res) => {
      const { id } = req.query;
      const result = await blogsCollection.updateOne(
        { _id: ObjectId(id) },
        { $set: { status: "approved" } }
      );
      res.json(result);
    });

    // user routes
    // check if the user is admin
    app.get("/users/:email", async (req, res) => {
      const email = req.params.email;
      const user = await usersCollection.findOne({ email });
      let isAdmin = false;
      if (user?.role === "admin") {
        isAdmin = true;
      }
      res.json({ admin: isAdmin });
    });
    // post user
    app.post("/users", async (req, res) => {
      const user = req.body;
      const result = await usersCollection.insertOne(user);
      res.json(result);
    });

    // update user
    app.put("/users", async (req, res) => {
      const user = req.body;
      const result = await usersCollection.updateOne(
        { email: user.email },
        { $set: user },
        { upsert: true }
      );
      res.json(result);
    });

    // update user to admin
    app.put("/users/admin", async (req, res) => {
      const user = req.body;
      const filter = { email: user.email };
      const updateDoc = { $set: { role: "admin" } };
      const result = await usersCollection.updateOne(filter, updateDoc);
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

const express = require("express");
const app = express();
const cors = require("cors");
require("dotenv").config();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const { MongoClient, ServerApiVersion } = require("mongodb");
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.ktfe5gd.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    const monitorCollection = client.db("products").collection("monitor");

    // get all the monitor
    app.get("/monitor", async (req, res) => {
      const result = await monitorCollection.find().toArray();
      res.send(result);
    });

    // get the filtered data
    app.get("/products", async (req, res) => {
      try {
        const {
          brand,
          responseTime,
          refreshRate,
          resolution,
          price,
          availability,
          size,
          sortStatus,
          pageLimit,
          currentPage,
        } = req.query;
        // const monitors = await monitorCollection.find().toArray();
        let filteredProducts = await monitorCollection.find().toArray();

        if (brand) {
          filteredProducts = filteredProducts.filter((monitor) =>
            brand.includes(monitor.brand)
          );
        }

        if (resolution) {
          filteredProducts = filteredProducts.filter((monitor) =>
            resolution.includes(monitor.resolution)
          );
        }

        if (refreshRate) {
          filteredProducts = filteredProducts.filter((monitor) =>
            refreshRate.includes(monitor.refreshRate)
          );
        }
        if (responseTime) {
          filteredProducts = filteredProducts.filter((monitor) =>
            responseTime.includes(monitor.responseTime)
          );
        }

        if (price) {
          filteredProducts = filteredProducts.filter(
            (monitor) => monitor.price <= price
          );
        }
        if (availability) {
          filteredProducts = filteredProducts.filter((monitor) =>
            availability.includes(monitor.availability)
          );
        }

        // spli to make array then add double quote
        if (size) {
          const tempSize = size.split(",").map((size) => `${size}"`);
          filteredProducts = filteredProducts.filter((monitor) =>
            tempSize.includes(monitor.size)
          );
        }

        // sort based on data
        if (sortStatus === "ascending") {
          filteredProducts = filteredProducts.sort((a, b) => a.price - b.price);
        } else if (sortStatus === "descending") {
          filteredProducts = filteredProducts.sort((a, b) => b.price - a.price);
        }

        // before slice store copy of filtered data for pagination
        const filterData = filteredProducts;
        console.log("after filter data length: ", filterData.length);

        // pagination data after filtering
        const start = parseInt(currentPage) * parseInt(pageLimit);
        const end = start + parseInt(pageLimit);
        if (end < filteredProducts.length) {
          filteredProducts = filteredProducts.slice(start, end);
        } else {
          filteredProducts = filteredProducts.slice(
            start,
            filteredProducts.length
          );
        }

        res.send({ filteredProducts, filterData });
      } catch (error) {
        console.error(error);
        res.status(5000).send("Error occured while fetching data");
      }
    });

    // // get the filtered monitors based on query
    // app.get("/products", async (req, res) => {
    //   const { brand, resolution, responseTime, refreshRate } = req.query;
    //   const monitors = await monitorCollection.find().toArray();
    //   let temp = monitors;
    //   let filteredProducts = [];

    //   if (brand) {
    //     temp = monitors.filter((monitor) => brand.includes(monitor.brand));
    //     filteredProducts.push(...temp);
    //   }

    //   if (resolution) {
    //     temp = monitors.filter((monitor) =>
    //       resolution.includes(monitor.resolution)
    //     );
    //     filteredProducts.push(...temp);
    //   }

    //   if (responseTime) {
    //     temp = monitors.filter((monitor) =>
    //       responseTime.includes(monitor.responseTime)
    //     );
    //     filteredProducts.push(...temp);
    //   }

    //   if (refreshRate) {
    //     temp = monitors.filter((monitor) =>
    //       refreshRate.includes(monitor.refreshRate)
    //     );
    //     filteredProducts.push(...temp);
    //   }
    //   if (temp.length < monitors.length) {
    //     temp = [...filteredProducts];
    //   }
    //   console.log("now data length: ", temp.length);
    //   res.send(temp);
    // });

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send({ yes: "star tech server running" });
});

app.listen(port, console.log("server is running"));

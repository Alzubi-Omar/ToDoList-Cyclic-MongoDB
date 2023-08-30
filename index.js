import express from "express";
import bodyParser from "body-parser";
import "dotenv/config";
import mongoose, { Schema } from "mongoose";
import _ from "lodash";

const app = express();
const PORT = process.env.PORT || 4000;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));
app.set("view engine", "ejs");
mongoose.set("strictQuery", false);

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.log(err);
    process.exit(1);
  }
};

//Created Schema
const itemsSchema = new mongoose.Schema({
  name: String,
});

//Created Model
const Item = mongoose.model("Item", itemsSchema);

//Creating items
const item1 = new Item({
  name: "Welcome to your todolist!",
});

const item2 = new Item({
  name: "Hit the + to add a new item",
});

const item3 = new Item({
  name: "<-- Hit this to delete an item",
});

//Storing items into an array
const defaultItems = [item1, item2, item3];

//Created different Schema
const listSchema = {
  name: String,
  items: [itemsSchema],
};

//Created Model
const List = mongoose.model("List", listSchema);

//Func to get current local date
const getLocalDate = function () {
  const options = {
    weekday: "long",
    month: "long",
    day: "numeric",
  };
  const day = new Date().toLocaleDateString("en-US", options);
  return day;
};

app.get("/", (req, res) => {
  Item.find({})
    .then((foundItems) => {
      if (foundItems.length === 0) {
        Item.insertMany(defaultItems)
          .then(() => {
            console.log("successfully saved to database");
          })
          .catch((err) => {
            console.log(err);
          });
      } else {
        res.render("list", {
          currentTitle: getLocalDate(),
          newListItems: foundItems,
        });
      }
    })
    .catch(function (err) {
      console.log(err);
    });
});

app.post("/delete", function (req, res) {
  const checkedListName = req.body.listName;
  const checkedItemId = req.body.toCheckBox;

  if (checkedListName === getLocalDate()) {
    //In the default list
    del().catch((err) => console.log(err));
    del;

    async function del() {
      await Item.deleteOne({ _id: checkedItemId });
      res.redirect("/");
    }
  } else {
    //In the custom list
    update().catch((err) => console.log(err));

    async function update() {
      await List.findOneAndUpdate(
        { name: checkedListName },
        { $pull: { items: { _id: checkedItemId } } }
      );
      res.redirect("/" + checkedListName);
    }
  }
});

app.get("/:customNewList", (req, res) => {
  const customListName = _.capitalize(req.params.customNewList);

  List.findOne({ name: customListName })
    .then((foundList) => {
      if (foundList === null) {
        //Create a new List
        const list = new List({
          name: customListName,
          items: defaultItems,
        });

        console.log("Title name not found, creating the new list");
        list.save();
        res.redirect("/" + customListName);
      } else {
        //Show an existing List

        res.render("list", {
          currentTitle: foundList.name,
          newListItems: foundList.items,
        });

        console.log("Title name found");
        // return foundList;
      }
    })
    .catch((err) => {
      console.log(err);
    });
});

app.post("/", async (req, res) => {
  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item = new Item({
    name: itemName,
  });

  if (listName === getLocalDate()) {
    item.save();
    res.redirect("/");
  } else {
    await List.findOne({ name: listName })
      .exec()
      .then((foundList) => {
        foundList.items.push(item);
        foundList.save();
        res.redirect("/" + listName);
      })
      .catch((err) => {
        console.log(err);
      });
  }
});

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Listening on port ${PORT}`);
  });
});

// POST model to keep track of the history of posts uploaded 
// to htlv.org. The first post: {
//   title: "ShahZaM: \"So far this bootcamp has been the most productive one I’ve had with compLexity",
//   url: "https://www.hltv.org/news/27582/shahzam-so-far-this-bootcamp-has-been-the-most-productive-one-ive-had-with-complexity"
// }
// posted on 21/8/2019 - 18:25

const mongoose = require("mongoose");

const postSchema = mongoose.Schema({
  title: String,
  url: String
})

module.exports = mongoose.model("Post", postSchema);
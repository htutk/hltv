const request = require("request");
const cheerio = require("cheerio");
const mongoose = require("mongoose"); // keeps track of old posts
const snoowrap = require("snoowrap");
const auth = require("./data.json"); // stores sensitive info of reddit authentications
const Post = require("./post");

var d = null;

// connect to localhost at 27017 by default
mongoose.connect("mongodb://localhost:27017/hltv", {
  useNewUrlParser: true
});

// use cheerio to perform jQuery-like selections
var $ = null;
var oldLink = null; // keeps track of the most recent post
const hltvLink = "https://www.hltv.org";

/*
Checks the most recent news article from hltv.org,
posts to the csgo subreddit if it hasn't been posted,
then saves the post in mongodb to prevent double postings
*/
function checkForNewAndUpload() {
  request.get(hltvLink, (err, res, body) => {
    // makes sure http request produces no error
    if (!err && res.statusCode == 200) {
      $ = cheerio.load(body);
      // get the first news article
      var newArticle = $("a .newstext")
        .toArray()
        .shift();
      var newText = newArticle.children[0].data;
      var newLink = hltvLink + newArticle.parent.attribs.href;
      // makes sure the new link is NEW
      if (newLink !== oldLink) {
        Post.findOne(
          // makes sure the new link has not been posted
          {
            title: newText,
            url: newLink
          },
          (err, foundPost) => {
            if (err) {
              console.log(err);
            } else if (!foundPost) {
              // no prev Post
              const user = new snoowrap({
                // userAgent: info about script app
                userAgent: auth.userAgent,
                // clientId: found on https://www.reddit.com/prefs/apps
                clientId: auth.clientId,
                // clientSecret: found on https://www.reddit.com/prefs/apps
                clientSecret: auth.clientSecret,
                // user and pwd: regular auth info
                username: auth.username,
                password: auth.password
              });

              var newPost = {
                title: newText,
                url: newLink
              };

              // snoowrap to post on subreddit
              const sr = "GlobalOffensive"
              user
                .getSubreddit(sr)
                .submitLink(newPost)
                .then(() => {
                  Post.create(newPost);
                  oldLink = newLink;
                  d = new Date();
                  console.log(
                    `${newText.substr(
                      0,
                      50
                    )} >>> UPLOADED >>>> ${d.getHours()}:${d.getMinutes()}:${d.getSeconds()}`
                  );
                })
                .catch(console.log);
            } else {
              // if there is an existing post, the post is old
              d = new Date();
              console.log(
                `OLD POST >> ${d.getHours()}:${d.getMinutes()}:${d.getSeconds()}`
              );
            }
          }
        );
      } else {
        // if the prev post is the same, no new post
        d = new Date();
        console.log(
          `OLD POST >> ${d.getHours()}:${d.getMinutes()}:${d.getSeconds()}`
        );
      }
    }
  });
}

// TODO: for top 20 at the end of the year
// TODO: make checkpoint to see if 10 am yet to start the script
// TODO: if 10 am, run the setInterval every 3/5 seconds.

checkForNewAndUpload(); // runs for the first time
setInterval(checkForNewAndUpload, 60000);
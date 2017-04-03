var m = require("mithril")

var NewsList = require("./views/NewsList")

m.route(document.body, "/news", {
    "/news": NewsList
})

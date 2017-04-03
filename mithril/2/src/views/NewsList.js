var m = require("mithril")
var News = require("../models/News")

var NewsItem = {
  view: function(vnode) {
    return m(".news-list-item", m("a", {href: vnode.attrs.url}, vnode.attrs.title + " (" + vnode.attrs.points + ")"))
  }
}
module.exports = {
    oninit: News.loadList,
    view: function() {
        return m(".news-list", News.list.map(function(n) {
            //return m(".news-list-item", n.title + " " + n.points)
            return m(NewsItem, {url: n.url, title: n.title, points: n.points});
        }))
    }
}

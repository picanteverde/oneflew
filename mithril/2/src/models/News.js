var m = require("mithril")

var News = {
    list: [],
    loadList: function() {
        return m.request({
            method: "GET",
            url: "http://node-hnapi.herokuapp.com/news",
            withCredentials: false,
        })
        .then(function(result) {
            News.list = result;
        })
    },
}

module.exports = News;

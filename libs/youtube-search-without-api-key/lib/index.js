"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.search = exports.Name = void 0;
var search_1 = require("./lib/search");
var Name = function (name) { return "Hello " + name; };
exports.Name = Name;
function search(searchQuery) {
    return search_1.searchVideo(searchQuery);
}
exports.search = search;

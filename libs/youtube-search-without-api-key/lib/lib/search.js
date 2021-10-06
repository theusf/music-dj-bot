"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.searchVideo = void 0;
var parser_service_1 = require("./parser.service");
var got_1 = require("got");
function searchVideo(searchQuery) {
    return __awaiter(this, void 0, void 0, function () {
        var YOUTUBE_URL, results, details, fetched, options, searchRes, html, data, i, data, parserService, parsed, res;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    YOUTUBE_URL = 'https://www.youtube.com.br';
                    results = [];
                    details = [];
                    fetched = false;
                    options = { type: "video", limit: 0 };


                    searchQuery =  searchQuery.split(' ').join('+')
                    console.log(encodeURI(YOUTUBE_URL + "/results?search_query=" + searchQuery.trim() + "&hl=br"))
                    
                    return [4 /*yield*/, got_1.default.get(encodeURI(YOUTUBE_URL + "/results?search_query=" + searchQuery.trim() + "&hl=br"))];
                case 1:
                    searchRes = _a.sent();
                    return [4 /*yield*/, searchRes.body];
                case 2:
                    html = _a.sent();
                    // try to parse html
                    try {
                        data = html.split("ytInitialData = '")[1].split("';</script>")[0];
                        // @ts-ignore
                        html = data.replace(/\\x([0-9A-F]{2})/ig, function () {
                            var items = [];
                            for (var _i = 0; _i < arguments.length; _i++) {
                                items[_i] = arguments[_i];
                            }
                            return String.fromCharCode(parseInt(items[1], 16));
                        });
                        html = html.replaceAll("\\\\\"", "");
                        html = JSON.parse(html);
                    }
                    catch (e) { /* nothing */ }
                    if (html && html.contents && html.contents.sectionListRenderer && html.contents.sectionListRenderer.contents
                        && html.contents.sectionListRenderer.contents.length > 0 && html.contents.sectionListRenderer.contents[0].itemSectionRenderer &&
                        html.contents.sectionListRenderer.contents[0].itemSectionRenderer.contents.length > 0) {
                        details = html.contents.sectionListRenderer.contents[0].itemSectionRenderer.contents;
                        fetched = true;
                    }
                    // backup/ alternative parsing
                    if (!fetched) {
                        try {
                            details = JSON.parse(html.split('{"itemSectionRenderer":{"contents":')[html.split('{"itemSectionRenderer":{"contents":').length - 1].split(',"continuations":[{')[0]);
                            fetched = true;
                        }
                        catch (e) { /* nothing */
                        }
                    }
                    if (!fetched) {
                        try {
                            details = JSON.parse(html.split('{"itemSectionRenderer":')[html.split('{"itemSectionRenderer":').length - 1].split('},{"continuationItemRenderer":{')[0]).contents;
                            fetched = true;
                        }
                        catch (e) { /* nothing */ }
                    }
                    if (!fetched)
                        return [2 /*return*/, []];
                    // tslint:disable-next-line:prefer-for-of
                    for (i = 0; i < details.length; i++) {
                        if (typeof options.limit === "number" && options.limit > 0 && results.length >= options.limit)
                            break;
                        data = details[i];
                        parserService = new parser_service_1.ParserService();
                        parsed = parserService.parseVideo(data);
                        if (!parsed)
                            continue;
                        res = parsed;
                        results.push(res);
                    }
                    return [2 /*return*/, results];
            }
        });
    });
}
exports.searchVideo = searchVideo;

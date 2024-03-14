"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.app = void 0;
const express_1 = __importDefault(require("express"));
const user_1 = require("./api/user");
const vote_1 = require("./api/vote");
const upload_1 = require("./api/upload");
const body_parser_1 = __importDefault(require("body-parser"));
const cors_1 = __importDefault(require("cors"));
exports.app = (0, express_1.default)();
exports.app.use((0, cors_1.default)({
    origin: ["https://projectwebcat.web.app", "http://localhost:4200", "https://agreeable-capris-calf.cyclic.app"],
    // origin: "*", //เรียกได้ทุกเว็บ
}));
exports.app.use(body_parser_1.default.text());
exports.app.use(body_parser_1.default.json());
exports.app.use("/user", user_1.router);
exports.app.use("/vote", vote_1.router);
exports.app.use("/upload", upload_1.router);
exports.app.use("/", (req, res) => {
    res.send("Test!!!");
});

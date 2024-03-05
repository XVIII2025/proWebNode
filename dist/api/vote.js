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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.router = void 0;
const express_1 = __importDefault(require("express"));
const dbConnect_1 = require("../dbConnect");
const mysql_1 = __importDefault(require("mysql"));
exports.router = express_1.default.Router();
exports.router.get("/all", (req, res) => {
    const sql = "select * from vote";
    dbConnect_1.conn.query(sql, (err, result) => {
        if (err) {
            res.json(err);
        }
        else {
            res.json(result);
        }
    });
});
exports.router.get("/", (req, res) => {
    if (req.query.vid) {
        const vid = req.query.vid;
        const sql = "select * from vote where vid = ?";
        dbConnect_1.conn.query(sql, [vid], (err, result) => {
            if (err) {
                res.json(err);
            }
            else {
                res.json(result);
            }
        });
    }
    else {
        res.send("no id");
    }
});
exports.router.post("/", (req, res) => {
    if (req.body) {
        const id = req.query.id;
        const uid = req.query.uid;
        let vote = req.body;
        let sql = "insert into `vote`(`id`, `uid`, `vote_time`) VALUES (?,?,?)";
        sql = mysql_1.default.format(sql, [
            id,
            uid,
            vote.vote_time,
        ]);
        dbConnect_1.conn.query(sql, (err, result) => {
            if (err)
                throw err;
            res.status(201).json({ affected_row: result.affectedRows, last_idx: result.insertId });
        });
    }
    // res.status(200).send('Data inserted successfully'); 
    // res.status(201).json(body);
    // res.send("Method POST in vote.ts with " + JSON.stringify(body));
});
exports.router.delete("/", (req, res) => {
    if (req.query.vid) {
        const vid = req.query.vid;
        let sql = 'delete from vote where vid = ?';
        dbConnect_1.conn.query(sql, [vid], (err, result) => {
            if (err)
                throw err;
            res.status(200).json({
                affected_row: result.affectedRows
            });
        });
    }
});
exports.router.put("/", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // Receive data
    const vid = req.query.vid;
    let vote = req.body;
    // Get original data from table by id
    let sql = 'select * from vote where vid = ?';
    sql = mysql_1.default.format(sql, [sql]);
    // Query and wait for result
    const result = yield (0, dbConnect_1.queryPromise)(sql);
    const jsonStr = JSON.stringify(result);
    const JsonObj = JSON.parse(jsonStr);
    const dataOriginal = JsonObj[0];
    // Merge new data to original
    const updatevote = Object.assign(Object.assign({}, dataOriginal), vote);
    sql =
        "update  `vote` set `vote_time`=? where `vid`=?";
    sql = mysql_1.default.format(sql, [
        updatevote.vote_time,
        vid
    ]);
    dbConnect_1.conn.query(sql, (err, result) => {
        if (err)
            throw err;
        // Return result
        res.status(200).json({
            affected_row: result.affectedRows
        });
    });
}));

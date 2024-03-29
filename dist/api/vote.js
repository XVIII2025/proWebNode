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
exports.router.get("/rank", (req, res) => {
    const uid = req.query.uid;
    const currentTime = new Date();
    const currentTimeString = currentTime.toISOString().slice(0, 19).replace('T', ' ');
    let sql = "SELECT * FROM vote WHERE uid = ? AND vote_time < ? ORDER BY vote_time DESC LIMIT 1";
    dbConnect_1.conn.query(sql, [uid, currentTimeString], (err, result) => {
        if (err) {
            console.error(err);
            res.status(500).json({ error: "Internal Server Error" });
            return;
        }
        // ตรวจสอบว่ามีผลลัพธ์หรือไม่
        if (result.length > 0) {
            const maxVote = result[0];
            res.json(maxVote);
        }
        else {
            res.status(404).json({ error: "ไม่พบข้อมูลที่ตรงตามเงื่อนไข" });
        }
    });
});
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
    const id = req.query.id || 1; // ถ้าไม่มีค่า id ส่งมาให้ใช้ค่าว่าง
    const uid = req.query.uid;
    const score = Number(req.query.score);
    const rank = Number(req.query.rank);
    if (req.body) {
        let vote = req.body;
        let sql = "insert into `vote`(`id`, `uid`, `vote_time`, `update_score`, `rank`) VALUES (?,?,?,?,?)";
        sql = mysql_1.default.format(sql, [
            id,
            uid,
            vote.vote_time,
            score,
            rank
        ]);
        dbConnect_1.conn.query(sql, (err, result) => {
            if (err)
                throw err;
            res.status(201).json({ affected_row: result.affectedRows, last_idx: result.insertId });
        });
    }
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
        "update  `vote` set `vote_time`=?, `update_score`=?, `rank`=? where `vid`=?";
    sql = mysql_1.default.format(sql, [
        updatevote.vote_time,
        updatevote.update_score,
        updatevote.rank,
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

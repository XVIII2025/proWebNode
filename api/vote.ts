import express from "express"
import { conn, queryPromise } from "../dbConnect";
import { VoteResponse } from "./model/vote_res";
import mysql from "mysql"

export const router = express.Router();

router.get("/rank", (req, res) => {
    const uid = req.query.uid;
    const currentTime: Date = new Date();
    const currentTimeString: string = currentTime.toISOString().slice(0, 19).replace('T', ' ');

    let sql = "SELECT * FROM vote WHERE uid = ? AND vote_time < ? ORDER BY vote_time DESC LIMIT 1";

    conn.query(sql, [uid, currentTimeString], (err, result) => {
        if (err) {
            console.error(err);
            res.status(500).json({ error: "Internal Server Error" });
            return;
        }
        
        // ตรวจสอบว่ามีผลลัพธ์หรือไม่
        if (result.length > 0) {
            const maxVote = result[0];
            res.json(maxVote);
        } else {
            res.status(404).json({ error: "ไม่พบข้อมูลที่ตรงตามเงื่อนไข" });
        }
    });
});

router.get("/all", (req, res) => {
    const sql = "select * from vote";
    conn.query(sql, (err, result)=>{
        if(err){
            res.json(err);
        }else {
            res.json(result);
        }
    })
})

router.get("/", (req, res) => {
    if (req.query.vid) {
        const vid = req.query.vid;
        const sql = "select * from vote where vid = ?";
        conn.query(sql, [vid], (err, result)=>{
            if(err){
                res.json(err);
            }else {
                res.json(result);
            }
        })
      } else {
        res.send("no id");
      }
});

router.post("/", (req, res) => {
    const id = req.query.id || 1; // ถ้าไม่มีค่า id ส่งมาให้ใช้ค่าว่าง
    const uid = req.query.uid;
    const score = Number(req.query.score);
    const rank = Number(req.query.rank);
    
    if (req.body) {
        let vote: VoteResponse = req.body;
        let sql = 
        "insert into `vote`(`id`, `uid`, `vote_time`, `update_score`, `rank`) VALUES (?,?,?,?,?)";

        sql = mysql.format(sql, [
            id,
            uid,
            vote.vote_time,
            score,
            rank
          ]);
        conn.query(sql, (err, result) => {
            if (err) throw err;
            res.status(201).json({ affected_row: result.affectedRows, last_idx: result.insertId });
        });
    }
});

router.delete("/", (req, res) => {
    if (req.query.vid) {
        const vid = req.query.vid;
        let sql = 'delete from vote where vid = ?';
        conn.query(sql, [vid], (err, result)=>{
            if (err) throw err;
            res.status(200).json({
                affected_row : result.affectedRows
            });
        });
    }
});

router.put("/", async (req, res)=>{
    // Receive data
    const vid = req.query.vid;
    let vote : VoteResponse = req.body;

    // Get original data from table by id
    let sql = 'select * from vote where vid = ?';
    sql = mysql.format(sql, [sql]);

    // Query and wait for result
    const result = await queryPromise(sql);
    const jsonStr = JSON.stringify(result);
    const JsonObj = JSON.parse(jsonStr);
    const dataOriginal : VoteResponse = JsonObj[0];

    // Merge new data to original
    const updatevote = {...dataOriginal, ...vote};

    sql = 
    "update  `vote` set `vote_time`=?, `update_score`=?, `rank`=? where `vid`=?";
    sql = mysql.format(sql, [
        updatevote.vote_time,
        updatevote.update_score,
        updatevote.rank,
        vid
    ]);

    conn.query(sql, (err, result)=>{
        if(err) throw err;
        // Return result
        res.status(200).json({
            affected_row : result.affectedRows
        });
    });

});
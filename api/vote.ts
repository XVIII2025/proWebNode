import express from "express"
import { conn, queryPromise } from "../dbConnect";
import { VoteResponse } from "./model/vote_res";
import mysql from "mysql"

export const router = express.Router();

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
    const id = req.query.id || ''; // ถ้าไม่มีค่า id ส่งมาให้ใช้ค่าว่าง
    const uid = req.query.uid;
    
    if (req.body) {
        let vote: VoteResponse = req.body;
        let sql = 
        "insert into `vote`(`id`, `uid`, `vote_time`) VALUES (?,?,?)";

        sql = mysql.format(sql, [
            id,
            uid,
            vote.vote_time,
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
    "update  `vote` set `vote_time`=? where `vid`=?";
    sql = mysql.format(sql, [
        updatevote.vote_time,
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
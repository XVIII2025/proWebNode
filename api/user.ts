import express from "express";
import { conn, queryPromise } from "../dbConnect";
import { UserResponse } from "./model/user_res";
import mysql from "mysql"
import * as bcrypt from 'bcrypt';

export const router = express.Router();

router.post("/login", async (req, res) => {
    try {
      let user: UserResponse = req.body;
      const email = user.email;
      const password = user.password;
  
      // ใช้ Promise เพื่อรอให้ query เสร็จสิ้น
      const queryResult = await new Promise((resolve, reject) => {
        conn.query("SELECT * from user WHERE email = ?", email, (err, result) => {
          if (err) {
            reject(err);
          } else {
            resolve(result);
          }
        });
      }) as any[];
  
      // ตรวจสอบว่ามีผู้ใช้หรือไม่
      if (queryResult.length === 0) {
        return res.status(400).send({ message: "User not found" });
      }
  
      const matchedUser = queryResult[0];
  
      // เปรียบเทียบรหัสผ่าน
      const match = await bcrypt.compare(password, matchedUser.password);
  
      if (!match) {
        return res.status(400).send({ message: "Invalid email or password" });
      }
  
      res.send({ message: "Login successful", id: matchedUser.id });
    } catch (error) {
      console.error("Error during login:", error);
      res.status(500).send({ message: "Internal Server Error" });
    }
});

router.get("/all", (req, res) => {
    const sql = "select * from user";
    conn.query(sql, (err, result)=>{
        if(err){
            res.json(err);
        }else {
            res.json(result);
        }
    })
})

router.get("/", (req, res) => {
    if (req.query.id) {
        const id = req.query.id;
        const sql = "select * from user where id = ?";
        conn.query(sql, [id], (err, result)=>{
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
    if (req.body) {
        const role = "user";
        const currentDate = new Date().toLocaleString('en-US', { timeZone: 'Asia/Bangkok', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
        const dateObject = new Date(currentDate);
        const formattedDate = `${dateObject.getFullYear()}-${(dateObject.getMonth() + 1).toString().padStart(2, '0')}-${dateObject.getDate().toString().padStart(2, '0')} ${dateObject.getHours().toString().padStart(2, '0')}:${dateObject.getMinutes().toString().padStart(2, '0')}:${dateObject.getSeconds().toString().padStart(2, '0')}`;
    
        console.log(formattedDate);
    
        const defaultProfile = "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png"
        let user: UserResponse = req.body;
        const saltRounds = 10;
    
        // ใช้ Promise เพื่อจัดการ asynchronous
        const hashPassword = (password: string): Promise<string> => {
            return new Promise((resolve, reject) => {
                bcrypt.hash(password, saltRounds, (err, hash) => {
                    if (err) {
                        console.error('Error during password hashing:', err);
                        reject(err);
                    } else {
                        console.log('Hashed password:', hash);
                        resolve(hash);
                    }
                });
            });
        };
    
        // ใช้ async/await ในการรอ hashPassword เสร็จสิ้น
        (async () => {
            try {
                const HashedPass = await hashPassword(user.password);
    
                let sql = "INSERT INTO `user` (`username`, `email`, `password`, `profile_image`, `role`, `start_date`) VALUES (?,?,?,?,?,?)";
                sql = mysql.format(sql, [user.username, user.email, HashedPass, defaultProfile, role, formattedDate]);
    
                conn.query(sql, (err, result) => {
                    if (err) throw err;
                    res.status(201).json({ affected_row: result.affectedRows, last_idx: result.insertId });
                });
            } catch (error) {
                // จัดการข้อผิดพลาดที่เกิดจาก hashPassword
                console.error('Error during user creation:', error);
                res.status(500).json({ error: 'Internal Server Error' });
            }
        })();
    }
    
    // res.status(200).send('Data inserted successfully'); 
    // res.status(201).json(body);
    // res.send("Method POST in user.ts with " + JSON.stringify(body));
});

router.delete("/", (req, res) => {
    if (req.query.id) {
        const id = req.query.id;
        let sql = 'delete from user where id = ?';
        conn.query(sql, [id], (err, result)=>{
            if (err) throw err;
            res.status(200).json({
                affected_row : result.affectedRows
            });
        });
    }
});

router.put("/", async (req, res)=>{
    // Receive data
    const id = req.query.id;
    let user : UserResponse = req.body;

    // Get original data from table by id
    let sql = 'select * from user where id = ?';
    sql = mysql.format(sql, [sql]);

    // Query and wait for result
    const result = await queryPromise(sql);
    const jsonStr = JSON.stringify(result);
    const JsonObj = JSON.parse(jsonStr);
    const dataOriginal : UserResponse = JsonObj[0];

    // Merge new data to original
    const updateUser = {...dataOriginal, ...user};

    sql = 
    "update  `user` set `username`=?, `email`=?, `password`=?, `profile_image`=?, `role`=?, `start_date`=? where `id`=?";
    sql = mysql.format(sql, [
        updateUser.username,
        updateUser.email,
        updateUser.password,
        updateUser.profile_image,
        updateUser.role,
        updateUser.start_date,
        id
    ]);

    conn.query(sql, (err, result)=>{
        if(err) throw err;
        // Return result
        res.status(200).json({
            affected_row : result.affectedRows
        });
    });

});
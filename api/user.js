"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
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
const bcrypt = __importStar(require("bcrypt"));
exports.router = express_1.default.Router();
exports.router.post("/login", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        let user = req.body;
        const email = user.email;
        const password = user.password;
        // ใช้ Promise เพื่อรอให้ query เสร็จสิ้น
        const queryResult = yield new Promise((resolve, reject) => {
            dbConnect_1.conn.query("SELECT * from user WHERE email = ?", email, (err, result) => {
                if (err) {
                    reject(err);
                }
                else {
                    resolve(result);
                }
            });
        });
        // ตรวจสอบว่ามีผู้ใช้หรือไม่
        if (queryResult.length === 0) {
            return res.status(400).send({ message: "User not found" });
        }
        const matchedUser = queryResult[0];
        // เปรียบเทียบรหัสผ่าน
        const match = yield bcrypt.compare(password, matchedUser.password);
        if (!match) {
            return res.status(400).send({ message: "Invalid email or password" });
        }
        res.send({ message: "Login successful" });
    }
    catch (error) {
        console.error("Error during login:", error);
        res.status(500).send({ message: "Internal Server Error" });
    }
}));
exports.router.get("/all", (req, res) => {
    const sql = "select * from user";
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
    if (req.query.id) {
        const id = req.query.id;
        const sql = "select * from user where id = ?";
        dbConnect_1.conn.query(sql, [id], (err, result) => {
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
        const role = "user";
        const currentDate = new Date().toLocaleString('en-US', { timeZone: 'Asia/Bangkok', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
        const dateObject = new Date(currentDate);
        const formattedDate = `${dateObject.getFullYear()}-${(dateObject.getMonth() + 1).toString().padStart(2, '0')}-${dateObject.getDate().toString().padStart(2, '0')} ${dateObject.getHours().toString().padStart(2, '0')}:${dateObject.getMinutes().toString().padStart(2, '0')}:${dateObject.getSeconds().toString().padStart(2, '0')}`;
        console.log(formattedDate);
        const defaultProfile = "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png";
        let user = req.body;
        const saltRounds = 10;
        // ใช้ Promise เพื่อจัดการ asynchronous
        const hashPassword = (password) => {
            return new Promise((resolve, reject) => {
                bcrypt.hash(password, saltRounds, (err, hash) => {
                    if (err) {
                        console.error('Error during password hashing:', err);
                        reject(err);
                    }
                    else {
                        console.log('Hashed password:', hash);
                        resolve(hash);
                    }
                });
            });
        };
        // ใช้ async/await ในการรอ hashPassword เสร็จสิ้น
        (() => __awaiter(void 0, void 0, void 0, function* () {
            try {
                const HashedPass = yield hashPassword(user.password);
                let sql = "INSERT INTO `user` (`username`, `email`, `password`, `profile_image`, `role`, `start_date`) VALUES (?,?,?,?,?,?)";
                sql = mysql_1.default.format(sql, [user.username, user.email, HashedPass, defaultProfile, role, formattedDate]);
                dbConnect_1.conn.query(sql, (err, result) => {
                    if (err)
                        throw err;
                    res.status(201).json({ affected_row: result.affectedRows, last_idx: result.insertId });
                });
            }
            catch (error) {
                // จัดการข้อผิดพลาดที่เกิดจาก hashPassword
                console.error('Error during user creation:', error);
                res.status(500).json({ error: 'Internal Server Error' });
            }
        }))();
    }
    // res.status(200).send('Data inserted successfully'); 
    // res.status(201).json(body);
    // res.send("Method POST in user.ts with " + JSON.stringify(body));
});
exports.router.delete("/", (req, res) => {
    if (req.query.id) {
        const id = req.query.id;
        let sql = 'delete from user where id = ?';
        dbConnect_1.conn.query(sql, [id], (err, result) => {
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
    const id = req.query.id;
    let user = req.body;
    // Get original data from table by id
    let sql = 'select * from user where id = ?';
    sql = mysql_1.default.format(sql, [sql]);
    // Query and wait for result
    const result = yield (0, dbConnect_1.queryPromise)(sql);
    const jsonStr = JSON.stringify(result);
    const JsonObj = JSON.parse(jsonStr);
    const dataOriginal = JsonObj[0];
    // Merge new data to original
    const updateUser = Object.assign(Object.assign({}, dataOriginal), user);
    sql =
        "update  `user` set `username`=?, `email`=?, `password`=?, `profile_image`=?, `role`=?, `start_date`=? where `id`=?";
    sql = mysql_1.default.format(sql, [
        updateUser.username,
        updateUser.email,
        updateUser.password,
        updateUser.profile_image,
        updateUser.role,
        updateUser.start_date,
        id
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

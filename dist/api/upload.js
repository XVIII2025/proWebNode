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
const multer_1 = __importDefault(require("multer"));
const app_1 = require("firebase/app");
const storage_1 = require("firebase/storage");
exports.router = express_1.default.Router();
exports.router.get("/all", (req, res) => {
    const sql = "select * from upload";
    dbConnect_1.conn.query(sql, (err, result) => {
        if (err) {
            res.json(err);
        }
        else {
            res.json(result);
        }
    });
});
exports.router.get("/byId", (req, res) => {
    const id = req.query.id;
    const sql = "select * from upload where id = ?";
    dbConnect_1.conn.query(sql, [id], (err, result) => {
        if (err) {
            res.json(err);
        }
        else {
            res.json(result);
        }
    });
});
exports.router.get("/", (req, res) => {
    if (req.query.uid) {
        const uid = req.query.uid;
        const sql = "select * from upload where uid = ?";
        dbConnect_1.conn.query(sql, [uid], (err, result) => {
            if (err) {
                res.json(err);
            }
            else {
                res.json(result);
            }
        });
    }
    else {
        res.send("no uid");
    }
});
exports.router.post("/", (req, res) => {
    if (req.body) {
        const id = req.query.id;
        const defaultScore = 100;
        let upload = req.body;
        let sql = "insert into `upload`(`id`, `image`, `score`) VALUES (?,?,?)";
        sql = mysql_1.default.format(sql, [
            id,
            upload.image,
            defaultScore
        ]);
        dbConnect_1.conn.query(sql, (err, result) => {
            if (err)
                throw err;
            res.status(201).json({ affected_row: result.affectedRows, last_idx: result.insertId });
        });
    }
    // res.status(200).send('Data inserted successfully'); 
    // res.status(201).json(body);
    // res.send("Method POST in upload.ts with " + JSON.stringify(body));
});
exports.router.delete("/", (req, res) => {
    if (req.query.uid) {
        const uid = req.query.uid;
        let sql = 'delete from upload where uid = ?';
        dbConnect_1.conn.query(sql, [uid], (err, result) => {
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
    const uid = req.query.uid;
    const score = Number(req.query.score);
    let upload = req.body;
    // Get original data from table by id
    let sql = 'select * from upload where uid = ?';
    sql = mysql_1.default.format(sql, [sql]);
    // Query and wait for result
    const result = yield (0, dbConnect_1.queryPromise)(sql);
    const jsonStr = JSON.stringify(result);
    const JsonObj = JSON.parse(jsonStr);
    const dataOriginal = JsonObj[0];
    // Merge new data to original
    const updateupload = Object.assign(Object.assign({}, dataOriginal), upload);
    sql =
        `
        UPDATE upload
        SET
            image = COALESCE(NULLIF(?, ''), image),
            score = COALESCE(NULLIF(?, ''), score)
        WHERE
            uid = ?;
        `;
    sql = mysql_1.default.format(sql, [
        updateupload.image,
        score,
        uid
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
// Connect to Firebase Storage
const firebaseConfig = {
    apiKey: "AIzaSyCClor_zCx9vRrqNpoWy6WeeASruPCMZeM",
    authDomain: "projectweb2-2.firebaseapp.com",
    projectId: "projectweb2-2",
    storageBucket: "projectweb2-2.appspot.com",
    messagingSenderId: "358881643268",
    appId: "1:358881643268:web:c93766d9df03aabd5bde51",
    measurementId: "G-HM9JJMEL4W"
};
const firebaseApp = (0, app_1.initializeApp)(firebaseConfig);
const storage = (0, storage_1.getStorage)(firebaseApp);
// Upload file
class fileMiddleware {
    constructor() {
        this.filename = "";
        this.diskLoader = (0, multer_1.default)({
            storage: multer_1.default.memoryStorage(),
            limits: {
                fileSize: 67108864, // 64 MByteileSize:
            },
        });
    }
}
const fileUpload = new fileMiddleware();
exports.router.post("/uploadImg", fileUpload.diskLoader.single("file"), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.file) {
            throw new Error("No file uploaded");
        }
        const filename = Date.now() + "-" + Math.round(Math.random() * 10000) + ".png";
        const storageRef = (0, storage_1.ref)(storage, "/images/" + filename);
        const metadata = {
            contentType: req.file.mimetype,
        };
        const snapshot = yield (0, storage_1.uploadBytesResumable)(storageRef, req.file.buffer, metadata);
        const url = yield (0, storage_1.getDownloadURL)(snapshot.ref);
        res.status(200).json({
            image: url,
        });
        // res.status(200).send(url);
    }
    catch (error) {
        console.error("Error:", error.message);
        res.status(500).json({
            error: error.message,
        });
    }
}));

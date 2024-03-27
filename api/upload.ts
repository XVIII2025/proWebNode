import express from "express"
import { conn, queryPromise } from "../dbConnect";
import { UploadResponse } from "./model/upload_res";
import mysql from "mysql"
import multer from "multer";
import { initializeApp } from "firebase/app";
import {
    getStorage,
    ref,
    uploadBytesResumable,
    getDownloadURL,
} from "firebase/storage";

export const router = express.Router();

router.get("/all", (req, res) => {
    const sql = "select * from upload";
    conn.query(sql, (err, result)=>{
        if(err){
            res.json(err);
        }else {
            res.json(result);
        }
    })
})

router.get("/byId", (req, res) => {
    const id = req.query.id;
    const sql = "select * from upload where id = ?";
    conn.query(sql, [id], (err, result)=>{
        if(err){
            res.json(err);
        }else {
            res.json(result);
        }
    })
})

router.get("/", (req, res) => {
    if (req.query.uid) {
        const uid = req.query.uid;
        const sql = "select * from upload where uid = ?";
        conn.query(sql, [uid], (err, result)=>{
            if(err){
                res.json(err);
            }else {
                res.json(result);
            }
        })
      } else {
        res.send("no uid");
      }
});

router.post("/", (req, res) => {
    if (req.body) {
        const id = req.query.id;
        const defaultScore = 100;
        let upload: UploadResponse = req.body;
        let sql = 
        "insert into `upload`(`id`, `image`, `score`) VALUES (?,?,?)";

        sql = mysql.format(sql, [
            id,
            upload.image,
            defaultScore
          ]);
        conn.query(sql, (err, result) => {
            if (err) throw err;
            res.status(201).json({ affected_row: result.affectedRows, last_idx: result.insertId });
        });
    }
    // res.status(200).send('Data inserted successfully'); 
    // res.status(201).json(body);
    // res.send("Method POST in upload.ts with " + JSON.stringify(body));
});

router.delete("/", (req, res) => {
    if (req.query.uid) {
        const uid = req.query.uid;
        let sql = 'delete from upload where uid = ?';
        conn.query(sql, [uid], (err, result)=>{
            if (err) throw err;
            res.status(200).json({
                affected_row : result.affectedRows
            });
        });
    }
});

router.put("/", async (req, res)=>{
    // Receive data
    const uid = req.query.uid;
    const score = Number(req.query.score);
    let upload : UploadResponse = req.body;

    // Get original data from table by id
    let sql = 'select * from upload where uid = ?';
    sql = mysql.format(sql, [sql]);

    // Query and wait for result
    const result = await queryPromise(sql);
    const jsonStr = JSON.stringify(result);
    const JsonObj = JSON.parse(jsonStr);
    const dataOriginal : UploadResponse = JsonObj[0];

    // Merge new data to original
    const updateupload = {...dataOriginal, ...upload};

    sql = 
            `
        UPDATE upload
        SET
            image = COALESCE(NULLIF(?, ''), image),
            score = COALESCE(NULLIF(?, ''), score)
        WHERE
            uid = ?;
        `;
    
    sql = mysql.format(sql, [
        updateupload.image,
        score,
        uid
    ]);

    conn.query(sql, (err, result)=>{
        if(err) throw err;
        // Return result
        res.status(200).json({
            affected_row : result.affectedRows
        });
    });

});

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

const firebaseApp = initializeApp(firebaseConfig);
const storage = getStorage(firebaseApp);

// Upload file
class fileMiddleware {
    filename = "";
    public readonly diskLoader = multer({
        storage: multer.memoryStorage(),
        limits: {
            fileSize: 67108864, // 64 MByteileSize:
        },
    });
}

const fileUpload = new fileMiddleware();
router.post("/uploadImg", fileUpload.diskLoader.single("file"), async (req, res) => {

    try {
        if (!req.file) {
            throw new Error("No file uploaded");
        }

        const filename =
            Date.now() + "-" + Math.round(Math.random() * 10000) + ".png";
        const storageRef = ref(storage, "/images/" + filename);
        const metadata = {
            contentType: req.file.mimetype,
        };
        const snapshot = await uploadBytesResumable(
            storageRef,
            req.file.buffer,
            metadata
        );

        const url = await getDownloadURL(snapshot.ref);
        res.status(200).json({
            image: url,
        });
        // res.status(200).send(url);

    } catch (error: any) {
        console.error("Error:", error.message);
        res.status(500).json({
            error: error.message,
        });
    }
});

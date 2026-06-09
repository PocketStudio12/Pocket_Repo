const express = require("express");
const cors = require("cors");
const multer = require("multer");
const fs = require("fs");
const path = require("path");

const app = express();
app.use(cors());
app.use(express.json());

// static files (uploads serve)
app.use("/uploads", express.static("uploads"));
app.use(express.static("."));
const SONG_FILE = "songs.json";
const CAT_FILE = "categories.json";

if (!fs.existsSync(SONG_FILE)) fs.writeFileSync(SONG_FILE, "[]");
if (!fs.existsSync(CAT_FILE)) fs.writeFileSync(CAT_FILE, JSON.stringify(["Bengali","Hindi"]));

// storage setup
const storage = multer.diskStorage({
  destination: (req,file,cb)=>{
    if(file.mimetype.startsWith("image"))
      cb(null,"uploads/images");
    else
      cb(null,"uploads/songs");
  },
  filename:(req,file,cb)=>{
    cb(null,Date.now()+"-"+file.originalname);
  }
});

const upload = multer({storage});

function getSongs(){
  return JSON.parse(fs.readFileSync(SONG_FILE));
}

function saveSongs(d){
  fs.writeFileSync(SONG_FILE,JSON.stringify(d,null,2));
}

/* ===== CATEGORIES ===== */
app.get("/api/categories",(req,res)=>{
  res.json(JSON.parse(fs.readFileSync(CAT_FILE)));
});

app.post("/api/category/create",(req,res)=>{
  let c = JSON.parse(fs.readFileSync(CAT_FILE));
  c.push(req.body.name);
  fs.writeFileSync(CAT_FILE,JSON.stringify(c,null,2));
  res.json({ok:true});
});

/* ===== SONG UPLOAD (FILE + LINK) ===== */
app.post(
"/api/song/upload",
upload.fields([
  {name:"imageFile"},
  {name:"musicFile"}
]),
(req,res)=>{

let songs = getSongs();

let image = req.body.imageLink || "";
let music = req.body.musicLink || "";

/* file override */
if(req.files.imageFile)
  image = "http://localhost:3000/uploads/images/" + req.files.imageFile[0].filename;

if(req.files.musicFile)
  music = "http://localhost:3000/uploads/songs/" + req.files.musicFile[0].filename;

songs.push({
  id:Date.now(),
  name:req.body.name,
  singer:req.body.singer,
  category:req.body.category,
  image,
  music
});

saveSongs(songs);

res.json({ok:true});
});

/* ===== SONG LIST ===== */
app.get("/api/songs",(req,res)=>{
  res.json(getSongs());
});

/* ===== DELETE ===== */
app.delete("/api/song/:id",(req,res)=>{
  let songs = getSongs();
  songs = songs.filter(s=>s.id!=req.params.id);
  saveSongs(songs);
  res.json({ok:true});
});

/* ===== SEARCH ===== */
app.get("/api/search",(req,res)=>{
  let q = (req.query.q||"").toLowerCase();
  let songs = getSongs();
  res.json(songs.filter(s=>s.name.toLowerCase().includes(q)));
});

app.listen(3000,()=>{
  console.log("Music API running");
});

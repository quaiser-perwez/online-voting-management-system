const express = require("express");
const router = express.Router();
const Admin = require("../models/admin");
const Candidate = require("../models/candidate");

router.get("/admin", (req,res)=>{
  res.render("adminLogin");
});

router.post("/admin-login", async (req,res)=>{
  const {username,password} = req.body;
  const admin = await Admin.findOne({username,password});
  if(admin){
    const candidates = await Candidate.find();
    res.render("dashboard",{candidates});
  } else {
    res.send("Invalid Login");
  }
});

router.post("/add-candidate", async (req,res)=>{
  await Candidate.create({name:req.body.name});
  res.redirect("/admin");
});

module.exports = router;
const express = require("express");
const router = express.Router();
const Voter = require("../models/Voter");
const Candidate = require("../models/Candidate");

router.get("/", (req,res)=>{
  res.render("index");
});

router.get("/voter", (req,res)=>{
  res.render("voterLogin");
});

router.post("/voter-login", async (req,res)=>{
  const voter = await Voter.findOne({email:req.body.email});
  if(voter && !voter.hasVoted){
    const candidates = await Candidate.find();
    res.render("vote",{candidates,voter});
  } else {
    res.send("Already voted or Invalid user");
  }
});

router.post("/vote/:id", async (req,res)=>{
  const voter = await Voter.findById(req.body.voterId);
  if(voter.hasVoted) return res.send("Already voted");

  await Candidate.findByIdAndUpdate(req.params.id, {$inc:{votes:1}});
  voter.hasVoted = true;
  await voter.save();

  res.send("Vote Successful");
});

module.exports = router;
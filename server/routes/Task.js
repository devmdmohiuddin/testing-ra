const express = require("express");
const router = express.Router();
const taskCtrl = require("../controllers/Task");

router.get("/", taskCtrl.getAll);
router.post("/", taskCtrl.create);
router.delete("/:id", taskCtrl.delete);

module.exports = router;

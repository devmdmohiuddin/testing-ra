const express = require("express");
const router = express.Router();
const builderCtrl = require("../controllers/Builder");

router.get("/", builderCtrl.getAll);
router.post("/", builderCtrl.create);
router.delete("/:id", builderCtrl.delete);

module.exports = router;

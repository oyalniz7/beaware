"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const assetController_1 = require("../controllers/assetController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// All asset routes protected
router.use(auth_1.authenticateToken);
router.get('/', assetController_1.getAssets);
router.get('/:id', assetController_1.getAssetById);
router.post('/', assetController_1.createAsset);
router.put('/:id', assetController_1.updateAsset);
router.delete('/:id', assetController_1.deleteAsset);
exports.default = router;

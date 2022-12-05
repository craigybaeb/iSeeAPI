const express = require('express');
const router = express.Router()
const cbr_cycle_ctrl = require('../controllers/cbr_cycle');
const { isCompanyUsecase } = require('../middlewares/validateCompany');

// Similar to update Query of an intent
router.post('/:id/persona/:personaId/intent/:intentId', [isCompanyUsecase], cbr_cycle_ctrl.query);


module.exports = router;
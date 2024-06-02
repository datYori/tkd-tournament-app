const express = require('express');
const router = express.Router();
const participantController = require('../controllers/participantController');

router.get('/', participantController.getAllParticipants);
router.post('/', participantController.addParticipant);
router.post('/bulk', participantController.addMultipleParticipants);
router.delete('/:id', participantController.deleteParticipant);
router.put('/:id', participantController.updateParticipant);

module.exports = router;

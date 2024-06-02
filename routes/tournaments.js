const express = require('express');
const router = express.Router();
const tournamentController = require('../controllers/tournamentController');

router.post('/', tournamentController.createTournament);
router.get('/:id', tournamentController.getTournamentById);
router.put('/:tournamentId/matches/:matchId', tournamentController.updateMatchResult);
router.get('/', tournamentController.listTournaments);
router.delete('/:id', tournamentController.deleteTournament);
router.put('/:tournamentId', tournamentController.updateTournament);

module.exports = router;

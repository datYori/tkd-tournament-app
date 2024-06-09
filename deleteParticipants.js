const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api/participants'; // Change this to your actual API base URL

async function deleteAllParticipants() {
  try {
    // Step 1: List all participants
    const response = await axios.get(BASE_URL);
    const participants = response.data;

    // Step 2: Loop over each participant and delete them
    for (const participant of participants) {
      await axios.delete(`${BASE_URL}/${participant._id}`);
      console.log(`Deleted participant with ID: ${participant._id}`);
    }

    console.log('All participants have been deleted.');
  } catch (error) {
    console.error('Error deleting participants:', error);
  }
}

deleteAllParticipants();

const axios = require('axios');

// Read the number of participants from the command line
const numParticipants = parseInt(process.argv[2], 10);

// Validate the number of participants
if (isNaN(numParticipants) || numParticipants <= 0) {
  console.error('Please provide a valid number of participants as an argument.');
  process.exit(1); // Exit the script with an error code
}

// Define the age categories and corresponding weight categories for each gender
const categories = {
  'Benjamins': { years: [2017, 2016], weights: { m: ['-20kg', '-22kg', '-24kg', '-26kg', '-29kg', '-32kg', '-35kg', '-38kg', '-41kg', '+41kg'], f: ['-20kg', '-22kg', '-24kg', '-26kg', '-29kg', '-32kg', '-35kg', '-38kg', '-41kg', '+41kg'] }},
  'Minims': { years: [2015, 2014, 2013], weights: { m: ['-28kg', '-30kg', '-32kg', '-35kg', '-38kg', '-41kg', '-45kg', '-49kg', '-53kg', '+53kg'], f: ['-28kg', '-30kg', '-32kg', '-35kg', '-38kg', '-41kg', '-45kg', '-49kg', '-53kg', '+53kg'] }},
  'Cadette': { years: [2012, 2011, 2010], weights: { m: ['-33kg', '-37kg', '-41kg', '-45kg', '-49kg', '-53kg', '-57kg', '-61kg', '-65kg', '+65kg'], f: ['-29kg', '-33kg', '-37kg', '-41kg', '-44kg', '-47kg', '-51kg', '-55kg', '-59kg', '+59kg'] }},
  'Junior': { years: [2009, 2008, 2007], weights: { m: ['-45kg', '-48kg', '-51kg', '-55kg', '-59kg', '-63kg', '-68kg', '-73kg', '-78kg', '+78kg'], f: ['-42kg', '-44kg', '-46kg', '-49kg', '-52kg', '-55kg', '-59kg', '-63kg', '-68kg', '+68kg'] }},
  'Senior': { years: [2006, 2005, 2004, 2003, 2002, 2001, 2000, 1999, 1998, 1997, 1996], weights: { m: ['-54kg', '-58kg', '-63kg', '-68kg', '-74kg', '-80kg', '-87kg', '+87kg'], f: ['-46kg', '-49kg', '-53kg', '-57kg', '-62kg', '-67kg', '-73kg', '+73kg'] }},
  'Masters 40+': { years: [1984, 1983, 1982, 1981, 1980, 1979, 1978, 1977, 1976, 1975], weights: { m: ['-58kg', '-68kg', '-80kg', '+80kg'], f: ['-49kg', '-57kg', '-67kg', '+67kg'] }},
  'Masters 50+': { years: [1974, 1973, 1972, 1971, 1970, 1969, 1968], weights: { m: ['-58kg', '-68kg', '-80kg', '+80kg'], f: ['-49kg', '-57kg', '-67kg', '+67kg'] }}
};

// Function to determine age category based on year
function getAgeCategory(year) {
  for (const category in categories) {
    if (categories[category].years.includes(year)) {
      return category;
    }
  }
  return null;
}

// Track the counts of participants by combination of gender, weightCategory, ageCategory, and kupCategory
const participantCounts = {};

// Generate a random participant
function generateParticipant() {
  const gender = Math.random() > 0.5 ? 'm' : 'f';
  let year = 1985 + Math.floor(Math.random() * (2017 - 1968));
  let ageCategory = getAgeCategory(year);

  while (!ageCategory) {
    year = 1985 + Math.floor(Math.random() * (2017 - 1968));
    ageCategory = getAgeCategory(year);
  }

  const weightOptions = categories[ageCategory].weights[gender];
  const weightCategory = weightOptions[Math.floor(Math.random() * weightOptions.length)];
  const kupCategory = Math.random() > 0.5 ? 'A' : 'B';

  const key = `${gender}-${weightCategory}-${ageCategory}-${kupCategory}`;
  if (!participantCounts[key]) {
    participantCounts[key] = 0;
  }

  if (participantCounts[key] >= 12) {
    return null; // Skip creating a new participant if the limit is reached
  }

  participantCounts[key]++;

  return {
    name: `Player${Math.floor(Math.random() * 10000)}`,
    gender: gender,
    weightCategory: weightCategory,
    ageCategory: ageCategory,
    kupCategory: kupCategory
  };
}

// Post the participants to the API
async function postParticipants(num) {
  let createdParticipants = 0;

  while (createdParticipants < num) {
    const participant = generateParticipant();
    if (participant) {
      try {
        const response = await axios.post('http://localhost:3000/api/participants', participant);
        console.log(`Participant created: ID ${response.data._id}`);
        createdParticipants++;
      } catch (error) {
        console.error('Error posting participant', error);
      }
    }
  }
}

postParticipants(numParticipants);

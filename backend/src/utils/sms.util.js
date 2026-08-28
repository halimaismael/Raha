// Point d'intégration SMS — À BRANCHER sur un vrai fournisseur (Twilio, ou un
// agrégateur SMS comorien) une fois que vous aurez un compte chez eux.
// Tant que ce n'est pas fait, cette fonction se contente de logguer le message
// (aucun SMS n'est réellement envoyé).
async function sendSms(phoneNumber, message) {
  // TODO: remplacer par l'appel réel à votre fournisseur SMS, par exemple avec Twilio :
  //
  // const twilio = require('twilio')(process.env.TWILIO_SID, process.env.TWILIO_AUTH_TOKEN);
  // await twilio.messages.create({ to: phoneNumber, from: process.env.TWILIO_FROM, body: message });

  console.log(`[SMS simulé] À: ${phoneNumber} — ${message}`);
}

module.exports = { sendSms };

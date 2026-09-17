// Envoi de SMS — stub à brancher sur un agrégateur SMS comorien réel
// (ex: Comores Telecom, HURI, ou un fournisseur international comme Twilio)
// en remplaçant le bloc "TODO" ci-dessous par le véritable appel API.
// En attendant, l'envoi est journalisé côté serveur sans jamais faire
// échouer l'action métier qui l'a déclenché (comportement "best-effort",
// cohérent avec la façon dont ce fichier est utilisé dans notify.util.js).

async function sendSms(to, message) {
  if (!to || !message) return { sent: false, reason: 'missing to/message' };

  if (!process.env.SMS_API_URL || !process.env.SMS_API_KEY) {
    console.log(`[SMS non configuré] à ${to} : ${message}`);
    return { sent: false, reason: 'SMS provider not configured' };
  }

  try {
    // TODO: remplacer par l'appel réel à l'agrégateur SMS comorien
    // const response = await fetch(process.env.SMS_API_URL + '/send', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.SMS_API_KEY}` },
    //   body: JSON.stringify({ to, message }),
    // });
    console.log(`[SMS] à ${to} : ${message}`);
    return { sent: true };
  } catch (err) {
    console.error('Erreur envoi SMS:', err.message);
    return { sent: false, reason: err.message };
  }
}

module.exports = { sendSms };

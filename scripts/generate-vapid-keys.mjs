// Génère une paire de clés VAPID pour les notifications Web Push.
// Usage : npm run generate-vapid
// Copier les valeurs affichées dans .env.local (voir .env.example).

import webpush from "web-push";

const keys = webpush.generateVAPIDKeys();

console.log("\nClés VAPID générées — à copier dans .env.local :\n");
console.log(`NEXT_PUBLIC_VAPID_PUBLIC_KEY=${keys.publicKey}`);
console.log(`VAPID_PRIVATE_KEY=${keys.privateKey}\n`);

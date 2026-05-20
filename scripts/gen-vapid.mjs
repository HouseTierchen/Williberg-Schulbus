// Einmaliges Generieren der VAPID-Schluessel fuer Web-Push.
// Aufruf: node scripts/gen-vapid.mjs
import webpush from "web-push";

const keys = webpush.generateVAPIDKeys();
console.log("VAPID_PUBLIC_KEY=" + keys.publicKey);
console.log("VAPID_PRIVATE_KEY=" + keys.privateKey);
console.log("VAPID_SUBJECT=mailto:kanzlei@wiliberg.ch");
console.log("\nBitte in .env eintragen.");

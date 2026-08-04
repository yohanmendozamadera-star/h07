self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

// Handler vacío: solo satisface el criterio de instalabilidad de Chrome (debe
// existir un fetch handler registrado). No cachea nada a propósito — esta app
// es dinámica y multi-tenant con datos financieros reales; cachear mal podría
// mostrar información vieja o de otra empresa.
self.addEventListener("fetch", () => {});

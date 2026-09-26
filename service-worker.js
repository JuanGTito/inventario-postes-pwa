const CACHE_NAME = "inventario-postes-v1";

const ARCHIVOS = [

"./",
"./index.html",
"./style.css",
"./app.js",
"./manifest.json"

];


// Instalar aplicación

self.addEventListener(
"install",
evento=>{

evento.waitUntil(

caches.open(CACHE_NAME)
.then(cache=>{

return cache.addAll(ARCHIVOS);

})

);

});



// Cargar archivos guardados

self.addEventListener(
"fetch",
evento=>{

evento.respondWith(

caches.match(evento.request)
.then(respuesta=>{

return respuesta ||
fetch(evento.request);

})

);

});
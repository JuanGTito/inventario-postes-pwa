let db;
let registros = [];
let gpsActual = "";
let fotoActual = "";
let editando = null;


// CREAR BASE DE DATOS

let request = indexedDB.open("InventarioPostesDB", 2);


request.onupgradeneeded = function(e){

    db = e.target.result;

    if(!db.objectStoreNames.contains("postes")){

        db.createObjectStore("postes", {
            keyPath:"id",
            autoIncrement:true
        });

    }

};



request.onsuccess = function(e){

    db = e.target.result;

    cargarRegistros();

};



// ================= GPS =================


function obtenerGPS(){


if(!navigator.geolocation){

alert("GPS no disponible");

return;

}


navigator.geolocation.getCurrentPosition(

function(pos){


gpsActual =
pos.coords.latitude.toFixed(6)
+
", "
+
pos.coords.longitude.toFixed(6);



document.getElementById("ubicacion").innerHTML =

"📍 GPS: "
+
gpsActual;



},


function(){

alert(
"No se pudo obtener ubicación. Activa permisos GPS."
);

},


{
enableHighAccuracy:true,
timeout:15000
}


);


}




// ================= FOTO =================


function capturarFoto(){

document.getElementById("foto").click();

}



document.getElementById("foto").onchange=function(e){


let archivo=e.target.files[0];


if(!archivo)return;



let lector=new FileReader();



lector.onload=function(){

fotoActual=lector.result;

};



lector.readAsDataURL(archivo);



};






// ================= GUARDAR =================


function guardarPoste(){


let datos={


proyecto:
document.getElementById("proyecto").value,


etapa:
document.getElementById("etapa").value,


sector:
document.getElementById("sector").value,


numero:
document.getElementById("numeroPoste").value,


brazo:
document.getElementById("brazo").checked
?"SI":"NO",


clevis:
document.getElementById("clevis").checked
?"SI":"NO",


aislador:
document.getElementById("aislador").checked
?"SI":"NO",


cajaNap:
document.getElementById("cajaNap").checked
?"SI":"NO",


color:
document.getElementById("color").value,


gps:gpsActual,


foto:fotoActual,


fecha:
new Date().toLocaleString()


};




let transaccion =
db.transaction(
["postes"],
"readwrite"
);


let tabla =
transaccion.objectStore("postes");




if(editando){


datos.id=editando;

tabla.put(datos);


editando=null;


}else{


tabla.add(datos);


}



transaccion.oncomplete=function(){


limpiar();

cargarRegistros();


alert("Registro guardado");


};



}





// ================= LEER =================



function cargarRegistros(){



let transaccion =
db.transaction(
["postes"],
"readonly"
);



let tabla =
transaccion.objectStore("postes");



let lista=[];



tabla.openCursor().onsuccess=function(e){


let cursor=e.target.result;


if(cursor){


lista.push(cursor.value);

cursor.continue();



}else{


registros=lista;

mostrarRegistros();

actualizarResumen();


}



};


}





// ================= MOSTRAR =================


function mostrarRegistros(){



let cuerpo =
document.getElementById("tablaPostes");



let texto =
document.getElementById("buscar")
.value
.toLowerCase();



cuerpo.innerHTML="";



registros

.filter(p=>

p.numero.toLowerCase().includes(texto)

||

p.etapa.toLowerCase().includes(texto)

||

p.sector.toLowerCase().includes(texto)

)



.forEach(p=>{


cuerpo.innerHTML += `


<tr>


<td>${p.etapa}</td>


<td>${p.sector}</td>


<td>${p.numero}</td>



<td>

Brazo: ${p.brazo}<br>

Clevis: ${p.clevis}<br>

Aislador: ${p.aislador}<br>

NAP: ${p.cajaNap}<br>

Color: ${p.color}

</td>



<td>${p.gps}</td>



<td>

${p.foto ?

"<img class='foto' src='"+p.foto+"'>"

:

"Sin foto"

}


</td>



<td>


<button
class="btn-editar"
onclick="editar(${p.id})">

Editar

</button>


<button
class="btn-eliminar"
onclick="eliminar(${p.id})">

Eliminar

</button>



</td>



</tr>


`;



});



}





// ================= ELIMINAR =================



function eliminar(id){


if(confirm("¿Eliminar registro?")){


let tx =
db.transaction(
["postes"],
"readwrite"
);



tx.objectStore("postes")
.delete(id);



tx.oncomplete=function(){

cargarRegistros();

};



}



}





// ================= EDITAR =================


function editar(id){


let p =
registros.find(
x=>x.id==id
);



document.getElementById("proyecto").value=p.proyecto;

document.getElementById("etapa").value=p.etapa;

document.getElementById("sector").value=p.sector;

document.getElementById("numeroPoste").value=p.numero;


document.getElementById("brazo").checked=p.brazo=="SI";

document.getElementById("clevis").checked=p.clevis=="SI";

document.getElementById("aislador").checked=p.aislador=="SI";

document.getElementById("cajaNap").checked=p.cajaNap=="SI";


document.getElementById("color").value=p.color;


gpsActual=p.gps;

fotoActual=p.foto;


editando=id;


window.scrollTo(0,0);


}






// ================= LIMPIAR =================



function limpiar(){


document.getElementById("numeroPoste").value="";

document.getElementById("brazo").checked=false;

document.getElementById("clevis").checked=false;

document.getElementById("aislador").checked=false;

document.getElementById("cajaNap").checked=false;


gpsActual="";

fotoActual="";


document.getElementById("ubicacion").innerHTML=
"GPS pendiente";


}






// ================= RESUMEN =================



function actualizarResumen(){


document.getElementById("resumen").innerHTML=

"Total registros: "
+
registros.length;


}





// ================= EXCEL =================


function exportarExcel(){


let datos = registros.map(p=>{


return {


Proyecto:p.proyecto,

Etapa:p.etapa,

Sector:p.sector,

Poste:p.numero,

Brazo:p.brazo,

Clevis:p.clevis,

Aislador:p.aislador,

Caja_NAP:p.cajaNap,

Color:p.color,

GPS:p.gps,

Fecha:p.fecha


};



});



let hoja =
XLSX.utils.json_to_sheet(datos);



let libro =
XLSX.utils.book_new();



XLSX.utils.book_append_sheet(
libro,
hoja,
"Inventario"
);



XLSX.writeFile(
libro,
"Inventario_Postes.xlsx"
);



}






// ================= PDF =================



function exportarPDF(){



const {jsPDF}=window.jspdf;



let pdf =
new jsPDF();



pdf.text(
"Reporte Inventario de Postes",
10,
10
);



let filas =
registros.map(p=>[

p.etapa,

p.sector,

p.numero,

p.brazo,

p.clevis,

p.aislador,

p.cajaNap,

p.gps

]);



pdf.autoTable({


startY:20,


head:[[

"Etapa",
"Sector",
"Poste",
"Brazo",
"Clevis",
"Aislador",
"NAP",
"GPS"

]],


body:filas


});



pdf.save(
"Reporte_Postes.pdf"
);



}
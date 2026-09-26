let registros = [];
let gpsActual = "";
let fotoActual = "";
let editando = null;


// Base de datos local
const request = indexedDB.open("InventarioPostesDB", 1);


request.onupgradeneeded = function(e){

    let db = e.target.result;

    if(!db.objectStoreNames.contains("postes")){

        db.createObjectStore("postes", {
            keyPath:"id",
            autoIncrement:true
        });

    }

};


request.onsuccess = function(e){

    window.db = e.target.result;

    cargarRegistros();

};



// Obtener GPS

function obtenerGPS(){

    if(!navigator.geolocation){

        alert("El dispositivo no tiene GPS");

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
            "📍 GPS: " + gpsActual;


        },


        function(){

            alert(
            "No se pudo obtener GPS. Activa permisos de ubicación."
            );

        },

        {
            enableHighAccuracy:true,
            timeout:10000
        }

    );

}



// Cámara

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





// Guardar

function guardarPoste(){


let poste={

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


fecha:new Date().toLocaleString()

};





let tx=db.transaction(
["postes"],
"readwrite"
);


let store=tx.objectStore("postes");



if(editando){

poste.id=editando;

store.put(poste);

editando=null;


}else{


store.add(poste);


}



tx.oncomplete=function(){

limpiarFormulario();

cargarRegistros();

alert("Registro guardado");

};


}




// Cargar registros

function cargarRegistros(){


let tx=db.transaction(
["postes"],
"readonly"
);


let store=tx.objectStore("postes");


let datos=[];


store.openCursor().onsuccess=function(e){


let cursor=e.target.result;


if(cursor){

datos.push(cursor.value);

cursor.continue();


}else{


registros=datos;

mostrarRegistros();


}


};


}





function mostrarRegistros(){


let tabla=
document.getElementById("tablaPostes");


let buscar=
document.getElementById("buscar").value
.toLowerCase();



tabla.innerHTML="";


registros

.filter(p=>
p.numero.toLowerCase()
.includes(buscar)
)

.forEach(p=>{


tabla.innerHTML += `


<tr>

<td>
${p.numero}
</td>


<td>

Brazo: ${p.brazo}<br>

Clevis: ${p.clevis}<br>

Aislador: ${p.aislador}<br>

NAP: ${p.cajaNap}<br>

${p.color}

${p.foto?
"<br><img class='foto' src='"+p.foto+"'>"
:""}

</td>


<td>
${p.gps}
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





// Eliminar

function eliminar(id){


if(confirm("¿Eliminar registro?")){


let tx=db.transaction(
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





// Editar

function editar(id){


let p=registros.find(
x=>x.id===id
);



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





function limpiarFormulario(){

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





// PDF

function exportarPDF(){


const {jsPDF}=window.jspdf;


let pdf=new jsPDF();



pdf.text(
"Inventario de Postes",
10,
10
);



let filas=registros.map(p=>[

p.numero,
p.brazo,
p.clevis,
p.aislador,
p.cajaNap,
p.color,
p.gps

]);



pdf.autoTable({

head:[[
"Poste",
"Brazo",
"Clevis",
"Aislador",
"NAP",
"Color",
"GPS"
]],


body:filas


});



pdf.save(
"Inventario_Postes.pdf"
);


}





// Excel

function exportarExcel(){


let hoja=
XLSX.utils.json_to_sheet(
registros
);



let libro=
XLSX.utils.book_new();



XLSX.utils.book_append_sheet(
libro,
hoja,
"Postes"
);



XLSX.writeFile(
libro,
"Inventario_Postes.xlsx"
);


}
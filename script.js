const DateTime = luxon.DateTime

class Libro{
    constructor(img, titulo, autor, genero, paginas, update, estado, verMas) {
        this.img = img
        this.titulo = titulo
        this.autor = autor
        this.genero = genero
        this.paginas = paginas
        this.update = update
        this.estado = estado
        this.verMas = verMas
    }
}


let arrayLibros = []
if(localStorage.getItem('libros') !== null) {
    arrayLibros = JSON.parse(localStorage.getItem('libros'))
} 

let formulario = document.getElementById("idForm")

formulario.addEventListener('submit', (e) => {
    e.preventDefault()
    let datForm = new FormData(formulario)
    let estadoLibro = formulario.querySelector('input[name=estadoLibro]:checked').value
    const now = DateTime.now()
    let fechaActual = now.toLocaleString()
    let tituloLibro = datForm.get("libro").toLowerCase()
    let tituloLibroQuery = tituloLibro.replace(/ /g, "_")
    fetch(`https://www.googleapis.com/books/v1/volumes?q=${tituloLibroQuery}&key=AIzaSyCvF_g4SBakVPdyfC_pgwC2dyxzHx761Wk`)
    .then(response => response.json())
    .then(data => {
        let dataLibro = data.items[0].volumeInfo
        let imgLibro;
        try {
            imgLibro = dataLibro.imageLinks.smallThumbnail
        } catch {
            console.error("NO ENCONTRADO")
        }
        let libro = new Libro(imgLibro, dataLibro.title, dataLibro.authors, dataLibro.categories, dataLibro.pageCount, fechaActual, estadoLibro, dataLibro.infoLink)
        arrayLibros.push(libro)
        localStorage.setItem('libros', JSON.stringify(arrayLibros))
    })
    Toastify({
        text: "Libro añadido exitosamente",
        duration: 3000
        }).showToast();
    formulario.reset()
})

let botonColeccion = document.getElementById("btnMostrarColeccion")
let coleccionLibros = document.getElementById("coleccionLibros")
let barraDeProgreso = document.getElementById("progressBar")
let sectionFiltros = document.getElementById("seccionFiltros")

function showArray() {
    coleccionLibros.innerHTML = ' '
    barraDeProgreso.innerHTML = ' '
    seccionFiltros.innerHTML = ' '
    arrayLibros.forEach((libro, indice) => { 
        coleccionLibros.innerHTML += `
        <div class="card h-105 p-0 col-4" id="libro${indice}" style="width: 20rem">
            <div class="card-header">
                <span class="badge bg-${libro.estado == "leido" ? "success" : "secondary"}">${libro.estado.toUpperCase()}</span>
            </div>
            <div class="card-body">
                <div class="text-center mb-2">
                    <img src="${libro.img}" onerror="this.src='img/notFound.png'"></img>
                </div>
                <h2 class="card-title"><u>${libro.titulo}</u></h5>
                <h5 class="card-text">Autor: ${libro.autor}</h3>
                <h5 class="card-text">Género: ${libro.genero}</h3>
                <p><small>Cantidad de páginas: ${libro.paginas}</small></p>
            </div>
            <div class="mx-5 mb-2 text-center gap-2">
                <a href="${libro.verMas}"><button class="btn btn-sm btn-info" target="_blank"> Ver Más </button></a>
                <button class="btn btn-sm btn-danger btnEliminar" id="btnRemoveCard${indice}">Eliminar</button>
            </div>
            <div class="card-footer">
                <small class="text-muted">Añadido el ${libro.update}</small>
            </div>
        </div>`

        if (libro.estado == "por leer") {
            document.getElementById(`libro${indice}`).style["border"] = "2px solid #ff0000"
        } else if (libro.estado == "leido") {
            document.getElementById(`libro${indice}`).style["border"] = "2px solid #008209"
        }
    })

    // Porcentaje leidos
    let filtroLeidos = arrayLibros.filter(libro => libro.estado == "leido")
    let numeroLeidos = filtroLeidos.length
    let numeroTotalColeccion = arrayLibros.length
    let porcentajeProgresoLectura = (numeroLeidos/numeroTotalColeccion) * 100
    barraDeProgreso.innerHTML += `
    <h4>Progreso de lecturas</h4>
    <div class="progress">
        <div class="progress-bar progress-bar-striped progress-bar-animated" role="progressbar" aria-valuenow="50" aria-valuemin="0" aria-valuemax="100" style="width: ${porcentajeProgresoLectura}%;"></div>
    </div>
    `

    // BOTONES FILTROS
    sectionFiltros.innerHTML += `
    <label><strong>Filtros</strong></label>
    <div class="btn-group ml-5" role="group" aria-label="Basic example">
        <button type="button" class="btn btn-secondary" id="filtroAlfabetico">Orden Alfabético</button>
        <button type="button" class="btn btn-secondary" id="filtroLectura">Estado de lectura</button>
    </div>
    `

}


/*
function eliminarLibro(libro){
    arrayLibros.findIndex(arrLibros => )
}
*/

// MOSTRAR COLECCIÓN
botonColeccion.addEventListener ('click', () => {
    showArray()

    // FILTRAR COLECCIÓN 
    // A a Z
    let botonFiltroAlfabetico = document.getElementById("filtroAlfabetico")

    botonFiltroAlfabetico.addEventListener('click', () => {
        coleccionLibros.innerHTML = ' '
        arrayLibros.sort(function(a, b){
            if(a.titulo < b.titulo) { return -1; }
            if(a.titulo > b.titulo) { return 1; }
            return 0;
        })
        showArray()
    })

    // ESTADO LECTURA
    let botonFiltroLectura = document.getElementById("filtroLectura")

    botonFiltroLectura.addEventListener('click', () => {
        coleccionLibros.innerHTML = ' '
        arrayLibros.sort(function(a,b) {
            if(a.estado < b.estado) {return 1;}
            if(a.estado > b.estado) {return -1;} 
            return 0;
        })
        showArray()
    })
})

// ELIMINAR COLECCION
let botonEliminarColeccion = document.getElementById("btnEliminarColeccion")

botonEliminarColeccion.addEventListener('click', () => {
    swal({
        title: "¿Estás seguro?",
        text: "Una vez eliminada, no se podrá recuperar la colección",
        icon: "warning",
        buttons: true,
        dangerMode: true,
      })
      .then((willDelete) => {
        if (willDelete) {
            swal("¡Colección eliminada!", {
                icon: "success",
            })
            localStorage.removeItem('libros')
            setTimeout(function(){location.reload()}, 2500)
        }
    })
})





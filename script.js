const DateTime = luxon.DateTime

class Libro{
    constructor(isbn13, img, titulo, autor, genero, paginas, update, estado, verMas) {
        this.isbn13 = isbn13
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
        if (arrayLibros.some(librosArray => librosArray.titulo == dataLibro.title)) {
            console.log("LIBRO YA EN COLECCIÓN")
            swal("LIBRO YA EN COLECCIÓN", "Agregue otro título por favor", "error");
        } else {
            let isbn13 = dataLibro.industryIdentifiers.find(e => e.type == "ISBN_13")['identifier']
            let libro = new Libro(isbn13, imgLibro, dataLibro.title, dataLibro.authors, dataLibro.categories, dataLibro.pageCount, fechaActual, estadoLibro, dataLibro.infoLink)
            arrayLibros.push(libro)
            localStorage.setItem('libros', JSON.stringify(arrayLibros))  
            Toastify({
                text: "¡Libro añadido exitosamente!",
                duration: 3000
            }).showToast();
        }
        formulario.reset()
    }
)})

let botonColeccion = document.getElementById("btnMostrarColeccion")
let coleccionLibros = document.getElementById("coleccionLibros")
let barraDeProgreso = document.getElementById("progressBar")
let sectionFiltros = document.getElementById("seccionFiltros")

function showArray(array) {
    coleccionLibros.innerHTML = ' '
    barraDeProgreso.innerHTML = ' '
    seccionFiltros.innerHTML = ' '
    array.forEach((libro, indice) => { 
        coleccionLibros.innerHTML += `
        <div class="card h-105 p-0 col-4" id="libro${indice}" style="width: 20rem">
            <div class="card-header d-flex justify-content-between">
                <span class="badge bg-${libro.estado == "leido" ? "success" : "secondary"}">${libro.estado.toUpperCase()}</span>
            </div>
            <div class="card-body" id="bodyLibro">
                <div class="text-center mb-2">
                    <img src="${libro.img}" onerror="this.src='img/notFound.png'"></img>
                </div>
                <h3 class="card-title"><u>${libro.titulo}</u></h5>
                <h5 class="card-text">Autor: ${libro.autor}</h3>
                <h5 class="card-text">Género: ${libro.genero}</h3>
                <p><small>Cantidad de páginas: ${libro.paginas}<br>
                ISBN13: ${libro.isbn13}</small></p>
            </div>
            <div class="mx-5 mb-2 text-center gap-3">
                <a href="${libro.verMas}" target="_blank"><button class="btn btn-sm btn-info"> Ver Más </button></a>
                <button class="btn btn-sm btn-danger btnEliminar" id="btnRemoveCard${indice}">Eliminar</button>
            </div>
            <div class="card-footer">
                <small class="text-muted">Añadido el ${libro.update}</small>
            </div>
        </div>`

        if (libro.estado == "por leer") {
            document.getElementById(`libro${indice}`).classList.add("pendingBook")
            let bodyLibro = document.getElementById("bodyLibro")
            bodyLibro.innerHTML = `
                ${bodyLibro.innerHTML}
                <button class="btn btn-sm btn-success btnChangeStatus" id="btnChangeStatus${indice}"><i class="fa-solid fa-check"></i>\tCambiar a Leido </button>
                `
            let botonCambiarEstado = document.getElementsByClassName('btnChangeStatus')
            for (let i=0; i<botonCambiarEstado.length; i++) {
                botonCambiarEstado[i].addEventListener('click', (e) => {
                    let indexLibro = e.target.id.replace('btnChangeStatus', '')
                    swal({
                        title: "¿Desea cambiar el estado de este libro?",
                        text: "Este cambio no podrá ser deshecho",
                        icon: "info",
                        buttons: true,
                        dangerMode: false,
                    })
                    .then((willDelete) => {
                        if (willDelete) {
                            arrayLibros[indexLibro].estado = 'leido'
                            showArray(arrayLibros)
                            localStorage.setItem('libros', JSON.stringify(arrayLibros))  
                        }
                    })    
                })
            }
        } else if (libro.estado == "leido") {
            document.getElementById(`libro${indice}`).classList.add("doneBook")
        }

    })
    
    // ELIMINAR LIBRO DE COLECCIÓN (ind.)
    let botonesEliminar = document.getElementsByClassName('btnEliminar')
    for (let i=0; i<botonesEliminar.length; i++) {
        botonesEliminar[i].addEventListener('click', (e) => {
            let indexLibro = e.target.id.replace('btnRemoveCard', '')
            console.log(e.target.parentNode)
            swal({
                title: "¿Estás seguro que desea eliminar este libro?",
                icon: "warning",
                buttons: true,
                dangerMode: true,
            })
            .then((willDelete) => {
                if (willDelete) {
                    swal("¡Libro eliminado!", {
                        icon: "success",
                    })
                    arrayLibros.splice(indexLibro, 1)
                    localStorage.setItem('libros', JSON.stringify(arrayLibros))
                    showArray(arrayLibros)
                }
            })    
        })
    }

    // PORCENTAJE LEIDOS
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
    <div class="btn-group" role="group" aria-label="Basic example">
        <button type="button" class="btn btn-outline-primary" id="filtroAlfabetico">Orden Alfabético</button>
        <button type="button" class="btn btn-outline-primary" id="filtroLectura">Estado de lectura</button>
    </div>
    `
        // FILTRAR COLECCIÓN 
    // A a Z
    let botonFiltroAlfabetico = document.getElementById("filtroAlfabetico")
    
    function filterByAlphabeticalOrder(array) {
        let filteredArray = arrayLibros.sort(function(a,b) {
            if(a.titulo < b.titulo) {return -1;}
            if(a.titulo > b.titulo) {return 1;} 
            return 0;
        })
        return filteredArray
    }

    botonFiltroAlfabetico.addEventListener('click', () => {
        coleccionLibros.innerHTML = ' '
        let arrayFilteredByAlphabeticalOrder = filterByAlphabeticalOrder(arrayLibros) 
        showArray(arrayFilteredByAlphabeticalOrder)
    })
    
    // ESTADO LECTURA
    let botonFiltroLectura = document.getElementById("filtroLectura")
    
    function filterByStatus(array) {
        let filteredArray = array.sort(function(a,b) {
        if(a.estado < b.estado) {return 1;}
        if(a.estado > b.estado) {return -1;} 
        return 0;
        })
        return filteredArray
    }

    botonFiltroLectura.addEventListener('click', () => {
        coleccionLibros.innerHTML = ' '
        let arrayFilteredByStatus = filterByStatus(arrayLibros)
        showArray(arrayFilteredByStatus)
    })
}

// MOSTRAR COLECCIÓN
botonColeccion.addEventListener ('click', () => {
    showArray(arrayLibros)
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




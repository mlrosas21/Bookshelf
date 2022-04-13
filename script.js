const DateTime = luxon.DateTime

class Libro{
    constructor(isbn13, img, title, author, genre, pageNum, update, status, moreInfo) {
        this.isbn13 = isbn13
        this.img = img
        this.title = title
        this.author = author
        this.genre = genre
        this.pageNum = pageNum
        this.update = update
        this.status = status
        this.moreInfo = moreInfo
    }
}

// Assign localStorage saved values if they exist; create new array if not
let bookArray = []
if(localStorage.getItem('libros') !== null) {
    bookArray = JSON.parse(localStorage.getItem('libros'))
}

// Adding Book to array. Info fetched using Google Books API.
let formulario = document.getElementById("idForm")

formulario.addEventListener('submit', (e) => {
    e.preventDefault()
    let datForm = new FormData(formulario)
    let bookStatus = formulario.querySelector('input[name=bookStatus]:checked').value
    const now = DateTime.now()
    let fechaActual = now.toLocaleString()
    let titleLibro = datForm.get("libro").toLowerCase()
    let titleLibroQuery = titleLibro.replace(/ /g, "_")
    fetch(`https://www.googleapis.com/books/v1/volumes?q=${titleLibroQuery}&key=AIzaSyCvF_g4SBakVPdyfC_pgwC2dyxzHx761Wk`)
    .then(response => response.json())
    .then(data => {
        let dataLibro = data.items[0].volumeInfo
        let imgLibro;
        try {
            imgLibro = dataLibro.imageLinks.smallThumbnail
        } catch {
            console.error("NO ENCONTRADO")
        }
        if (bookArray.some(librosArray => librosArray.title == dataLibro.title)) {
            console.log("LIBRO YA EN COLECCIÓN")
            swal("LIBRO YA EN COLECCIÓN", "Agregue otro título por favor", "error");
        } else {
            let isbn13 = dataLibro.industryIdentifiers.find(e => e.type == "ISBN_13")['identifier']
            let libro = new Libro(isbn13, imgLibro, dataLibro.title, dataLibro.authors, dataLibro.categories, dataLibro.pageCount, fechaActual, bookStatus, dataLibro.infoLink)
            bookArray.push(libro)
            localStorage.setItem('libros', JSON.stringify(bookArray))  
            Toastify({
                text: "¡Libro añadido exitosamente!",
                duration: 3000
            }).showToast();
        }
        formulario.reset()
        showArray(bookArray)
    }
)})

let showCollectionBtn = document.getElementById("btnMostrarColeccion")
let bookCollection = document.getElementById("coleccionLibros")
let progressBar = document.getElementById("progressBar")
let filterSection = document.getElementById("seccionFiltros")

function bookStatusSetter(array) {
    array.forEach((libro, indice) => {
        if (libro.status == "por leer") {
            document.getElementById(`libro${indice}`).classList.add("pendingBook")
            let bodyLibro = document.getElementById(`bodyLibro${indice}`)
            bodyLibro.innerHTML = `
            ${bodyLibro.innerHTML}
            <button class="btn btn-sm btn-success btnChangeStatus" value="${indice}"><i class="fa-solid fa-check"></i>\tCambiar a Leido </button>`
        } else if (libro.status == "leido") {
            document.getElementById(`libro${indice}`).classList.add("doneBook")
        }
    })
}

function renderArray(array) {
    array.forEach((libro, indice) => { 
        bookCollection.innerHTML += `
        <div class="card h-105 p-0 col-4" id="libro${indice}" style="width: 20rem">
            <div class="card-header d-flex justify-content-between">
                <span class="badge bg-${libro.status == "leido" ? "success" : "secondary"}">${libro.status.toUpperCase()}</span>
            </div>
            <div class="card-body" id="bodyLibro${indice}">
                <div class="text-center mb-2">
                    <img src="${libro.img}" onerror="this.src='img/notFound.png'"></img>
                </div>
                <h3 class="card-title"><u>${libro.title}</u></h5>
                <h5 class="card-text">Autor: ${libro.author}</h3>
                <h5 class="card-text">Género: ${libro.genre}</h3>
                <p><small>Cantidad de páginas: ${libro.pageNum}<br>
                ISBN13: ${libro.isbn13}</small></p>
            </div>
            <div class="mx-5 mb-2 text-center gap-3" id="cardBtns">
                <a href="${libro.moreInfo}" target="_blank"><button class="btn btn-sm btn-info"> Ver Más </button></a>
                <button class="btn btn-sm btn-danger btnEliminar" value="${indice}">Eliminar</button>
            </div>
            <div class="card-footer">
                <small class="text-muted">Añadido el ${libro.update}</small>
            </div>
        </div>`

        libro.status == "por leer" ? document.getElementById(`libro${indice}`).classList.add("pendingBook") : document.getElementById(`libro${indice}`).classList.add("doneBook")  
    })
}

function showArray(array) {
    bookCollection.innerHTML = ' '
    progressBar.innerHTML = ' '
    renderArray(array)
    let changeStatusBtn = document.getElementsByClassName('btnChangeStatus')
    for (let i=0; i<changeStatusBtn.length; i++) {
        changeStatusBtn[i].addEventListener('click', (e) => {
            let indexLibro = e.target.id.replace('btnChangeStatus', '')
            console.log(indexLibro)
            swal({
                title: "¿Desea cambiar el status de este libro?",
                text: "Este cambio no podrá ser deshecho",
                icon: "info",
                buttons: true,
                dangerMode: false,
            })
            .then((willDelete) => {
                if (willDelete) {
                    bookArray[indexLibro].status = 'leido'
                    showArray(bookArray)
                    localStorage.setItem('libros', JSON.stringify(bookArray))  
                }
            })    
        })
    }
    
    // ELIMINAR LIBRO DE COLECCIÓN (ind.)
    let botonesEliminar = document.getElementsByClassName('btnEliminar')
    for (let i=0; i<botonesEliminar.length; i++) {
        botonesEliminar[i].addEventListener('click', (e) => {
            console.log(e.target.value)
            let indexLibro = e.target.value
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
                    array.splice(indexLibro, 1)
                    localStorage.setItem('libros', JSON.stringify(bookArray))
                    showArray(bookArray)
                }
            })   
        })
    }

    // PORCENTAJE LEIDOS
    let filtroLeidos = bookArray.filter(libro => libro.status == "leido")
    let numeroLeidos = filtroLeidos.length
    let numeroTotalColeccion = bookArray.length
    let porcentajeProgresoLectura = (numeroLeidos/numeroTotalColeccion) * 100
    progressBar.innerHTML += `
    <h4>Progreso de lecturas</h4>
    <div class="progress">
        <div class="progress-bar progress-bar-striped progress-bar-animated" role="progressbar" aria-valuenow="50" aria-valuemin="0" aria-valuemax="100" style="width: ${porcentajeProgresoLectura}%;"></div>
    </div>
    `

    // BOTONES FILTROS
    /*
    filterSection.innerHTML += `
    <label><strong>Filtros</strong></label>
    <div class="btn-group" role="group" aria-label="Basic example">
        <button type="button" class="btn btn-outline-primary" id="filtroAlfabetico">Orden Alfabético</button>
        <button type="button" class="btn btn-outline-primary" id="filtroLectura">Estado de lectura</button>
    </div>
    `
    */
        // FILTRAR COLECCIÓN 
    // A a Z
    let botonFiltroAlfabetico = document.getElementById("filtroAlfabetico")
    
    function sortByAlphabeticalOrder(array) {
        let sortedArray = array.sort(function(a,b) {
            if(a.title < b.title) {return -1;}
            if(a.title > b.title) {return 1;} 
            return 0;
        })
        return sortedArray
    }

    botonFiltroAlfabetico.addEventListener('click', () => {
        bookCollection.innerHTML = ' '
        let arraySortedByAlphabeticalOrder = sortByAlphabeticalOrder(bookArray) 
        showArray(arraySortedByAlphabeticalOrder)
    })
    
    // ESTADO LECTURA
    let botonFiltroLectura = document.getElementById("filtroLectura")
    
    function filterByStatus(array) {
        let sortedArray = array.sort(function(a,b) {
        if(a.status < b.status) {return 1;}
        if(a.status > b.status) {return -1;} 
        return 0;
        })
        return sortedArray
    }

    botonFiltroLectura.addEventListener('click', () => {
        bookCollection.innerHTML = ' '
        let arraySortedByStatus = filterByStatus(bookArray)
        showArray(arraySortedByStatus)
    })
}

showArray(bookArray)

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

let changeStatusBtn = document.getElementsByClassName('btnChangeStatus')
for (let i=0; i<changeStatusBtn.length; i++) {
    changeStatusBtn[i].addEventListener('click', (e) => {
        let indexLibro = e.target.id.replace('btnChangeStatus', '')
        console.log(indexLibro)
        swal({
            title: "¿Desea cambiar el status de este libro?",
            text: "Este cambio no podrá ser deshecho",
            icon: "info",
            buttons: true,
            dangerMode: false,
        })
        .then((willDelete) => {
            if (willDelete) {
                bookArray[indexLibro].status = 'leido'
                showArray(bookArray)
                localStorage.setItem('libros', JSON.stringify(bookArray))  
            }
        })    
    })
}

// BUSCADOR
let searchForm = document.getElementById('searchForm')

searchForm.addEventListener('submit', (e) => {
    e.preventDefault()
    let datForm = new FormData(searchForm)
    let searchInput = datForm.get('searchInput')
    let foundArray = bookArray.filter(book => book.title.toLowerCase().includes(searchInput.toLowerCase()))
    showArray(foundArray)
})



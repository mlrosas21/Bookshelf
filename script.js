const DateTime = luxon.DateTime

class Libro{
    constructor(isbn13, img, title, author, genre, pageNum, update, status, moreInfo, titleString) {
        this.isbn13 = isbn13
        this.img = img
        this.title = title
        this.author = author
        this.genre = genre
        this.pageNum = pageNum
        this.update = update
        this.status = status
        this.moreInfo = moreInfo
        this.titleString = titleString
    }
}

const showCollectionBtn = document.getElementById("btnMostrarColeccion")
const bookCollection = document.getElementById("coleccionLibros")
const progressBar = document.getElementById("progressBar")
const filterSection = document.getElementById("seccionFiltros")

// Assign localStorage saved values if they exist; create new array if not
let bookArray = []
if(localStorage.getItem('libros') !== null) {
    bookArray = JSON.parse(localStorage.getItem('libros'))
}

showArray(bookArray)
addRemoveBtns()

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
            let libro = new Libro(isbn13, imgLibro, dataLibro.title, dataLibro.authors, dataLibro.categories, dataLibro.pageCount, fechaActual, bookStatus, dataLibro.infoLink, dataLibro.title.replace(/\s+/g, ''))
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

function showArray(array) {
    bookCollection.innerHTML = ' '
    progressBar.innerHTML = ' '
    renderArray(array) 
    addChangeStatusFunc()

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

// Search bar
let searchForm = document.getElementById('searchForm')

searchForm.addEventListener('submit', (e) => {
    e.preventDefault()
    let datForm = new FormData(searchForm)
    let searchInput = datForm.get('searchInput')
    let foundArray = bookArray.filter(book => book.title.toLowerCase().includes(searchInput.toLowerCase()))
    showArray(foundArray)
})

// Rendering array in HTML
function renderArray(array) {
    array.forEach((libro, indice) => { 
        bookCollection.innerHTML += `
        <div class="card h-105 p-0 col-4" id="libro${indice}" style="width: 20rem">
            <div class="card-header d-flex justify-content-between align-items-center" id="cardHeader${indice}">
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
                <button class="btn btn-sm btn-danger btnEliminar" value="${libro.titleString}">Eliminar</button>
            </div>
            <div class="card-footer">
                <small class="text-muted">Añadido el ${libro.update}</small>
            </div>
        </div>`

        if(libro.status == "por leer") {
            document.getElementById(`libro${indice}`).classList.add("pendingBook")
            let cardHeader = document.getElementById(`cardHeader${indice}`)
            cardHeader.innerHTML += `<span class="badge bg-success changeStatus" data-value="${libro.titleString}"><i class="fa-solid fa-check"></i> COMPLETAR </span>`

        } else{
            document.getElementById(`libro${indice}`).classList.add("doneBook")
        }
    })
}

// Funcionality of change status buttons
function addChangeStatusFunc(){
    let changeStatusSpans = document.getElementsByClassName('changeStatus')
    for(let i=0; i<changeStatusSpans.length; i++){
        changeStatusSpans[i].addEventListener('click', (e) =>{
            swal({
                title: "¿Desea cambiar el status de este libro?",
                text: "Este cambio no podrá ser deshecho",
                icon: "info",
                buttons: true,
                dangerMode: false,
            })
            .then((willDelete) => {
                if (willDelete) {
                    let index = bookArray.findIndex(book => book.titleString == e.target.dataset.value)
                    bookArray[index].status = 'leido'
                    showArray(bookArray)
                    localStorage.setItem('libros', JSON.stringify(bookArray))  
                }
            })
        })
    }
}

// Remove single book from collection
function addRemoveBtns() {
    let botonesEliminar = document.getElementsByClassName('btnEliminar')
    for (let i=0; i<botonesEliminar.length; i++) {
        botonesEliminar[i].addEventListener('click', (e) => {
            let index = bookArray.findIndex(book => book.titleString == e.target.value)
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
                    bookArray.splice(index, 1)
                    localStorage.setItem('libros', JSON.stringify(bookArray))
                    showArray(bookArray)
                }
            })   
        })
    }
}


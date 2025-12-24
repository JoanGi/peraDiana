// función para manejar el quiz del día 1
export function attachQuizHandlerDia1(container) {
    const form = container.querySelector('#quiz-form');
    if (!form) return;
    const result = container.querySelector('#result');
    const premio = container.querySelector('#premio-img');
    // evitar multiples handlers: clonamos y reemplazamos el form
    const newForm = form.cloneNode(true);
    form.parentNode.replaceChild(newForm, form);
    newForm.addEventListener('submit', function(e){
        e.preventDefault();
        const sel = newForm.opcio.value;
        if (!sel) {
            if (result) result.textContent = 'Si us plau, selecciona una opció.';
            return;
        }
        const correct = 'B';
        if (sel === correct) {
            if (result) result.textContent = 'Correcte! Aquí tens la sorpresa.';
            if (premio) premio.style.display = 'block';
        } else {
            if (result) result.textContent = 'No és correcte. Torna-ho a provar.';
            if (premio) premio.style.display = 'none';
        }
    }, false);
}

export function validateCheckmate(container) {
    // 1. Initialize a new chess game
    const game = new Chess();

    // 2. Set up a specific puzzle position using FEN 
    // This position: White Queen ready to mate on f7
    const puzzlePosition = 'r1bqkb1r/pppp1Qpp/2n2n2/4p3/2B1P3/8/PPPP1PPP/RNB1K1NR b KQkq - 0 4';
    game.load(puzzlePosition);

    const moveInput = container.querySelector('#userMove');
    const feedback = container.querySelector('#feedback');
    const submitBtn = container.querySelector('#submitBtn');

    if (!moveInput || !feedback || !submitBtn) return; // safety check

    const userMove = moveInput.value;

    // 3. Try to make the move
    const move = game.move(userMove);

    if (move === null) {
        feedback.innerHTML = "Invalid move format or illegal move.";
        feedback.className = "error";
    } else {
        // 4. Check if the resulting position is a Checkmate
        if (game.in_checkmate()) {
            feedback.innerHTML = "Correct! That is checkmate.";
            feedback.className = "success";
            submitBtn.style.display = "block"; // Show the final submit button
        } else {
            feedback.innerHTML = "Legal move, but it's not checkmate. Try again!";
            feedback.className = "error";
            game.undo(); // Reset the move so they can try again
        }
    }
}

// función para manejar el mapa y quiz del día 2
export function attachGeoHandler(container) {
    const mapDiv = container.querySelector('#geo-picker');
    const form = container.querySelector('#quiz-form');
    if (!mapDiv || !form) return;

    // comprueba Leaflet
    if (typeof L === 'undefined') {
        const result = container.querySelector('#result');
        if (result) result.textContent = 'Error: Leaflet no está cargado.';
        return;
    }

    // asegurar interacción y tamaño mínimo
    mapDiv.style.pointerEvents = 'auto';
    mapDiv.style.minHeight = '200px';

    // crear/obtener inputs ocultos para coordenadas
    let inputLat = form.querySelector('input[name="lat"]');
    let inputLng = form.querySelector('input[name="lng"]');
    if (!inputLat) { inputLat = document.createElement('input'); inputLat.type = 'hidden'; inputLat.name = 'lat'; form.appendChild(inputLat); }
    if (!inputLng) { inputLng = document.createElement('input'); inputLng.type = 'hidden'; inputLng.name = 'lng'; form.appendChild(inputLng); }

    // mostrar coordenadas
    let coordsDisplay = container.querySelector('#coords-display');
    if (!coordsDisplay) {
        coordsDisplay = document.createElement('div');
        coordsDisplay.id = 'coords-display';
        coordsDisplay.style.marginTop = '8px';
        const node = container.querySelector('.sorpresa') || container;
        node.appendChild(coordsDisplay);
    }

    // función para inicializar el mapa
    const initMap = () => {
        if (mapDiv.dataset.mapInitialized) return;
        mapDiv.dataset.mapInitialized = "1";

        console.log('Initializing map...');
        const map = L.map(mapDiv, { preferCanvas: true }).setView([20, 0], 2);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; OpenStreetMap contributors'
        }).addTo(map);

        // forzar redraw varias veces
        const invalidate = () => { try { map.invalidateSize(); } catch(e) { console.error('invalidateSize error:', e); } };
        invalidate();
        setTimeout(invalidate, 100);
        setTimeout(invalidate, 300);
        setTimeout(invalidate, 500);

        // habilitar interacciones
        try {
            map.dragging.enable();
            map.touchZoom.enable();
            map.doubleClickZoom.enable();
            map.scrollWheelZoom.enable();
        } catch(e) { console.error('Enable interactions error:', e); }

        let marker = null;
        map.on('click', function(e){
            console.log('Map clicked:', e.latlng);
            const { lat, lng } = e.latlng;
            if (marker) marker.setLatLng(e.latlng);
            else marker = L.marker(e.latlng).addTo(map);
            inputLat.value = lat.toFixed(6);
            inputLng.value = lng.toFixed(6);
            coordsDisplay.textContent = `Seleccionat: ${lat.toFixed(6)}, ${lng.toFixed(6)}`;
        });

        // attach form submit handler
        const origForm = form;
        const newForm = origForm.cloneNode(true);
        origForm.parentNode.replaceChild(newForm, origForm);
        newForm.addEventListener('submit', function(e){
            e.preventDefault();
            const selected = newForm.opcio && newForm.opcio.value;
            const result = container.querySelector('#result');
            if (!selected) {
                if (result) result.textContent = 'Si us plau, selecciona una opció.';
                return;
            }
            if (!inputLat.value || !inputLng.value) {
                if (result) result.textContent = 'Marca una ubicació al mapa abans d’enviar.';
                return;
            }
            const correct = 'C';
            const coordsText = ` Coordenades: ${inputLat.value}, ${inputLng.value}`;
            if (selected === correct) {
                if (result) result.textContent = 'Correcte! Has triat la resposta i la ubicació.' + coordsText;
                const premio = container.querySelector('#premio-img');
                if (premio) premio.style.display = 'block';
            } else {
                if (result) result.textContent = 'Resposta incorrecta; prova de nou.' + coordsText;
                const premio = container.querySelector('#premio-img');
                if (premio) premio.style.display = 'none';
            }
        }, false);
    };

    // retrasar y verificar visibilidad antes de inicializar
    const tryInit = () => {
        if (mapDiv.offsetHeight > 0 && mapDiv.offsetWidth > 0) {
            initMap();
        } else {
            console.log('Map div not visible yet, retrying...');
            setTimeout(tryInit, 100);
        }
    };
    setTimeout(tryInit, 200);
}

// fin de attachGeoHandler
// función para validar checkmate en el día 4

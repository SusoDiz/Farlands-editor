// Variables globales
let gameData = null;
let itemsData = null;
let currentSlot = 0;

document.addEventListener('DOMContentLoaded', function() {
    // Cargar información de los ítems
    fetch('assets/items.json')
        .then(response => response.json())
        .then(data => {
            itemsData = data;
            console.log('Información de ítems cargada:', itemsData);
        })
        .catch(error => {
            console.error('Error al cargar la información de los ítems:', error);
        });

    // Control del tema (claro/oscuro)
    const themeToggle = document.getElementById('theme-toggle');
    const htmlElement = document.documentElement;
    
    // Función para validar todos los campos numéricos
    function validateNumericInput(input) {
        if (!input) return;
        
        const min = parseInt(input.min);
        const max = parseInt(input.max);
        let value = parseInt(input.value) || 0;
        
        // Si el valor está fuera de los límites, ajustarlo
        if (!isNaN(min) && value < min) {
            value = min;
            input.value = value;
            showNotification(`El valor de ${input.previousElementSibling?.textContent || 'campo'} ha sido ajustado al mínimo (${min})`, 'warning');
        }
        
        if (!isNaN(max) && value > max) {
            value = max;
            input.value = value;
            showNotification(`El valor de ${input.previousElementSibling?.textContent || 'campo'} ha sido ajustado al máximo (${max})`, 'warning');
        }
        
        return value;
    }
    
    // Aplicar validación a todos los inputs numéricos
    function setupNumericValidation() {
        const numericInputs = document.querySelectorAll('input[type="number"]');
        numericInputs.forEach(input => {
            input.addEventListener('change', function() {
                validateNumericInput(this);
            });
            
            input.addEventListener('blur', function() {
                validateNumericInput(this);
            });
        });
    }
    
    // Comprobar si hay preferencia guardada en localStorage
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
        htmlElement.className = savedTheme;
        updateThemeToggleIcon(savedTheme === 'dark-mode');
    } else {
        // Comprobar preferencia del sistema
        const prefersDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
        if (prefersDarkMode) {
            htmlElement.className = 'dark-mode';
            updateThemeToggleIcon(true);
            localStorage.setItem('theme', 'dark-mode');
        }
    }
    
    // Evento para cambiar tema
    themeToggle.addEventListener('click', function() {
        const isDarkMode = htmlElement.className === 'dark-mode';
        if (isDarkMode) {
            htmlElement.className = 'light-mode';
            localStorage.setItem('theme', 'light-mode');
        } else {
            htmlElement.className = 'dark-mode';
            localStorage.setItem('theme', 'dark-mode');
        }
        updateThemeToggleIcon(!isDarkMode);
    });
    
    // Añadir validación para el combustible de la nave
    const shipCells = document.getElementById('shipCells');
    const shipActiveCells = document.getElementById('shipActiveCells');
    
    // Validar cuando cambie el combustible total
    if (shipCells) {
        shipCells.addEventListener('change', function() {
            validateShipFuel();
        });
    }
    
    // Validar cuando cambie el combustible actual
    if (shipActiveCells) {
        shipActiveCells.addEventListener('change', function() {
            validateShipFuel();
        });
    }
    
    // Función para validar que el combustible actual no sea mayor que el total
    function validateShipFuel() {
        const totalFuel = parseInt(shipCells.value) || 2;
        let currentFuel = parseInt(shipActiveCells.value) || 0;
        
        // Si el combustible actual es mayor que el total, ajustarlo
        if (currentFuel > totalFuel) {
            currentFuel = totalFuel;
            shipActiveCells.value = currentFuel;
            showNotification('Combustible actual ajustado para no exceder el máximo', 'warning');
        }
        
        // Actualizar el valor máximo del combustible actual
        shipActiveCells.max = totalFuel;
    }
    
    function updateThemeToggleIcon(isDarkMode) {
        const iconElement = themeToggle.querySelector('.toggle-icon');
        if (isDarkMode) {
            iconElement.textContent = '☀️'; // Sol para modo oscuro (cambiar a claro)
        } else {
            iconElement.textContent = '🌙'; // Luna para modo claro (cambiar a oscuro)
        }
    }

    // Elementos de carga de archivos
    const dropArea = document.getElementById('drop-area');
    const fileInput = document.getElementById('file-input');
    const fileInfo = document.getElementById('file-info');
    const editSection = document.getElementById('edit-section');
    const uploadSection = document.querySelector('.upload-section');
    const slotSelectionSection = document.getElementById('slot-selection');
    const slotsContainer = document.getElementById('slots-container');
    const currentSlotIndicator = document.getElementById('current-slot-indicator');
    
    // Elementos de pestañas
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabPanes = document.querySelectorAll('.tab-pane');
    
    // Botones de acción
    const saveBtn = document.getElementById('save-btn');
    const downloadBtn = document.getElementById('download-btn');
    
    // Notificaciones
    const notification = document.getElementById('notification');
    const notificationMessage = document.getElementById('notification-message');
    const closeNotification = document.querySelector('.close-notification');
    
    // Eventos para carga de archivos
    dropArea.addEventListener('dragover', handleDragOver);
    dropArea.addEventListener('dragleave', handleDragLeave);
    dropArea.addEventListener('drop', handleDrop);
    fileInput.addEventListener('change', handleFileSelect);
    dropArea.addEventListener('click', () => fileInput.click());
    
    // Eventos para las pestañas
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const tabId = btn.getAttribute('data-tab');
            switchTab(tabId, btn);
        });
    });
    
    // Eventos para los botones de acción
    saveBtn.addEventListener('click', saveChanges);
    downloadBtn.addEventListener('click', downloadModifiedFile);
    
    // Evento para cerrar notificaciones
    closeNotification.addEventListener('click', () => {
        notification.classList.remove('show');
    });
    
    // Añadir evento para el select de clima
    const seasonSelect = document.getElementById('season');
    if (seasonSelect) {
        seasonSelect.addEventListener('change', function() {
            // Asegurarnos de que el valor correcto esté seleccionado visualmente
            const selectedIndex = this.selectedIndex;
            for (let i = 0; i < this.options.length; i++) {
                if (i === selectedIndex) {
                    this.options[i].selected = true;
                } else {
                    this.options[i].selected = false;
                }
            }
        });
    }

    // Funciones para manejar la carga de archivos
    function handleDragOver(e) {
        e.preventDefault();
        e.stopPropagation();
        dropArea.classList.add('drag-over');
    }
    
    function handleDragLeave(e) {
        e.preventDefault();
        e.stopPropagation();
        dropArea.classList.remove('drag-over');
    }
    
    function handleDrop(e) {
        e.preventDefault();
        e.stopPropagation();
        dropArea.classList.remove('drag-over');
        
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            processFile(files[0]);
        }
    }
    
    function handleFileSelect(e) {
        const files = e.target.files;
        if (files.length > 0) {
            processFile(files[0]);
        }
    }
    
    // Procesar el archivo cargado
    function processFile(file) {
        if (!file.name.endsWith('.dat')) {
            showNotification('Por favor, sube un archivo .dat válido', 'error');
            return;
        }
        
        fileInfo.textContent = `Archivo seleccionado: ${file.name} (${formatFileSize(file.size)})`;
        
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                // Eliminar posibles comentarios al inicio del archivo y cualquier otra cosa que no sea JSON válido
                let content = e.target.result;
                if (content.includes('{"settings":')) {
                    content = content.substring(content.indexOf('{"settings":'));
                }
                
                gameData = JSON.parse(content);
                showNotification('Archivo cargado correctamente', 'success');
                
                // Ocultar la sección de carga de archivos
                uploadSection.style.display = 'none';
                
                // Comprobar si hay múltiples partidas
                if (gameData && gameData.gameData && gameData.gameData.slotData && gameData.gameData.slotData.length > 0) {
                    // Mostrar la sección de selección de partidas
                    loadSlotSelection();
                } else {
                    showNotification('No se encontraron partidas en el archivo', 'warning');
                }
                
                // Añadir botón para volver a subir otro archivo
                addResetButton();
            } catch (error) {
                console.error('Error al procesar el archivo:', error);
                showNotification('El archivo no contiene un formato JSON válido', 'error');
            }
        };
        reader.readAsText(file);
    }
    
    // Añadir botón para reiniciar y subir un nuevo archivo
    function addResetButton() {
        // Comprobar si ya existe un botón de reinicio
        if (document.getElementById('reset-button')) {
            return;
        }
        
        // Crear el botón de reinicio
        const resetButton = document.createElement('button');
        resetButton.id = 'reset-button';
        resetButton.className = 'reset-btn';
        resetButton.textContent = 'Subir un archivo diferente';
        
        // Agregar evento al botón
        resetButton.addEventListener('click', function() {
            // Mostrar sección de carga
            uploadSection.style.display = 'block';
            
            // Ocultar secciones de edición
            slotSelectionSection.style.display = 'none';
            editSection.style.display = 'none';
            
            // Limpiar variables
            gameData = null;
            currentSlot = 0;
            
            // Limpiar interfaz
            fileInfo.textContent = 'No se ha seleccionado ningún archivo';
            slotsContainer.innerHTML = '';
            
            // Eliminar este botón
            this.remove();
            
            // Hacer scroll a la sección de carga
            uploadSection.scrollIntoView({ behavior: 'smooth' });
        });
        
        // Añadir el botón después de la sección de carga
        uploadSection.parentNode.insertBefore(resetButton, uploadSection.nextSibling);
    }

    // Cargar la selección de partidas
    function loadSlotSelection() {
        if (!gameData || !gameData.gameData || !gameData.gameData.slotData) {
            return;
        }
        
        // Limpiar el contenedor de slots
        slotsContainer.innerHTML = '';
        
        // Guardar el slot actual que está en el archivo
        const originalCurrentSlot = gameData.gameData.currentSlot;
        
        // Crear una tarjeta para cada slot
        gameData.gameData.slotData.forEach((slot, index) => {
            const slotCard = document.createElement('div');
            slotCard.className = `slot-card ${index === originalCurrentSlot ? '' : ''}`;
            if (!slot.hasData) {
                slotCard.classList.add('inactive');
            }
            
            // Título de la tarjeta
            const title = document.createElement('h3');
            title.textContent = slot.hasData ? `Partida ${index + 1}: ${slot.playerName}` : `Partida ${index + 1}: No iniciada`;
            slotCard.appendChild(title);
            
            if (slot.hasData) {
                // Información de la partida
                const farmInfo = document.createElement('div');
                farmInfo.className = 'slot-info';
                farmInfo.innerHTML = `<span>Granja:</span> ${slot.farmName}`;
                slotCard.appendChild(farmInfo);
                
                const levelInfo = document.createElement('div');
                levelInfo.className = 'slot-info';
                levelInfo.innerHTML = `<span>Nivel:</span> ${slot.currentLevel}`;
                slotCard.appendChild(levelInfo);
                
                const creditsInfo = document.createElement('div');
                creditsInfo.className = 'slot-info';
                creditsInfo.innerHTML = `<span>Créditos:</span> ${slot.credits}`;
                slotCard.appendChild(creditsInfo);
                
                const dayInfo = document.createElement('div');
                dayInfo.className = 'slot-info';
                dayInfo.innerHTML = `<span>Día/Año:</span> ${slot.currentDay}/${slot.currentYear}`;
                slotCard.appendChild(dayInfo);
                
                const climaInfo = document.createElement('div');
                climaInfo.className = 'slot-info';
                // Corregir la visualización del clima
                const climas = ['Templado', 'Cálido', 'Frío'];
                const climaIndex = (slot.currentSeason >= 0 && slot.currentSeason < climas.length) ? slot.currentSeason : 0;
                climaInfo.innerHTML = `<span>Clima:</span> ${climas[climaIndex - 1]}`;
                slotCard.appendChild(climaInfo);
                
                // Botón para seleccionar esta partida
                const selectBtn = document.createElement('button');
                selectBtn.className = 'slot-select-btn';
                selectBtn.textContent = 'Editar esta partida';
                selectBtn.addEventListener('click', () => {
                    selectSlot(index);
                });
                slotCard.appendChild(selectBtn);
            } else {
                const inactiveInfo = document.createElement('div');
                inactiveInfo.className = 'slot-info';
                inactiveInfo.textContent = 'Esta partida no ha sido iniciada todavía.';
                slotCard.appendChild(inactiveInfo);
                
                const selectBtn = document.createElement('button');
                selectBtn.className = 'slot-select-btn';
                selectBtn.textContent = 'No disponible';
                selectBtn.disabled = true;
                slotCard.appendChild(selectBtn);
            }
            
            slotsContainer.appendChild(slotCard);
        });
        
        // Mostrar la sección de selección
        slotSelectionSection.style.display = 'block';
        
        // Hacer scroll a la sección
        slotSelectionSection.scrollIntoView({ behavior: 'smooth' });
    }
    
    // Seleccionar una partida para editar
    function selectSlot(slotIndex) {
        if (!gameData || !gameData.gameData || !gameData.gameData.slotData || !gameData.gameData.slotData[slotIndex] || !gameData.gameData.slotData[slotIndex].hasData) {
            showNotification('Partida no válida', 'error');
            return;
        }
        
        // Guardar el índice actual
        currentSlot = slotIndex;
        
        // Actualizar el indicador de partida actual
        currentSlotIndicator.textContent = `(Partida ${slotIndex + 1}: ${gameData.gameData.slotData[slotIndex].playerName})`;
        
        // Mostrar la sección de edición y cargar los datos
        editSection.style.display = 'block';
        loadGameData();
        
        // Scroll a la sección de edición
        editSection.scrollIntoView({ behavior: 'smooth' });
    }
    
    // Cargar los datos del juego en la interfaz
    function loadGameData() {
        if (!gameData || !gameData.gameData || !gameData.gameData.slotData || !gameData.gameData.slotData[currentSlot]) {
            showNotification('El archivo no contiene datos de guardado válidos para esta partida', 'error');
            return;
        }
        
        // Obtener los datos del slot seleccionado
        const slotData = gameData.gameData.slotData[currentSlot];
        
        // Cargar datos generales
        document.getElementById('playerName').value = slotData.playerName || '';
        document.getElementById('farmName').value = slotData.farmName || '';
        document.getElementById('credits').value = slotData.credits || 0;
        document.getElementById('energy').value = slotData.currentEnergyLevel || 1;
        document.getElementById('level').value = slotData.currentLevel || 1;
        document.getElementById('day').value = slotData.currentDay || 1;
        document.getElementById('year').value = slotData.currentYear || 1;
        
        // Manejar correctamente el valor del clima/estación
        const seasonSelect = document.getElementById('season');
        const seasonValue = slotData.currentSeason || 0;
        seasonSelect.value = seasonValue.toString();
        
        // Asegurarnos de que la opción visual corresponda al valor seleccionado
        for (let i = 0; i < seasonSelect.options.length; i++) {
            const option = seasonSelect.options[i];
            option.selected = (option.value === seasonValue.toString());
        }
        
        // Cargar datos de habilidades
        document.getElementById('hatchetLevel').value = slotData.hatchetLevel || 0;
        document.getElementById('pickaxeLevel').value = slotData.pickaxeLevel || 0;
        document.getElementById('sickleLevel').value = slotData.sickleLevel || 0;
        document.getElementById('hoeLevel').value = slotData.hoeLevel || 0;
        document.getElementById('wateringCanLevel').value = slotData.wateringCanLevel || 0;
        
        // Cargar datos de la nave espacial
        document.getElementById('shipEnergy').value = slotData.spaceShipCurrentEnergy || 0;
        document.getElementById('shipCells').value = slotData.spaceShipAvailableCells || 0;
        document.getElementById('shipActiveCells').value = slotData.spaceShipActiveCells || 0;
        
        // Cargar los valores de las partes de la nave en los nuevos selects
        if (slotData.shipParts && slotData.shipParts.length > 0) {
            // Mapeamos los índices de las partes de la nave a los IDs de los selects
            const partsMapping = [
                { index: 0, id: 'ship-cells' },         // Células de combustible
                { index: 1, id: 'ship-engine' },        // Mejora del motor
                { index: 2, id: 'ship-cargo' },         // Espacio de bahía de carga
                { index: 3, id: 'ship-reactors' },      // Mejora reactores
                { index: 4, id: 'ship-processor' },     // Mejora procesador de materia
                { index: 5, id: 'ship-hull' }           // Refuerzo del casco
            ];
            
            // Configuramos cada select con el valor correspondiente
            partsMapping.forEach(mapping => {
                if (slotData.shipParts[mapping.index]) {
                    const select = document.getElementById(mapping.id);
                    if (select) {
                        const value = slotData.shipParts[mapping.index].currentProgress || 0;
                        select.value = value.toString();
                        
                        // Asegurarnos de que la opción visual corresponda al valor seleccionado
                        for (let i = 0; i < select.options.length; i++) {
                            const option = select.options[i];
                            option.selected = (option.value === value.toString());
                        }
                    }
                }
            });
        }
        
        // Validar todos los campos numéricos después de cargar los datos
        const numericInputs = document.querySelectorAll('input[type="number"]');
        numericInputs.forEach(input => {
            validateNumericInput(input);
        });
        
        // Validar específicamente el combustible de la nave
        validateShipFuel();
        
        // Cargar inventario
        loadInventory(slotData);
    }
    
    // Cargar los datos del inventario
    function loadInventory(slotData) {
        const inventoryContainer = document.getElementById('inventory-items');
        inventoryContainer.innerHTML = '';
        
        if (slotData.inventorySaveItems && slotData.inventorySaveItems.length > 0) {
            slotData.inventorySaveItems.forEach((item, index) => {
                const itemDiv = document.createElement('div');
                itemDiv.className = 'inventory-item';
                
                // Buscar información del ítem en el JSON cargado
                let itemInfo = null;
                if (itemsData && itemsData.items) {
                    itemInfo = itemsData.items.find(i => i.id === item.itemID);
                }
                
                // Crear un elemento para el icono del elemento
                const itemIcon = document.createElement('div');
                itemIcon.className = 'item-icon';
                
                if (item.isEmpty) {
                    itemIcon.textContent = '🚫';
                    itemIcon.style.fontSize = '24px';
                } else if (itemInfo && itemInfo.image) {
                    // Si tenemos información de imagen, intentamos cargarla
                    const img = document.createElement('img');
                    img.src = `assets/${itemInfo.image}`;
                    img.alt = itemInfo.name || `Ítem ${item.itemID}`;
                    img.title = itemInfo.description || '';
                    img.onerror = function() {
                        this.onerror = null;
                        this.src = 'assets/items/default.png';
                        this.alt = 'Imagen no disponible';
                    };
                    itemIcon.appendChild(img);
                } else {
                    // Usamos un emoji como respaldo
                    itemIcon.textContent = '📦';
                    itemIcon.style.fontSize = '24px';
                }
                
                // Crear etiqueta para el nombre del ítem
                const itemName = document.createElement('p');
                itemName.className = 'item-name';
                if (!item.isEmpty && itemInfo) {
                    itemName.textContent = itemInfo.name || `Ítem ${item.itemID}`;
                } else {
                    itemName.textContent = `Slot ${index + 1}`;
                }
                
                // Crear campo para ID del elemento
                const itemIdInput = document.createElement('input');
                itemIdInput.type = 'number';
                itemIdInput.value = item.itemID;
                itemIdInput.min = 0;
                itemIdInput.placeholder = 'ID';
                itemIdInput.title = 'ID del objeto';
                itemIdInput.dataset.index = index;
                itemIdInput.dataset.property = 'itemID';
                itemIdInput.addEventListener('change', updateInventoryItem);
                
                // Crear campo para cantidad
                const itemAmountInput = document.createElement('input');
                itemAmountInput.type = 'number';
                itemAmountInput.value = item.amount;
                itemAmountInput.min = 0;
                itemAmountInput.placeholder = 'Cantidad';
                itemAmountInput.title = 'Cantidad';
                itemAmountInput.dataset.index = index;
                itemAmountInput.dataset.property = 'amount';
                itemAmountInput.addEventListener('change', updateInventoryItem);
                
                // Agregar todo al elemento de inventario
                itemDiv.appendChild(itemIcon);
                itemDiv.appendChild(itemName);
                itemDiv.appendChild(itemIdInput);
                itemDiv.appendChild(itemAmountInput);
                
                inventoryContainer.appendChild(itemDiv);
            });
        }
    }
    
    // Actualizar un elemento del inventario
    function updateInventoryItem(e) {
        const index = parseInt(e.target.dataset.index);
        const property = e.target.dataset.property;
        const value = e.target.value !== '' ? parseInt(e.target.value) : 0;
        
        if (gameData && gameData.gameData && gameData.gameData.slotData) {
            const slotData = gameData.gameData.slotData[currentSlot];
            
            if (slotData.inventorySaveItems && slotData.inventorySaveItems[index]) {
                slotData.inventorySaveItems[index][property] = value;
                
                // Si el ID es 0 o la cantidad es 0, marcar como vacío
                if (property === 'itemID' && value === 0) {
                    slotData.inventorySaveItems[index].isEmpty = true;
                    slotData.inventorySaveItems[index].amount = 0;
                } else if (property === 'amount' && value === 0) {
                    slotData.inventorySaveItems[index].isEmpty = true;
                } else {
                    slotData.inventorySaveItems[index].isEmpty = false;
                }
                
                // Si se cambió el ID, actualizar la visualización del elemento
                if (property === 'itemID') {
                    loadInventory(slotData);
                }
            }
        }
    }
    
    // Cambiar de pestaña
    function switchTab(tabId, clickedBtn) {
        // Desactivar todos los botones y ocultar todos los paneles
        tabBtns.forEach(btn => btn.classList.remove('active'));
        tabPanes.forEach(pane => pane.classList.remove('active'));
        
        // Activar el botón y panel seleccionados
        clickedBtn.classList.add('active');
        document.getElementById(tabId).classList.add('active');
    }
    
    // Guardar los cambios realizados en el archivo
    function saveChanges() {
        if (!gameData) {
            showNotification('No hay datos para guardar', 'error');
            return;
        }
        
        try {
            // Validar todos los campos numéricos antes de guardar
            const numericInputs = document.querySelectorAll('input[type="number"]');
            numericInputs.forEach(input => {
                validateNumericInput(input);
            });
            
            // Validar específicamente el combustible de la nave
            validateShipFuel();
            
            // Obtener los datos del slot actual
            const slotData = gameData.gameData.slotData[currentSlot];
            
            // Actualizar datos generales
            slotData.playerName = document.getElementById('playerName').value;
            slotData.farmName = document.getElementById('farmName').value;
            slotData.credits = parseInt(document.getElementById('credits').value) || 0;
            slotData.currentEnergyLevel = parseInt(document.getElementById('energy').value) || 1;
            slotData.currentLevel = parseInt(document.getElementById('level').value) || 1;
            slotData.currentDay = parseInt(document.getElementById('day').value) || 1;
            slotData.currentYear = parseInt(document.getElementById('year').value) || 1;
            
            // Capturar el valor seleccionado del clima/estación
            const seasonSelect = document.getElementById('season');
            slotData.currentSeason = parseInt(seasonSelect.value);
            
            // Actualizar habilidades
            slotData.hatchetLevel = parseInt(document.getElementById('hatchetLevel').value) || 0;
            slotData.pickaxeLevel = parseInt(document.getElementById('pickaxeLevel').value) || 0;
            slotData.sickleLevel = parseInt(document.getElementById('sickleLevel').value) || 0;
            slotData.hoeLevel = parseInt(document.getElementById('hoeLevel').value) || 0;
            slotData.wateringCanLevel = parseInt(document.getElementById('wateringCanLevel').value) || 0;
            
            // Actualizar datos de la nave espacial
            slotData.spaceShipCurrentEnergy = parseInt(document.getElementById('shipEnergy').value) || 0;
            slotData.spaceShipAvailableCells = parseInt(document.getElementById('shipCells').value) || 0;
            slotData.spaceShipActiveCells = parseInt(document.getElementById('shipActiveCells').value) || 0;
            
            // Actualizar partes de la nave espacial desde los nuevos selects
            if (slotData.shipParts && slotData.shipParts.length > 0) {
                // Mapeamos los índices de las partes de la nave a los IDs de los selects
                const partsMapping = [
                    { index: 0, id: 'ship-cells' },         // Células de combustible
                    { index: 1, id: 'ship-engine' },        // Mejora del motor
                    { index: 2, id: 'ship-cargo' },         // Espacio de bahía de carga
                    { index: 3, id: 'ship-reactors' },      // Mejora reactores
                    { index: 4, id: 'ship-processor' },     // Mejora procesador de materia
                    { index: 5, id: 'ship-hull' }           // Refuerzo del casco
                ];
                
                // Guardar los valores seleccionados en cada parte
                partsMapping.forEach(mapping => {
                    if (slotData.shipParts[mapping.index]) {
                        const select = document.getElementById(mapping.id);
                        if (select) {
                            slotData.shipParts[mapping.index].currentProgress = parseInt(select.value) || 0;
                        }
                    }
                });
            }
            
            // Actualizar el currentSlot en el gameData para que el juego cargue la partida editada
            gameData.gameData.currentSlot = currentSlot;
            
            showNotification('Cambios guardados correctamente', 'success');
        } catch (error) {
            console.error('Error al guardar los cambios:', error);
            showNotification('Error al guardar los cambios', 'error');
        }
    }
    
    // Descargar el archivo modificado
    function downloadModifiedFile() {
        if (!gameData) {
            showNotification('No hay datos para descargar', 'error');
            return;
        }
        
        try {
            // Crear un blob con los datos JSON
            const jsonString = JSON.stringify(gameData);
            const blob = new Blob([jsonString], { type: 'application/json' });
            
            // Crear un enlace de descarga
            const downloadLink = document.createElement('a');
            downloadLink.download = 'gamedata.dat';
            downloadLink.href = window.URL.createObjectURL(blob);
            downloadLink.style.display = 'none';
            
            // Agregar el enlace al DOM y hacer clic en él
            document.body.appendChild(downloadLink);
            downloadLink.click();
            
            // Limpiar después de la descarga
            window.URL.revokeObjectURL(downloadLink.href);
            document.body.removeChild(downloadLink);
            
            showNotification('Archivo descargado correctamente', 'success');
        } catch (error) {
            console.error('Error al descargar el archivo:', error);
            showNotification('Error al descargar el archivo', 'error');
        }
    }
    
    // Mostrar notificaciones
    function showNotification(message, type = 'success') {
        notificationMessage.textContent = message;
        notification.className = 'notification';
        notification.classList.add(type);
        notification.classList.add('show');
        
        // Ocultar la notificación después de 5 segundos
        setTimeout(() => {
            notification.classList.remove('show');
        }, 5000);
    }
    
    // Formatear tamaño de archivo
    function formatFileSize(bytes) {
        if (bytes < 1024) {
            return bytes + ' bytes';
        } else if (bytes < 1048576) {
            return (bytes / 1024).toFixed(2) + ' KB';
        } else {
            return (bytes / 1048576).toFixed(2) + ' MB';
        }
    }

    // Configurar validación numérica
    setupNumericValidation();
});
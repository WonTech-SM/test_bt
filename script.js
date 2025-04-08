const SERVICE_UUID = '4fafc201-1fb5-459e-8fcc-c5c9c331914b';
const CHARACTERISTIC_UUID = 'beb5483e-36e1-4688-b7f5-ea07361b26a8';

let device = null;
let characteristic = null;

const connectBtn = document.getElementById('connect-btn');
const disconnectBtn = document.getElementById('disconnect-btn');
const sendBtn = document.getElementById('send-btn');
const messageInput = document.getElementById('message-input');
const connectionStatus = document.getElementById('connection-status');
const messageLog = document.getElementById('message-log');

function logMessage(message, isReceived = false) {
    const p = document.createElement('p');
    p.textContent = `${new Date().toLocaleTimeString()} - ${isReceived ? 'Recibido' : 'Enviado'}: ${message}`;
    messageLog.appendChild(p);
    messageLog.scrollTop = messageLog.scrollHeight;
}

async function connect() {
    try {
        logMessage('Intentando conectar...');
        
        device = await navigator.bluetooth.requestDevice({
            filters: [{ name: 'ESP32_BLE_TEST' }],
            optionalServices: [SERVICE_UUID]
        });

        device.addEventListener('gattserverdisconnected', onDisconnected);

        const server = await device.gatt.connect();
        const service = await server.getPrimaryService(SERVICE_UUID);
        characteristic = await service.getCharacteristic(CHARACTERISTIC_UUID);

        characteristic.addEventListener('characteristicvaluechanged', handleNotifications);
        await characteristic.startNotifications();

        updateUI(true);
        logMessage('Conectado exitosamente');
    } catch (error) {
        logMessage(`Error de conexión: ${error.message}`);
    }
}

function onDisconnected() {
    updateUI(false);
    logMessage('Dispositivo desconectado');
}

async function disconnect() {
    if (device) {
        if (device.gatt.connected) {
            if (characteristic) {
                await characteristic.stopNotifications();
            }
            device.gatt.disconnect();
        }
        device = null;
        characteristic = null;
        updateUI(false);
    }
}

function handleNotifications(event) {
    const value = event.target.value;
    const decoder = new TextDecoder('utf-8');
    const message = decoder.decode(value);
    logMessage(message, true);
}

async function sendMessage() {
    if (!characteristic || !messageInput.value) return;

    try {
        const message = messageInput.value;
        const encoder = new TextEncoder('utf-8');
        const value = encoder.encode(message);
        
        await characteristic.writeValue(value);
        logMessage(message);
        messageInput.value = '';
    } catch (error) {
        logMessage(`Error al enviar mensaje: ${error.message}`);
    }
}

function updateUI(connected) {
    connectionStatus.textContent = `Estado: ${connected ? 'Conectado' : 'Desconectado'}`;
    connectionStatus.className = `status ${connected ? 'connected' : 'disconnected'}`;
    
    connectBtn.disabled = connected;
    disconnectBtn.disabled = !connected;
    sendBtn.disabled = !connected;
    messageInput.disabled = !connected;
}

// Event Listeners
connectBtn.addEventListener('click', connect);
disconnectBtn.addEventListener('click', disconnect);
sendBtn.addEventListener('click', sendMessage);

messageInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !sendBtn.disabled) {
        sendMessage();
    }
}); 

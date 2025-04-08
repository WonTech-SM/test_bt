let serviceUuid = '4fafc201-1fb5-459e-8fcc-c5c9c331914b';
let characteristicUuid = 'beb5483e-36e1-4688-b7f5-ea07361b26a8';
let bleDevice = null;
let bleCharacteristic = null;

const connectBtn = document.getElementById('connectBtn');
const sendBtn = document.getElementById('sendBtn');
const inputText = document.getElementById('inputText');
const receivedData = document.getElementById('receivedData');
const connectionStatus = document.getElementById('connectionStatus');

connectBtn.addEventListener('click', async () => {
  try {
    bleDevice = await navigator.bluetooth.requestDevice({
      filters: [{ name: 'ESP32_BLE_TEST' }],
      optionalServices: [serviceUuid]
    });

    const server = await bleDevice.gatt.connect();
    const service = await server.getPrimaryService(serviceUuid);
    bleCharacteristic = await service.getCharacteristic(characteristicUuid);

    await bleCharacteristic.startNotifications();

    bleCharacteristic.addEventListener('characteristicvaluechanged', (event) => {
      const value = new TextDecoder().decode(event.target.value);
      receivedData.textContent = value;
      console.log('Recibido del ESP32:', value);
    });

    connectionStatus.textContent = 'Estado: Conectado';
    sendBtn.disabled = false;
  } catch (error) {
    console.error('Error al conectar:', error);
    connectionStatus.textContent = 'Estado: Error de conexión';
  }
});

sendBtn.addEventListener('click', async () => {
  if (bleCharacteristic && inputText.value.trim() !== '') {
    const msg = inputText.value;
    const encoder = new TextEncoder();
    await bleCharacteristic.writeValue(encoder.encode(msg));
    console.log('Enviado al ESP32:', msg);
    inputText.value = '';
  }
});

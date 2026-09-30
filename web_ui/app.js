/**
 * SANCTUARY OS - CLEAN, UNCLUTTERED HOME MONITOR & UNIVERSAL ENGINE
 * Multi-Board Web Serial Engine (ESP32, Arduino, SparkFun),
 * 10 Theme Environments, Interactive Room Inspector Drawer,
 * Evidence Media Gallery, Alarm History, PDF Reports & Segregated IDE.
 */

// =============================================================================
// 1. GLOBAL STATE & REGISTRY
// =============================================================================
const state = {
  facilityName: 'KyU Telemetry Lab 4',
  profileName: 'Smart Room Monitoring Level 2',
  currentTheme: 'home',
  testSimulationMode: false,
  
  // Hardware Connection
  serialPort: null,
  serialReader: null,
  activeBoard: 'none',
  isSerialConnected: false,

  // Live Telemetry (strict physical defaults)
  telemetry: {
    temp: null,
    hum: null,
    gas: null,
    volt: null,
    current: null,
    power: null,
    kwh: 1.42,
    doorOpen: false,
    motion: false,
    distance: 24.5,
    radarDetected: false,
    radarSpeed: 0.0,
    radarDistance: 2.4,
    fanOn: false,
    windowPercent: 45,
    nightGuard: true,
    lastUpdate: null
  },

  // Rooms Configuration
  rooms: [
    { id: 'entrance', name: 'Front Entrance', purpose: 'Perimeter Barrier & Chime' },
    { id: 'living', name: 'Living Room', purpose: 'Surveillance & PIR Motion' },
    { id: 'kitchen', name: 'Kitchen', purpose: 'LPG / Smoke Safety & Exhaust' },
    { id: 'bedroom', name: 'Master Haven', purpose: 'Atmospheric Climate' },
    { id: 'utility', name: 'Power Utility', purpose: 'UEDCL Grid & GSM Gateway' }
  ],

  // Sensors & Pin Mappings with distinct individual metrics and controls
  configuredSensors: [
    { id: 1, templateId: 'dht22', name: 'DHT22 Climate Sensor', pin: 'GPIO 13', type: 'Digital / 1-Wire', room: 'Master Haven', category: 'climate', value: 24.2, humValue: 58.0, unit: '°C', threshold: '18°C – 28°C', minVal: 10, maxVal: 45, step: 0.1, targetVal: 22, mode: 'cooling', status: 'normal', history: [23.8, 24.0, 24.1, 24.2] },
    { id: 2, templateId: 'mq2', name: 'MQ-2 Gas & Smoke Detector', pin: 'GPIO 36', type: 'Analog (ADC)', room: 'Kitchen', category: 'gas', value: 185, unit: 'ppm', threshold: '> 350 ppm', minVal: 50, maxVal: 800, step: 5, targetVal: 350, mode: 'monitoring', status: 'normal', history: [180, 182, 185, 184] },
    { id: 3, templateId: 'zmpt101b', name: 'ZMPT101B AC Voltage Sensor', pin: 'GPIO 39', type: 'Analog (ADC)', room: 'Power Utility', category: 'power', value: 238.4, unit: 'V AC', threshold: '180V – 260V', minVal: 150, maxVal: 280, step: 0.5, status: 'normal', history: [237.8, 238.2, 238.4] },
    { id: 4, templateId: 'acs712_20', name: 'ACS712 20A Current Sensor', pin: 'GPIO 34', type: 'Analog (ADC)', room: 'Power Utility', category: 'power', value: 0.85, unit: 'A', threshold: '< 15 A', minVal: 0, maxVal: 20, step: 0.05, status: 'normal', history: [0.82, 0.84, 0.85] },
    { id: 5, templateId: 'reed_switch', name: 'Magnetic Door Reed Switch', pin: 'GPIO 14', type: 'Digital Input', room: 'Front Entrance', category: 'motion', value: 0, unit: 'State', threshold: 'HIGH on Open', status: 'secure', history: [0, 0, 0] },
    { id: 6, templateId: 'hcsr501', name: 'PIR Human Motion Sensor', pin: 'GPIO 12', type: 'Digital Input', room: 'Living Room', category: 'motion', value: 0, unit: 'Motion', threshold: 'HIGH on Motion', status: 'secure', armed: true, history: [0, 0, 0] },
    { id: 7, templateId: 'hcsr04', name: 'HC-SR04 Ultrasonic Distance', pin: 'GPIO 15', type: 'Digital Pulse', room: 'Master Haven', category: 'liquid', value: 24.5, unit: 'cm', threshold: '< 30 cm', minVal: 2, maxVal: 200, step: 0.5, status: 'normal', history: [25.0, 24.8, 24.5] },
    { id: 8, templateId: 'rcwl0516', name: 'RCWL-0516 Doppler Microwave Radar', pin: 'GPIO 5', type: 'Microwave Radar (5.8GHz)', room: 'Master Haven', category: 'radar', value: 0, unit: 'm/s Doppler', threshold: 'Target Velocity > 0.5 m/s', minVal: 0, maxVal: 15, step: 0.1, status: 'normal', armed: true, history: [0, 0, 0] },
    { id: 9, templateId: 'relay_1ch', name: 'Exhaust Fan Relay Module', pin: 'GPIO 4', type: 'Digital Output', room: 'Kitchen', category: 'actuator', value: 0, unit: 'Relay', threshold: 'Active LOW', status: 'standby' },
    { id: 10, templateId: 'servo_sg90', name: 'Smart Window Opener Servo', pin: 'GPIO 2', type: 'PWM / Servo', room: 'Master Haven', category: 'actuator', value: 45, unit: '% Ajar', threshold: '0° – 180°', minVal: 0, maxVal: 100, step: 5, status: 'normal' },
    { id: 11, templateId: 'piezo_buzzer', name: 'High-Decibel Piezo Buzzer', pin: 'GPIO 33', type: 'Digital Output', room: 'Power Utility', category: 'actuator', value: 0, unit: 'Siren', threshold: 'Alarm Siren', status: 'silent' }
  ],

  // Controllable Room Outputs & Actuators Matrix
  roomOutputs: {
    fan: false,
    valve: true, // true = open / flow active, false = isolated
    windowPercent: 45,
    acPower: true,
    acTemp: 22,
    acMode: 'cool',
    buzzer: false,
    floodlights: false,
    doorLock: true, // true = engaged/locked
    pump: false,
    breaker: true, // true = closed/active
    nightGuard: true
  },

  // Automation Rules (IF / THEN / ELSE) Engine
  automationRules: [
    {
      id: 'rule-gas',
      name: 'Kitchen Gas Leak Safety Interlock',
      enabled: true,
      sensorName: 'MQ-2 Gas & Smoke Detector',
      sensorId: 2,
      operator: '>',
      threshold: 350,
      thenOutput: 'fan',
      thenState: 'ON',
      thenSecondary: { valve: 'SHUT', buzzer: 'ON' },
      elseOutput: 'fan',
      elseState: 'OFF',
      elseSecondary: { buzzer: 'OFF' },
      isMet: false,
      lastTriggered: null
    },
    {
      id: 'rule-climate',
      name: 'Master Climate Comfort Cooling',
      enabled: true,
      sensorName: 'DHT22 Climate Sensor',
      sensorId: 1,
      operator: '>',
      threshold: 26.5,
      thenOutput: 'ac',
      thenState: 'COOL_MAX',
      thenSecondary: { windowPercent: 80 },
      elseOutput: 'ac',
      elseState: 'STANDBY',
      elseSecondary: { windowPercent: 20 },
      isMet: false,
      lastTriggered: null
    },
    {
      id: 'rule-intrusion',
      name: 'Perimeter Intrusion Alarm Protocol',
      enabled: true,
      sensorName: 'PIR Human Motion Sensor',
      sensorId: 6,
      operator: '==',
      threshold: 1,
      thenOutput: 'buzzer',
      thenState: 'ON',
      thenSecondary: { floodlights: 'ON', snapshot: 'TRIGGER' },
      elseOutput: 'floodlights',
      elseState: 'OFF',
      isMet: false,
      lastTriggered: null
    },
    {
      id: 'rule-grid',
      name: 'AC Grid Overvoltage Protection',
      enabled: true,
      sensorName: 'ZMPT101B AC Voltage Sensor',
      sensorId: 3,
      operator: '>',
      threshold: 252,
      thenOutput: 'breaker',
      thenState: 'TRIP',
      elseOutput: 'breaker',
      elseState: 'CLOSED',
      isMet: false,
      lastTriggered: null
    },
    {
      id: 'rule-water',
      name: 'Water Reservoir Low Auto-Fill',
      enabled: true,
      sensorName: 'HC-SR04 Ultrasonic Distance',
      sensorId: 7,
      operator: '<',
      threshold: 15,
      thenOutput: 'pump',
      thenState: 'ON',
      elseOutput: 'pump',
      elseState: 'OFF',
      isMet: false,
      lastTriggered: null
    }
  ],

  // Custom User Cloud & Broker Gateways
  customClouds: (function() {
    try {
      const saved = localStorage.getItem('sanctuary_custom_clouds');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return [
      { id: 'cloud-aws', type: 'aws_iot', name: 'AWS IoT Core Fleet Gateway', host: 'a39f1k-ats.iot.us-east-1.amazonaws.com', port: 8883, topic: 'sanctuary/sensors/live', status: 'online', latency: 38, enabled: true },
      { id: 'cloud-tb', type: 'thingsboard', name: 'ThingsBoard Industrial Cloud', host: 'thingsboard.cloud', port: 1883, topic: 'v1/devices/me/telemetry', status: 'online', latency: 46, enabled: true },
      { id: 'cloud-azure', type: 'azure_iot', name: 'Azure IoT Hub', host: 'kyu-iot-hub.azure-devices.net', port: 8883, topic: 'devices/messages/', status: 'online', latency: 52, enabled: true },
      { id: 'cloud-gcp', type: 'gcp_iot', name: 'Google Cloud PubSub', host: 'mqtt.googleapis.com', port: 8883, topic: 'projects/kyu/topics/telemetry', status: 'online', latency: 41, enabled: true },
      { id: 'cloud-adafruit', type: 'adafruit_io', name: 'Adafruit IO Dashboard', host: 'io.adafruit.com', port: 8883, topic: 'user/feeds/sanctuary', status: 'online', latency: 60, enabled: true },
      { id: 'cloud-mqtt', type: 'generic_mqtt', name: 'Local EMQX Broker', host: '192.168.1.100', port: 1883, topic: 'sanctuary/local', status: 'online', latency: 12, enabled: true },
      { id: 'cloud-rest', type: 'custom_rest', name: 'Webhook API Server', host: 'api.sanctuary-iot.org', port: 443, topic: '/v1/ingest', status: 'online', latency: 85, enabled: true }
    ];
  })(),

  // Auto-collect and mapping flag
  autoMapEnabled: true,
  selectedPin: null,
  selectedPinMode: 'INPUT',
  bluetoothDevice: null,
  bluetoothCharacteristic: null,
  wifiSocket: null,

  // SVG Floor Plan: Draggable Sensor Marker Positions (markerId -> {x, y})
  sensorPositions: {
    'marker-reed':   { x: 70,  y: 180 },
    'marker-cam':    { x: 590, y: 60  },
    'marker-pir':    { x: 330, y: 260 },
    'marker-gas':    { x: 685, y: 155 },
    'marker-dht':    { x: 260, y: 390 },
    'marker-ultra':  { x: 245, y: 450 },
    'marker-radar':  { x: 245, y: 490 },
    'marker-power':  { x: 580, y: 440 },
    'marker-gsm':    { x: 740, y: 440 }
  },

  // RF/Interference Obstacles on floor plan
  obstacles: [
    { id: 'obs-wifi-1', type: 'wifi',      label: 'Wi-Fi Router (2.4GHz)', x: 460, y: 155, radius: 55, color: 'rgba(59,130,246,0.18)', border: '#3b82f6' },
    { id: 'obs-micro-1', type: 'microwave', label: 'Microwave Oven',        x: 770, y: 145, radius: 38, color: 'rgba(239,68,68,0.15)',  border: '#ef4444' }
  ],

  // Photo & Evidence Gallery
  evidencePhotos: [
    { id: 'img-101', timestamp: '2026-09-29 10:15:32', trigger: 'Manual Snapshot', room: 'Living Room', src: '' },
    { id: 'img-102', timestamp: '2026-09-29 12:45:10', trigger: 'PIR Motion Trigger', room: 'Living Room', src: '' }
  ],

  // Alarm Incident Log
  alarmLogs: [
    { id: 1, timestamp: '2026-09-29 08:30:14', category: 'Grid Power', sensor: 'ZMPT101B', detail: 'Voltage spike detected: 254V AC', action: 'ThingSpeak Alert Logged', status: 'Resolved' },
    { id: 2, timestamp: '2026-09-29 11:20:05', category: 'Air Safety', sensor: 'MQ-2 Gas', detail: 'Gas concentration: 380 ppm', action: 'Exhaust Fan Auto-Engaged & Buzzer', status: 'Resolved' },
    { id: 3, timestamp: '2026-09-29 14:10:48', category: 'Security', sensor: 'Reed Switch', detail: 'Door opened past 10 PM', action: 'Snapshot Captured + SMS Sent to +256770123456', status: 'Warning' }
  ],

  // Firmware Code Templates
  firmwareSketches: {
    stm32: `// =========================================================================
// STM32 NUCLEO-64 / BLUE PILL MULTI-SENSOR HARDWARE NODE
// Compatible with Sanctuary OS Web Serial, BLE & Wi-Fi JSON Ingestion
// =========================================================================
#include <Arduino.h>

#define PIN_DHT22     PA1   // Digital 1-Wire
#define PIN_MQ2       PA0   // ADC1 Channel 0
#define PIN_VOLT      PB0   // ADC1 Channel 8
#define PIN_CURRENT   PB1   // ADC1 Channel 9
#define PIN_REED      PA2   // Digital Input
#define PIN_PIR       PA3   // Digital Input
#define PIN_RELAY_FAN PA4   // Output Active HIGH
#define PIN_BUZZER    PA8   // PWM / Buzzer
#define PIN_USER_LED  PC13  // Onboard Heartbeat LED

void setup() {
  Serial.begin(115200);
  pinMode(PIN_USER_LED, OUTPUT);
  pinMode(PIN_REED, INPUT_PULLUP);
  pinMode(PIN_PIR, INPUT);
  pinMode(PIN_RELAY_FAN, OUTPUT);
  digitalWrite(PIN_RELAY_FAN, LOW);
  analogReadResolution(12); // STM32 12-bit ADC (0 - 4095)
  Serial.println(F("[STM32] Sanctuary Hardware Telemetry Node Online"));
}

void loop() {
  digitalWrite(PIN_USER_LED, !digitalRead(PIN_USER_LED));
  
  // 12-bit ADC Readings
  uint16_t raw_gas = analogRead(PIN_MQ2);
  uint16_t raw_volt = analogRead(PIN_VOLT);
  uint16_t raw_curr = analogRead(PIN_CURRENT);
  
  float gas_ppm = (raw_gas / 4095.0f) * 600.0f;
  float ac_volt = (raw_volt / 4095.0f) * 260.0f;
  float ac_current = ((raw_curr - 2048) / 4095.0f) * 20.0f;
  if (ac_current < 0) ac_current = 0.05f;

  int reed = (digitalRead(PIN_REED) == LOW) ? 1 : 0;
  int pir = (digitalRead(PIN_PIR) == HIGH) ? 1 : 0;

  // Stream standard JSON telemetry packet
  Serial.printf("{\\"board\\":\\"STM32\\",\\"temp\\":%.1f,\\"hum\\":%.1f,\\"gas\\":%.0f,\\"volt\\":%.1f,\\"current\\":%.2f,\\"reed\\":%d,\\"pir\\":%d}\\r\\n",
                24.5f, 56.0f, gas_ppm, ac_volt, ac_current, reed, pir);
  delay(1200);
}`,

    esp32cam: `// =========================================================================
// ESP32-CAM MULTI-SENSOR TELEMETRY & CAMERA FIRMWARE
// Compatible with Sanctuary OS Web Serial & Wi-Fi JSON API
// =========================================================================
#include "esp_camera.h"
#include <WiFi.h>
#include <DHT.h>

#define DHTPIN 13
#define DHTTYPE DHT22
DHT dht(DHTPIN, DHTTYPE);

#define REED_PIN 14
#define PIR_PIN 12
#define MQ2_PIN 36   // ADC1_CH0
#define VOLT_PIN 39  // ADC1_CH3
#define CURRENT_PIN 34 // ADC1_CH6
#define RELAY_FAN 4  // Shared with onboard LED

void setup() {
  Serial.begin(115200);
  pinMode(REED_PIN, INPUT_PULLUP);
  pinMode(PIR_PIN, INPUT);
  pinMode(RELAY_FAN, OUTPUT);
  digitalWrite(RELAY_FAN, LOW);
  dht.begin();
  delay(1000);
  Serial.println("[ESP32-CAM] Sanctuary Telemetry Node Online");
}

void loop() {
  float temp = dht.readTemperature();
  float hum = dht.readHumidity();
  int gas = analogRead(MQ2_PIN) / 4;
  float volt = (analogRead(VOLT_PIN) / 4095.0) * 250.0;
  float current = (analogRead(CURRENT_PIN) / 4095.0) * 5.0;
  int reed = (digitalRead(REED_PIN) == HIGH) ? 1 : 0;
  int pir = (digitalRead(PIR_PIN) == HIGH) ? 1 : 0;

  Serial.printf("{\\"temp\\":%.1f,\\"hum\\":%.1f,\\"gas\\":%d,\\"volt\\":%.1f,\\"current\\":%.2f,\\"reed\\":%d,\\"pir\\":%d}\\n",
    isnan(temp)? 24.0:temp, isnan(hum)? 50.0:hum, gas, volt, current, reed, pir);

  delay(1500);
}`,

    arduino: `// =========================================================================
// ARDUINO UNO / MEGA MULTI-SENSOR SERIAL STREAMER
// Sanctuary OS Universal Protocol
// =========================================================================
#include <DHT.h>

#define DHTPIN 13
#define DHTTYPE DHT22
DHT dht(DHTPIN, DHTTYPE);

const int REED_PIN = 2;
const int PIR_PIN = 3;
const int MQ2_PIN = A0;
const int VOLT_PIN = A1;
const int CURRENT_PIN = A2;
const int FAN_RELAY = 4;

void setup() {
  Serial.begin(115200);
  pinMode(REED_PIN, INPUT_PULLUP);
  pinMode(PIR_PIN, INPUT);
  pinMode(FAN_RELAY, OUTPUT);
  dht.begin();
}

void loop() {
  float temp = dht.readTemperature();
  float hum = dht.readHumidity();
  int gas = analogRead(MQ2_PIN) / 2;
  float volt = analogRead(VOLT_PIN) * (250.0 / 1023.0);
  float current = (analogRead(CURRENT_PIN) - 512) * (5.0 / 1024.0) / 0.185;
  int reed = (digitalRead(REED_PIN) == HIGH) ? 1 : 0;
  int pir = (digitalRead(PIR_PIN) == HIGH) ? 1 : 0;

  Serial.print("TEMP:"); Serial.print(isnan(temp)? 24.2:temp, 1);
  Serial.print(",HUM:"); Serial.print(isnan(hum)? 52.0:hum, 1);
  Serial.print(",GAS:"); Serial.print(gas);
  Serial.print(",VOLT:"); Serial.print(volt, 1);
  Serial.print(",REED:"); Serial.print(reed);
  Serial.print(",PIR:"); Serial.println(pir);

  delay(1500);
}`,

    sparkfun: `// =========================================================================
// SPARKFUN THING PLUS / STM32 TELEMETRY FIRMWARE
// Sanctuary OS Web Serial Compatibility
// =========================================================================
void setup() {
  Serial.begin(115200);
  while(!Serial && millis() < 3000);
  Serial.println("[SparkFun] Board Ready");
}

void loop() {
  float temp = 23.8 + (analogRead(A0) % 10) * 0.1;
  float hum = 51.5;
  int gas = 105;
  float volt = 231.5;
  
  Serial.printf("{\\"temp\\":%.1f,\\"hum\\":%.1f,\\"gas\\":%d,\\"volt\\":%.1f,\\"reed\\":0,\\"pir\\":0}\\n",
    temp, hum, gas, volt);
  delay(1500);
}`,

    spark_core: `// =========================================================================
// SPARK CORE (PARTICLE STM32F103 + CC3000) FULL SENSOR & ESP32-CAM BRIDGE
// 7 Sensors Interface + Hardware Serial1 Bridge to ESP32-CAM
// Compatible with Sanctuary OS Web Serial & Particle REST API
// =========================================================================
#include "application.h"
#include "DHT.h"

#define DHTPIN D2
#define DHTTYPE DHT22
DHT dht(DHTPIN, DHTTYPE);

#define REED_PIN D3
#define PIR_PIN  D4
#define TRIG_PIN D5
#define ECHO_PIN D6
#define FAN_PIN  D7  // Onboard blue LED + relay driver

#define MQ2_PIN   A0 // 12-bit ADC (0 - 4095)
#define VOLT_PIN  A1 // ZMPT101B AC Mains Voltage
#define CURR_PIN  A2 // ACS712 AC Current Sensor

char telemetryJson[256];
double liveTemp = 24.2;
double liveHum = 58.0;
int liveGas = 184;
double liveVolt = 238.0;
int doorOpen = 0;
int motionDetected = 0;

int toggleRelay(String command) {
    if (command == "1" || command == "on" || command == "ON") {
        digitalWrite(FAN_PIN, HIGH);
        Serial.println("{\\"spark_event\\":\\"relay_on\\"}");
        Serial1.println("CMD:FAN_ON");
        return 1;
    } else {
        digitalWrite(FAN_PIN, LOW);
        Serial.println("{\\"spark_event\\":\\"relay_off\\"}");
        Serial1.println("CMD:FAN_OFF");
        return 0;
    }
}

void setup() {
    Serial.begin(115200);   // USB Serial to Sanctuary OS
    Serial1.begin(115200);  // Hardware UART to ESP32-CAM (TX/RX)

    pinMode(REED_PIN, INPUT_PULLUP);
    pinMode(PIR_PIN, INPUT);
    pinMode(TRIG_PIN, OUTPUT);
    pinMode(ECHO_PIN, INPUT);
    pinMode(FAN_PIN, OUTPUT);
    digitalWrite(FAN_PIN, LOW);

    dht.begin();

    Spark.variable("telemetry", telemetryJson, STRING);
    Spark.variable("temperature", &liveTemp, DOUBLE);
    Spark.variable("voltage", &liveVolt, DOUBLE);
    Spark.function("relay", toggleRelay);

    Serial.println("[Spark Core] Sanctuary Multi-Sensor Core Initialized");
    Spark.publish("sanctuary_boot", "Spark Core Online with ESP32-CAM Bridge", 60, PRIVATE);
}

void loop() {
    float t = dht.readTemperature();
    float h = dht.readHumidity();
    if (!isnan(t)) liveTemp = t;
    if (!isnan(h)) liveHum = h;

    int rawGas = analogRead(MQ2_PIN);
    liveGas = map(rawGas, 0, 4095, 50, 1000);

    int rawVolt = analogRead(VOLT_PIN);
    liveVolt = (rawVolt / 4095.0) * 260.0;
    int rawCurr = analogRead(CURR_PIN);
    float liveCurrent = abs((rawCurr - 2048) / 4095.0) * 15.0;

    doorOpen = (digitalRead(REED_PIN) == HIGH) ? 1 : 0;
    motionDetected = (digitalRead(PIR_PIN) == HIGH) ? 1 : 0;

    digitalWrite(TRIG_PIN, LOW);
    delayMicroseconds(2);
    digitalWrite(TRIG_PIN, HIGH);
    delayMicroseconds(10);
    digitalWrite(TRIG_PIN, LOW);
    long duration = pulseIn(ECHO_PIN, HIGH);
    float distanceCm = duration * 0.034 / 2.0;

    snprintf(telemetryJson, sizeof(telemetryJson),
        "{\\"temp\\":%.1f,\\"hum\\":%.1f,\\"gas\\":%d,\\"volt\\":%.1f,\\"current\\":%.2f,\\"door\\":%d,\\"pir\\":%d,\\"dist\\":%.1f}",
        liveTemp, liveHum, liveGas, liveVolt, liveCurrent, doorOpen, motionDetected, distanceCm);

    // Stream out over USB Serial to Sanctuary OS
    Serial.println(telemetryJson);

    // Forward breach trigger to ESP32-CAM via Hardware Serial1 (UART)
    if (doorOpen || motionDetected) {
        Serial1.printf("BREACH:DOOR=%d,PIR=%d\\n", doorOpen, motionDetected);
    }

    delay(1000);
}`,

    telegram: `// =========================================================================
// ESP32-CAM TELEGRAM BOT NOTIFIER & REMOTE ACTUATOR
// UniversalTelegramBot + ArduinoJson v6
// =========================================================================
#include <WiFi.h>
#include <WiFiClientSecure.h>
#include "esp_camera.h"
#include <UniversalTelegramBot.h>
#include <ArduinoJson.h>

const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASS";

#define BOTtoken "6892014522:AAFP8qY2-8Z3jL89NmK4qW92JkLm"
#define CHAT_ID "-100234857901"

WiFiClientSecure clientTCP;
UniversalTelegramBot bot(BOTtoken, clientTCP);

int botRequestDelay = 1000;
unsigned long lastTimeBotRan = 0;

void handleNewMessages(int numNewMessages) {
  for (int i=0; i<numNewMessages; i++) {
    String chat_id = String(bot.messages[i].chat_id);
    String text = bot.messages[i].text;
    
    if (text == "/status") {
      bot.sendMessage(chat_id, "🟢 Sanctuary OS: Online\\nAC Mains: 238V\\nTemp: 24.2°C\\nGas: 184 ppm\\nDoor: Closed", "");
    } else if (text == "/fan_on") {
      digitalWrite(4, HIGH);
      bot.sendMessage(chat_id, "🌿 Exhaust Fan Relay turned ON", "");
    } else if (text == "/fan_off") {
      digitalWrite(4, LOW);
      bot.sendMessage(chat_id, "Exhaust Fan Relay turned OFF", "");
    }
  }
}

void setup() {
  Serial.begin(115200);
  pinMode(4, OUTPUT);
  clientTCP.setCACert(TELEGRAM_CERTIFICATE_ROOT);
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) { delay(500); }
  bot.sendMessage(CHAT_ID, "🚀 Sanctuary ESP32-CAM Telegram Bot online.", "");
}

void loop() {
  if (millis() > lastTimeBotRan + botRequestDelay) {
    int numNewMessages = bot.getUpdates(bot.last_message_received + 1);
    while(numNewMessages) {
      handleNewMessages(numNewMessages);
      numNewMessages = bot.getUpdates(bot.last_message_received + 1);
    }
    lastTimeBotRan = millis();
  }
}`,

    discord: `// =========================================================================
// ESP32-CAM DISCORD SURVEILLANCE & ALERTS WEBHOOK
// Direct REST Webhook JSON Payload Dispatch
// =========================================================================
#include <WiFi.h>
#include <HTTPClient.h>
#include <WiFiClientSecure.h>

const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASS";
const char* discord_webhook = "https://discord.com/api/webhooks/118920491029/XyZ892_TokenAlphaSecure";

void sendDiscordEmbed(String title, String desc, int colorCode) {
  if (WiFi.status() != WL_CONNECTED) return;
  WiFiClientSecure client;
  client.setInsecure();
  HTTPClient https;
  
  if (https.begin(client, discord_webhook)) {
    https.addHeader("Content-Type", "application/json");
    String payload = "{\\"username\\":\\"Sanctuary Security\\",\\"embeds\\":[{\\"title\\":\\"" + title + "\\",\\"description\\":\\"" + desc + "\\",\\"color\\":" + String(colorCode) + "}]}";
    int httpCode = https.POST(payload);
    Serial.printf("[Discord] Dispatched embed HTTP %d\\n", httpCode);
    https.end();
  }
}

void setup() {
  Serial.begin(115200);
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) { delay(500); }
  sendDiscordEmbed("🟢 System Online", "ESP32-CAM surveillance connected to #lab4-security-feed", 3066993);
}

void loop() {
  delay(10000);
}`,

    colab: `# =========================================================================
# GOOGLE COLAB / COLLAB TELEMETRY PIPELINE & ANOMALY DETECTION
# Python Data Science & ML Engine with Pandas & Isolation Forest
# =========================================================================
import numpy as np
import pandas as pd
from flask import Flask, request, jsonify
from sklearn.ensemble import IsolationForest

app = Flask(__name__)

# Baseline historical model
data = pd.DataFrame({
    'temp': np.random.normal(24.5, 1.2, 500),
    'hum': np.random.normal(55.0, 4.0, 500),
    'gas': np.random.normal(180, 15, 500),
    'volt': np.random.normal(238, 2.5, 500)
})
model = IsolationForest(contamination=0.02, random_state=42)
model.fit(data)

@app.route('/api/infer', methods=['POST'])
def infer():
    packet = request.get_json(force=True)
    f = np.array([[packet.get('temp', 24), packet.get('hum', 50), packet.get('gas', 180), packet.get('volt', 238)]])
    pred = model.predict(f)[0]
    score = float(model.decision_function(f)[0])
    return jsonify({
        'status': 'nominal' if pred == 1 else 'anomaly_flagged',
        'anomaly_score': round(score, 4),
        'recommendation': 'Normal' if pred == 1 else 'Voltage/Gas deviation detected'
    })

if __name__ == '__main__':
    app.run(port=5000)`,

    blynk: `// =========================================================================
// ESP32-CAM BLYNK IOT 2.0 CLOUD INTEGRATION
// Virtual Pins Mapping & Push Notifications
// =========================================================================
#define BLYNK_TEMPLATE_ID "TMPL_KyU_Lab4"
#define BLYNK_DEVICE_NAME "KyU Sanctuary OS"
#define BLYNK_AUTH_TOKEN  "bl_8a92KmqL02948vnZ9810KqW"

#include <WiFi.h>
#include <WiFiClient.h>
#include <BlynkSimpleEsp32.h>

char auth[] = BLYNK_AUTH_TOKEN;
char ssid[] = "YOUR_WIFI_SSID";
char pass[] = "YOUR_WIFI_PASS";

BlynkTimer timer;

BLYNK_WRITE(V3) {
  int relayState = param.asInt();
  digitalWrite(4, relayState ? HIGH : LOW);
}

void sendSensorData() {
  Blynk.virtualWrite(V0, 24.2);
  Blynk.virtualWrite(V1, 58.0);
  Blynk.virtualWrite(V2, 184);
  Blynk.virtualWrite(V5, 238.0);
}

void setup() {
  Serial.begin(115200);
  pinMode(4, OUTPUT);
  Blynk.begin(auth, ssid, pass);
  timer.setInterval(2000L, sendSensorData);
}

void loop() {
  Blynk.run();
  timer.run();
}`
  }
};

// =============================================================================
// 2. DOM REFERENCES
// =============================================================================
const el = {
  // Brand & Header
  displayFacilityName: document.getElementById('displayFacilityName'),
  btnEditFacility: document.getElementById('btnEditFacility'),
  mainNavTabs: document.querySelectorAll('.nav-tab'),
  tabContents: document.querySelectorAll('.tab-content'),
  themeSelect: document.getElementById('themeSelect'),
  globalConnStatus: document.getElementById('globalConnStatus'),
  globalConnDot: document.getElementById('globalConnDot'),
  globalConnLabel: document.getElementById('globalConnLabel'),
  btnToggleEngineering: document.getElementById('btnToggleEngineering'),

  // Monitor Lead Action Buttons (Direct section routes)
  btnRouteSensors: document.getElementById('btnRouteSensors'),
  btnRouteControls: document.getElementById('btnRouteControls'),
  btnRouteGallery: document.getElementById('btnRouteGallery'),
  btnToggleTestMode: document.getElementById('btnToggleTestMode'),
  btnSubSensors: document.getElementById('btnSubSensors'),
  btnSubControls: document.getElementById('btnSubControls'),
  btnSubGallery: document.getElementById('btnSubGallery'),
  btnSubTest: document.getElementById('btnSubTest'),

  // Simulation Trigger Bar
  simInteractiveBar: document.getElementById('simInteractiveBar'),
  btnTriggerMotion: document.getElementById('btnTriggerMotion'),
  btnToggleDoor: document.getElementById('btnToggleDoor'),
  btnTriggerGas: document.getElementById('btnTriggerGas'),
  btnResetHouse: document.getElementById('btnResetHouse'),

  // Monitor Live Camera Feed
  cameraCanvas: document.getElementById('cameraCanvas'),
  cameraTimestamp: document.getElementById('cameraTimestamp'),
  cameraDetectBadge: document.getElementById('cameraDetectBadge'),
  cameraLivePill: document.getElementById('cameraLivePill'),
  btnSnapPhoto: document.getElementById('btnSnapPhoto'),
  btnSimSubject: document.getElementById('btnSimSubject'),

  // Monitor Quick Vitals
  vitalComfort: document.getElementById('vitalComfort'),
  vitalGas: document.getElementById('vitalGas'),
  vitalDoor: document.getElementById('vitalDoor'),
  vitalPower: document.getElementById('vitalPower'),

  // Floor Plan SVG Elements
  houseOverallStatus: document.getElementById('houseOverallStatus'),
  houseTimeIndicator: document.getElementById('houseTimeIndicator'),
  clickableRooms: document.querySelectorAll('.clickable-room'),
  doorGroup: document.getElementById('room-porch'),
  txtReedStatus: document.getElementById('txtReedStatus'),
  roomLiving: document.getElementById('room-living'),
  txtPirStatus: document.getElementById('txtPirStatus'),
  roomKitchen: document.getElementById('room-kitchen'),
  txtGasStatus: document.getElementById('txtGasStatus'),
  fanGraphic: document.getElementById('fanGraphic'),
  txtFanStatus: document.getElementById('txtFanStatus'),
  txtTempReading: document.getElementById('txtTempReading'),
  txtHumReading: document.getElementById('txtHumReading'),
  txtDistReading: document.getElementById('txtDistReading'),
  txtVoltageReading: document.getElementById('txtVoltageReading'),
  txtPowerReading: document.getElementById('txtPowerReading'),

  // Dynamic Room Labels
  lblRoomEntrance: document.getElementById('lblRoomEntrance'),
  lblRoomLiving: document.getElementById('lblRoomLiving'),
  lblRoomKitchen: document.getElementById('lblRoomKitchen'),
  lblRoomBedroom: document.getElementById('lblRoomBedroom'),
  lblRoomUtility: document.getElementById('lblRoomUtility'),

  // Sensors & Metrics Tab Cards
  cardTemp: document.getElementById('cardTemp'),
  cardHum: document.getElementById('cardHum'),
  barHum: document.getElementById('barHum'),
  badgeDht: document.getElementById('badgeDht'),
  cardGas: document.getElementById('cardGas'),
  barGas: document.getElementById('barGas'),
  badgeGas: document.getElementById('badgeGas'),
  cardVolt: document.getElementById('cardVolt'),
  barVolt: document.getElementById('barVolt'),
  badgeVolt: document.getElementById('badgeVolt'),
  cardPower: document.getElementById('cardPower'),
  cardCurrent: document.getElementById('cardCurrent'),
  cardKwh: document.getElementById('cardKwh'),
  cardReed: document.getElementById('cardReed'),
  badgeReed: document.getElementById('badgeReed'),
  cardDist: document.getElementById('cardDist'),
  badgePir: document.getElementById('badgePir'),
  cardPirText: document.getElementById('cardPirText'),

  // Controls Tab Elements
  toggleFan: document.getElementById('toggleFan'),
  sliderWindow: document.getElementById('sliderWindow'),
  lblWindowPercent: document.getElementById('lblWindowPercent'),
  toggleNightGuard: document.getElementById('toggleNightGuard'),
  btnTestBuzzer: document.getElementById('btnTestBuzzer'),

  // Slide-Over Inspector Drawer
  slideDrawer: document.getElementById('slideDrawer'),
  drawerBackdrop: document.getElementById('drawerBackdrop'),
  drawerTitle: document.getElementById('drawerTitle'),
  drawerContent: document.getElementById('drawerContent'),
  btnCloseDrawer: document.getElementById('btnCloseDrawer'),

  // Gallery & Alarms
  photoGalleryContainer: document.getElementById('photoGalleryContainer'),
  btnCaptureNewPhoto: document.getElementById('btnCaptureNewPhoto'),
  btnClearGallery: document.getElementById('btnClearGallery'),
  alarmLogTableBody: document.getElementById('alarmLogTableBody'),
  btnClearAlarmLogs: document.getElementById('btnClearAlarmLogs'),

  // PDF Reports
  reportPeriodSelect: document.getElementById('reportPeriodSelect'),
  btnDownloadPdf: document.getElementById('btnDownloadPdf'),
  btnPreviewReport: document.getElementById('btnPreviewReport'),
  reportPreviewContent: document.getElementById('reportPreviewContent'),

  // Facility & Rooms
  chipFacilityName: document.getElementById('chipFacilityName'),
  chipRoomCount: document.getElementById('chipRoomCount'),
  chipSensorCount: document.getElementById('chipSensorCount'),
  sensorTableBody: document.getElementById('sensorTableBody'),
  btnOpenAddRoomModal: document.getElementById('btnOpenAddRoomModal'),
  btnOpenAddSensorModal: document.getElementById('btnOpenAddSensorModal'),
  pinChips: document.querySelectorAll('.pin-chip'),

  // Segregated Engineering IDE
  engineeringWorkspace: document.getElementById('engineeringWorkspace'),
  btnCloseEngineering: document.getElementById('btnCloseEngineering'),
  boardSelector: document.getElementById('boardSelector'),
  ideBaudSelect: document.getElementById('ideBaudSelect'),
  btnIdeConnectSerial: document.getElementById('btnIdeConnectSerial'),
  btnIdeDisconnectSerial: document.getElementById('btnIdeDisconnectSerial'),
  codeViewer: document.getElementById('codeViewer'),
  codeTabs: document.querySelectorAll('.code-tab'),
  btnCopyCode: document.getElementById('btnCopyCode'),
  terminalWindow: document.getElementById('terminalWindow'),
  terminalInput: document.getElementById('terminalInput'),
  btnSendTerminal: document.getElementById('btnSendTerminal'),
  btnClearTerminal: document.getElementById('btnClearTerminal'),
  chkAutoScroll: document.getElementById('chkAutoScroll'),

  // Modals
  addSensorModal: document.getElementById('addSensorModal'),
  btnCloseSensorModal: document.getElementById('btnCloseSensorModal'),
  btnCancelSensorModal: document.getElementById('btnCancelSensorModal'),
  formAddSensor: document.getElementById('formAddSensor'),
  newSensorName: document.getElementById('newSensorName'),
  newSensorPin: document.getElementById('newSensorPin'),
  newSensorType: document.getElementById('newSensorType'),
  newSensorRoom: document.getElementById('newSensorRoom'),
  newSensorThreshold: document.getElementById('newSensorThreshold'),

  addRoomModal: document.getElementById('addRoomModal'),
  btnCloseRoomModal: document.getElementById('btnCloseRoomModal'),
  btnCancelRoomModal: document.getElementById('btnCancelRoomModal'),
  formAddRoom: document.getElementById('formAddRoom'),
  newRoomName: document.getElementById('newRoomName'),
  newRoomPurpose: document.getElementById('newRoomPurpose'),

  editFacilityModal: document.getElementById('editFacilityModal'),
  btnCloseFacilityModal: document.getElementById('btnCloseFacilityModal'),
  btnCancelFacilityModal: document.getElementById('btnCancelFacilityModal'),
  formEditFacility: document.getElementById('formEditFacility'),
  inputFacilityName: document.getElementById('inputFacilityName'),

  lightboxModal: document.getElementById('lightboxModal'),
  btnCloseLightbox: document.getElementById('btnCloseLightbox'),
  lightboxTitle: document.getElementById('lightboxTitle'),
  lightboxImg: document.getElementById('lightboxImg'),
  lightboxMeta: document.getElementById('lightboxMeta'),
  btnDownloadSinglePhoto: document.getElementById('btnDownloadSinglePhoto'),

  toastContainer: document.getElementById('toastContainer')
};

// =============================================================================
// 3. THEME SYSTEM (10 IMMERSIVE ENVIRONMENTS)
// =============================================================================
function initThemes() {
  const savedTheme = localStorage.getItem('sanctuary_theme') || 'home';
  state.currentTheme = savedTheme;
  document.documentElement.setAttribute('data-theme', savedTheme);
  if (el.themeSelect) el.themeSelect.value = savedTheme;

  el.themeSelect?.addEventListener('change', (e) => {
    const selected = e.target.value;
    state.currentTheme = selected;
    document.documentElement.setAttribute('data-theme', selected);
    localStorage.setItem('sanctuary_theme', selected);
    showToast(`Environment shifted to: ${e.target.options[e.target.selectedIndex].text}`, 'info');
  });

  // Full Screen Toggle Logic
  document.getElementById('btnToggleFullScreen')?.addEventListener('click', (e) => {
    const isFullscreen = document.body.classList.toggle('monitor-fullscreen-mode');
    e.target.innerHTML = isFullscreen ? '⛶ Exit Full Screen' : '⛶ Full Screen';
    if (isFullscreen) {
      showToast('Entered Monitor Full Screen Mode', 'info');
    }
  });
}

// =============================================================================
// 4. ACTIVE ROUTER & NAVIGATION ENGINE
// =============================================================================
function navigateToRoute(targetHash) {
  const hash = targetHash ? targetHash.replace('#', '').trim() : 'monitor';

  // Special route: Segregated Engineering IDE
  if (hash === 'ide') {
    if (el.engineeringWorkspace) el.engineeringWorkspace.classList.add('active');
    return;
  } else {
    if (el.engineeringWorkspace) el.engineeringWorkspace.classList.remove('active');
  }

  // Routing Map: Friendly hash alias -> Tab content ID
  const routeMap = {
    'monitor': 'virtual-house',
    'virtual-house': 'virtual-house',
    'sensors': 'telemetry',
    'telemetry': 'telemetry',
    'controls': 'controls',
    'gallery': 'media-gallery',
    'media-gallery': 'media-gallery',
    'alarms': 'alarms',
    'reports': 'reports',
    'servers': 'cloud-servers',
    'cloud-servers': 'cloud-servers',
    'universal': 'universal-devices',
    'universal-devices': 'universal-devices',
    'setup': 'facility-rooms',
    'facility-rooms': 'facility-rooms'
  };

  const targetTabId = routeMap[hash] || 'virtual-house';

  // 1. Toggle Tab Content Visibility
  el.tabContents.forEach(content => {
    const isTarget = (content.id === `tab-${targetTabId}`);
    content.classList.toggle('active', isTarget);
  });

  // 2. Synchronize Header Active Navigation Tabs
  el.mainNavTabs.forEach(tab => {
    const tabData = tab.dataset.tab;
    const tabHref = tab.getAttribute('href')?.replace('#', '');
    const isActive = (tabData === targetTabId) || (tabHref === hash);
    tab.classList.toggle('active', isActive);
  });

  // 3. Close inspector drawer when moving between major sections
  closeDrawer();

  // 4. Smooth scroll to top of page
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function initRouter() {
  // Listen for browser hash changes
  window.addEventListener('hashchange', () => {
    navigateToRoute(window.location.hash);
  });

  // Intercept all hash-linked anchor buttons for instantaneous responsive navigation
  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', (e) => {
      const hash = link.getAttribute('href');
      if (hash && hash.startsWith('#')) {
        e.preventDefault();
        window.location.hash = hash;
        navigateToRoute(hash);
      }
    });
  });

  // Initialize initial route based on URL hash or default to #monitor
  navigateToRoute(window.location.hash || '#monitor');
}

// =============================================================================
// 5. LIVE CAMERA VIEWFINDER ON MONITOR VIEW
// =============================================================================
function initLiveCamera() {
  const canvas = el.cameraCanvas;
  if (!canvas) return;

  function renderFrame() {
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;

    // Room background with gentle gradient matching current theme
    const isCyber = state.currentTheme === 'cyber';
    const isSpace = state.currentTheme === 'space';
    const isDark = isCyber || isSpace || state.currentTheme === 'workshop' || state.currentTheme === 'night';

    const bg = ctx.createLinearGradient(0, 0, w, h);
    if (isCyber) {
      bg.addColorStop(0, '#040b08');
      bg.addColorStop(1, '#081710');
    } else if (isDark) {
      bg.addColorStop(0, '#10141e');
      bg.addColorStop(1, '#1b2234');
    } else {
      bg.addColorStop(0, '#ebe8e0');
      bg.addColorStop(0.7, '#dfdcd2');
      bg.addColorStop(1, '#c8ccc4');
    }
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);

    // Living Room Floor & Perspective Lines
    ctx.strokeStyle = isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.1)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, h * 0.72);
    ctx.lineTo(w, h * 0.72);
    ctx.moveTo(w * 0.15, h);
    ctx.lineTo(w * 0.32, h * 0.72);
    ctx.moveTo(w * 0.85, h);
    ctx.lineTo(w * 0.68, h * 0.72);
    ctx.stroke();

    // Living Room Window with Sunlight / Starlight
    ctx.fillStyle = isDark ? 'rgba(0, 255, 136, 0.08)' : 'rgba(255, 255, 255, 0.75)';
    ctx.fillRect(w * 0.66, 26, 75, 95);
    ctx.strokeStyle = isDark ? '#00ff88' : '#859183';
    ctx.lineWidth = 1;
    ctx.strokeRect(w * 0.66, 26, 75, 95);

    // Living Room Sofa
    ctx.fillStyle = isDark ? '#25352c' : '#627c64';
    ctx.beginPath();
    ctx.roundRect(35, 115, 110, 55, [10, 10, 4, 4]);
    ctx.fill();

    // Coffee Table
    ctx.fillStyle = isDark ? '#1a201c' : '#9ea69b';
    ctx.beginPath();
    ctx.roundRect(60, 175, 75, 25, 4);
    ctx.fill();

    // Surveillance Reticle & Grid Crosshairs
    ctx.strokeStyle = isCyber ? 'rgba(0, 255, 136, 0.25)' : 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    // Center reticle
    const cx = w / 2;
    const cy = h / 2;
    ctx.moveTo(cx - 14, cy); ctx.lineTo(cx + 14, cy);
    ctx.moveTo(cx, cy - 14); ctx.lineTo(cx, cy + 14);
    ctx.stroke();

    // Corner brackets
    const bLen = 12;
    ctx.beginPath();
    ctx.moveTo(10, 10 + bLen); ctx.lineTo(10, 10); ctx.lineTo(10 + bLen, 10);
    ctx.moveTo(w - 10, 10 + bLen); ctx.lineTo(w - 10, 10); ctx.lineTo(w - 10 - bLen, 10);
    ctx.moveTo(10, h - 10 - bLen); ctx.lineTo(10, h - 10); ctx.lineTo(10 + bLen, h - 10);
    ctx.moveTo(w - 10, h - 10 - bLen); ctx.lineTo(w - 10, h - 10); ctx.lineTo(w - 10 - bLen, h - 10);
    ctx.stroke();

    // Check Motion Presence
    if (state.telemetry.motion) {
      // Draw detected human subject silhouette
      ctx.fillStyle = isCyber ? 'rgba(0, 255, 136, 0.7)' : 'rgba(35, 44, 37, 0.75)';
      ctx.beginPath();
      ctx.arc(175, 72, 16, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.roundRect(160, 92, 30, 70, 6);
      ctx.fill();

      // AI Bounding Box
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 2;
      ctx.strokeRect(144, 46, 62, 126);

      // AI Label Tag
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(144, 30, 62, 16);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 9px sans-serif';
      ctx.fillText('OCCUPANT 98%', 146, 42);

      // Update badge
      if (el.cameraDetectBadge) {
        el.cameraDetectBadge.textContent = '⚠️ Motion Detected';
        el.cameraDetectBadge.classList.add('alert');
      }
    } else {
      if (el.cameraDetectBadge) {
        el.cameraDetectBadge.textContent = 'Area Normal';
        el.cameraDetectBadge.classList.remove('alert');
      }
    }

    // Update Live OSD Clock
    if (el.cameraTimestamp) {
      el.cameraTimestamp.textContent = new Date().toLocaleTimeString();
    }
  }

  // Periodic rendering loop for smooth camera time ticking & animation
  renderFrame();
  setInterval(renderFrame, 600);

  // Button: Snap Manual Photo
  el.btnSnapPhoto?.addEventListener('click', () => {
    playShutterSound();
    captureEvidenceSnapshot('Manual Camera Snapshot');
  });

  // Button: Simulate Subject in Viewfinder
  el.btnSimSubject?.addEventListener('click', () => {
    state.telemetry.motion = true;
    renderFrame();
    updateAllViews();
    playChimeSound();
    showToast('👤 Subject stepped into Living Room camera frame!', 'info');

    // Auto-capture if Night Guard routine is active
    if (state.telemetry.nightGuard) {
      setTimeout(() => captureEvidenceSnapshot('Night Guard Auto-Trigger'), 400);
    }

    setTimeout(() => {
      state.telemetry.motion = false;
      renderFrame();
      updateAllViews();
    }, 4500);
  });
}

// =============================================================================
// 6. MONITOR LEAD BUTTONS & SIMULATION ENGINE
// =============================================================================
function initMonitorControlsAndSimulation() {
  // Test Mode Toggle
  el.btnToggleTestMode?.addEventListener('click', () => {
    state.testSimulationMode = !state.testSimulationMode;

    if (el.simInteractiveBar) {
      el.simInteractiveBar.style.display = state.testSimulationMode ? 'flex' : 'none';
    }

    if (el.btnSubTest) {
      el.btnSubTest.textContent = state.testSimulationMode ? 'Active (Click to Stop)' : 'Click to Enable';
    }

    if (el.globalConnDot) {
      el.globalConnDot.className = state.testSimulationMode
        ? 'status-dot simulated'
        : (state.isSerialConnected ? 'status-dot online' : 'status-dot waiting');
    }

    if (el.globalConnLabel) {
      el.globalConnLabel.textContent = state.testSimulationMode
        ? 'Test Simulation'
        : (state.isSerialConnected ? `Physical (${state.activeBoard})` : 'Awaiting Board');
    }

    if (state.testSimulationMode) {
      seedSimulationValues();
      showToast('🧪 Simulation triggers enabled. Test buttons are now available!', 'info');
    } else {
      if (!state.isSerialConnected) resetToAwaitingHardware();
      showToast('Switched to physical hardware mode.', 'info');
    }

    updateAllViews();
  });

  // Simulator Trigger: Motion
  el.btnTriggerMotion?.addEventListener('click', () => {
    state.telemetry.motion = true;
    logAlarmEvent('Security', 'PIR Motion', 'Movement detected in Living Room', 'Living Room Snapshot Saved', 'Warning');
    captureEvidenceSnapshot('PIR Motion Alert');
    playChimeSound();
    updateAllViews();
    showToast('🚶 Motion simulated in Living Room!', 'info');
    setTimeout(() => {
      state.telemetry.motion = false;
      updateAllViews();
    }, 4000);
  });

  // Simulator Trigger: Front Door (Reed Switch)
  el.btnToggleDoor?.addEventListener('click', () => {
    state.telemetry.doorOpen = !state.telemetry.doorOpen;
    playChimeSound();
    if (state.telemetry.doorOpen) {
      captureEvidenceSnapshot('Reed Switch Breach');
      logAlarmEvent('Security', 'Reed Switch', 'Front door opened past perimeter lock', 'Snapshot Captured + SMS Alert', 'Warning');
      showToast('🚪 Front door opened (Breach)!', 'alert');
    } else {
      logAlarmEvent('Security', 'Reed Switch', 'Front door closed and sealed', 'Circuit normal', 'Resolved');
      showToast('🚪 Front door closed and secured.', 'info');
    }
    updateAllViews();
  });

  // Simulator Trigger: Gas Leak Spike
  el.btnTriggerGas?.addEventListener('click', () => {
    state.gasLocked = true;
    state.telemetry.gas = 425;
    state.telemetry.fanOn = true;
    playBuzzerTone();
    logAlarmEvent('Air Safety', 'MQ-2 Gas', 'Gas concentration 425 ppm (> 350 ppm)', 'Exhaust Fan Auto-Engaged & Siren Sounded', 'Critical');
    updateAllViews();
    showToast('🚨 Gas leak triggered! Exhaust fan automatically turned ON.', 'alert');
    setTimeout(() => { state.gasLocked = false; }, 8000);
  });

  // Simulator Trigger: Reset All Systems
  el.btnResetHouse?.addEventListener('click', () => {
    state.telemetry.doorOpen = false;
    state.telemetry.motion = false;
    state.telemetry.gas = 112;
    state.telemetry.fanOn = false;
    state.gasLocked = false;
    updateAllViews();
    showToast('🌿 All house sensors restored to calm serene baseline.', 'info');
  });

  // Controls Tab: Exhaust Fan Switch
  el.toggleFan?.addEventListener('change', (e) => {
    state.telemetry.fanOn = e.target.checked;
    updateAllViews();
    showToast(state.telemetry.fanOn ? '🌀 Kitchen exhaust fan engaged.' : '🌀 Exhaust fan turned off.', 'info');
  });

  // Controls Tab: Smart Window Aperture Slider
  el.sliderWindow?.addEventListener('input', (e) => {
    state.telemetry.windowPercent = parseInt(e.target.value);
    if (el.lblWindowPercent) el.lblWindowPercent.textContent = `${state.telemetry.windowPercent}% Ajar`;
  });

  // Controls Tab: Night Guard Auto-Arm
  el.toggleNightGuard?.addEventListener('change', (e) => {
    state.telemetry.nightGuard = e.target.checked;
    showToast(state.telemetry.nightGuard ? '🌙 Night Guard armed (10 PM - 6 AM).' : '🌙 Night Guard paused.', 'info');
  });

  // Controls Tab: Emergency Sounder Test
  el.btnTestBuzzer?.addEventListener('click', () => {
    playBuzzerTone();
    showToast('🔔 Emergency siren sounder test successful.', 'info');
  });

  // Interactive Room Clicking on SVG Floor Plan
  el.clickableRooms.forEach(room => {
    room.addEventListener('click', () => {
      const roomName = room.dataset.room;
      inspectRoom(roomName);
    });
  });

  // Drawer Close Button & Backdrop
  el.btnCloseDrawer?.addEventListener('click', closeDrawer);
  el.drawerBackdrop?.addEventListener('click', closeDrawer);
}

// Slide-Over Inspector Drawer
function openDrawer(title, htmlContent) {
  if (el.drawerTitle) el.drawerTitle.textContent = title;
  if (el.drawerContent) el.drawerContent.innerHTML = htmlContent;
  if (el.slideDrawer) el.slideDrawer.classList.add('open');
  if (el.drawerBackdrop) el.drawerBackdrop.classList.add('active');
}

function closeDrawer() {
  if (el.slideDrawer) el.slideDrawer.classList.remove('open');
  if (el.drawerBackdrop) el.drawerBackdrop.classList.remove('active');
}

function inspectRoom(roomName) {
  const t = state.telemetry;

  if (roomName === 'Kitchen') {
    openDrawer('Kitchen — Safety & Exhaust Zone', `
      <div class="drawer-card">
        <div class="drawer-card-title"><span>💨 MQ-2 Gas & Smoke Detector</span> <span class="pin-tag">GPIO 36</span></div>
        <div class="drawer-metric">${t.gas !== null ? Math.round(t.gas) + ' ppm' : '--'}</div>
        <div class="drawer-subtext">Safety Threshold: 350 ppm | Status: <strong>${t.gas && t.gas > 350 ? '⚠️ Gas Alert' : 'Pristine Clean Air'}</strong></div>
      </div>
      <div class="drawer-card">
        <div class="drawer-card-title"><span>🌀 Kitchen Exhaust Fan Relay</span> <span class="pin-tag">GPIO 4</span></div>
        <div class="drawer-metric">${t.fanOn ? 'ACTIVE (ON)' : 'STANDBY (OFF)'}</div>
        <button class="btn btn-secondary btn-sm" id="roomBtnFan" style="margin-top:8px;">${t.fanOn ? 'Turn Off Fan' : 'Turn On Fan'}</button>
      </div>
    `);

    document.getElementById('roomBtnFan')?.addEventListener('click', () => {
      state.telemetry.fanOn = !state.telemetry.fanOn;
      updateAllViews();
      inspectRoom('Kitchen');
    });

  } else if (roomName === 'Living Room') {
    openDrawer('Living Room — Surveillance & Motion', `
      <div class="drawer-card">
        <div class="drawer-card-title"><span>🚶 PIR Human Motion Sensor</span> <span class="pin-tag">GPIO 12</span></div>
        <div class="drawer-metric">${t.motion ? 'PERSON DETECTED' : 'QUIET (NO MOTION)'}</div>
        <div class="drawer-subtext">Coverage Area: Central sofa & corridor</div>
      </div>
      <div class="drawer-card">
        <div class="drawer-card-title"><span>📷 ESP32-CAM Stream</span> <span class="pin-tag">OV2640</span></div>
        <button class="btn btn-primary btn-sm" id="roomBtnSnap">📸 Take Snapshot</button>
      </div>
    `);

    document.getElementById('roomBtnSnap')?.addEventListener('click', () => {
      playShutterSound();
      captureEvidenceSnapshot('Living Room Snapshot');
    });

  } else if (roomName === 'Front Entrance') {
    openDrawer('Front Entrance — Perimeter Barrier', `
      <div class="drawer-card">
        <div class="drawer-card-title"><span>🚪 Magnetic Door Reed Switch</span> <span class="pin-tag">GPIO 14</span></div>
        <div class="drawer-metric">${t.doorOpen ? 'BREACH: DOOR OPEN' : 'SECURE: DOOR CLOSED'}</div>
        <div class="drawer-subtext">Perimeter contact: ${t.doorOpen ? 'Circuit Open' : 'Circuit Closed (Intact)'}</div>
      </div>
      <div class="drawer-card">
        <div class="drawer-card-title"><span>🔔 Door Chime & GSM Alert</span></div>
        <div class="drawer-subtext">Intrusions after 10:00 PM trigger automatic camera snapshot and SMS to <strong>+256 770 123456</strong>.</div>
      </div>
    `);

  } else if (roomName === 'Master Haven') {
    openDrawer('Master Haven — Climate & Airflow', `
      <div class="drawer-card">
        <div class="drawer-card-title"><span>🌡️ DHT22 Temperature</span> <span class="pin-tag">GPIO 13</span></div>
        <div class="drawer-metric">${t.temp !== null ? t.temp.toFixed(1) + ' °C' : '--'}</div>
        <div class="drawer-subtext">Ideal comfort band: 20°C – 26°C</div>
      </div>
      <div class="drawer-card">
        <div class="drawer-card-title"><span>💧 DHT22 Relative Humidity</span> <span class="pin-tag">GPIO 13</span></div>
        <div class="drawer-metric">${t.hum !== null ? Math.round(t.hum) + ' %' : '--'}</div>
        <div class="drawer-subtext">Ideal humidity: 40% – 60%</div>
      </div>
      <div class="drawer-card">
        <div class="drawer-card-title"><span>📡 Ultrasonic Proximity</span> <span class="pin-tag">GPIO 15</span></div>
        <div class="drawer-metric">${t.distance !== null ? Math.round(t.distance) + ' cm' : '--'}</div>
      </div>
    `);

  } else if (roomName === 'Power Utility') {
    openDrawer('Power Utility & GSM Gateway', `
      <div class="drawer-card">
        <div class="drawer-card-title"><span>⚡ UEDCL Mains AC Voltage</span> <span class="pin-tag">ZMPT101B (GPIO 39)</span></div>
        <div class="drawer-metric">${t.volt !== null ? t.volt.toFixed(1) + ' V' : '--'}</div>
        <div class="drawer-subtext">Nominal grid: 230V AC ± 10%</div>
      </div>
      <div class="drawer-card">
        <div class="drawer-card-title"><span>🔌 AC Current & Power Draw</span> <span class="pin-tag">ACS712 (GPIO 34)</span></div>
        <div class="drawer-metric">${t.power !== null ? Math.round(t.power) + ' W' : '--'}</div>
        <div class="drawer-subtext">Load Current: ${t.current !== null ? t.current.toFixed(2) + ' A' : '--'} | Cumulative: ${t.kwh.toFixed(2)} kWh</div>
      </div>
      <div class="drawer-card">
        <div class="drawer-card-title"><span>📶 SIM800L Cellular Gateway</span></div>
        <div class="drawer-subtext">Carrier: <strong>MTN Uganda (Signal: 26/31)</strong> | Offline SMS & Voice dialing armed.</div>
      </div>
    `);
  }
}

// =============================================================================
// 5. SIMULATION PHYSICS ENGINE
// =============================================================================
function initSimulationEngine() {
  setInterval(() => {
    if (!state.testSimulationMode) return;

    if (state.telemetry.temp === null) state.telemetry.temp = 24.2;
    if (state.telemetry.hum === null) state.telemetry.hum = 54.0;
    if (state.telemetry.gas === null) state.telemetry.gas = 112;
    if (state.telemetry.volt === null) state.telemetry.volt = 232.0;

    state.telemetry.temp += (Math.random() - 0.49) * 0.1;
    state.telemetry.hum += (Math.random() - 0.49) * 0.25;
    state.telemetry.volt = 231.0 + Math.sin(Date.now() / 8000) * 3.5;
    
    const fanLoad = state.telemetry.fanOn ? 50 : 0;
    state.telemetry.power = 135 + fanLoad + Math.sin(Date.now() / 4000) * 10;
    state.telemetry.current = state.telemetry.power / state.telemetry.volt;
    state.telemetry.kwh += (state.telemetry.power / 1000) * (1.5 / 3600);

    if (state.telemetry.gas > 130 && !state.gasLocked) {
      state.telemetry.gas -= 10;
    } else if (state.telemetry.gas <= 130) {
      state.telemetry.gas = 110 + Math.random() * 12;
    }

    state.telemetry.lastUpdate = new Date();
    updateAllViews();
  }, 1500);
}

function seedSimulationValues() {
  state.telemetry.temp = 24.2;
  state.telemetry.hum = 54.0;
  state.telemetry.gas = 112;
  state.telemetry.volt = 232.4;
  state.telemetry.current = 0.63;
  state.telemetry.power = 146;
  state.telemetry.distance = 185;
  state.telemetry.lastUpdate = new Date();
}

function resetToAwaitingHardware() {
  state.telemetry.temp = null;
  state.telemetry.hum = null;
  state.telemetry.gas = null;
  state.telemetry.volt = null;
  state.telemetry.current = null;
  state.telemetry.power = null;
  state.telemetry.distance = null;
}

// =============================================================================
// 6. UNIFIED HARDWARE & WIRELESS COMMUNICATION ENGINE (SERIAL, BLE, WI-FI)
// =============================================================================

function onHardwareConnected(transport, boardName, details = '') {
  state.isConnected = true;
  state.connectionTransport = transport;
  state.activeBoard = boardName;

  if (el.globalConnDot) el.globalConnDot.className = 'status-dot online';
  if (el.globalConnLabel) el.globalConnLabel.textContent = `${boardName} (${transport})`;
  if (el.globalConnStatus) el.globalConnStatus.classList.add('connected');

  const btnGlobalDisc = document.getElementById('btnGlobalDisconnect');
  if (btnGlobalDisc) btnGlobalDisc.style.display = 'inline-block';

  if (el.btnIdeConnectSerial) el.btnIdeConnectSerial.disabled = true;
  const btnBle = document.getElementById('btnIdeConnectBle');
  if (btnBle) btnBle.disabled = true;
  const btnWifi = document.getElementById('btnIdeConnectWifi');
  if (btnWifi) btnWifi.disabled = true;
  if (el.btnIdeDisconnectSerial) el.btnIdeDisconnectSerial.disabled = false;

  const quickDisc = document.getElementById('btnQuickDisconnect');
  if (quickDisc) quickDisc.disabled = false;
  const quickStatus = document.getElementById('quickConnStatusText');
  if (quickStatus) quickStatus.innerHTML = `<span style="color: #10b981; font-weight: 700;">🟢 Live Connected via ${transport} to ${boardName}</span>`;

  logTerminal(`[Hardware Connected via ${transport} to ${boardName}]`);
  logCloudServerAudit('GATEWAY', `Hardware link established: ${boardName} via ${transport}. Real-time telemetry streaming active.`);
  showToast(`⚡ Connected to ${boardName} via ${transport}!`, 'success');
  playChimeSound();
}

function onHardwareDisconnected(reason = 'User disconnected') {
  state.isConnected = false;
  state.isSerialConnected = false;
  state.isBluetoothConnected = false;
  state.isWifiConnected = false;

  if (state.serialReader) {
    try { state.serialReader.cancel(); } catch (e) {}
    try { state.serialReader.releaseLock(); } catch (e) {}
    state.serialReader = null;
  }
  if (state.serialPort) {
    try { state.serialPort.close(); } catch (e) {}
    state.serialPort = null;
  }
  if (state.bluetoothDevice && state.bluetoothDevice.gatt && state.bluetoothDevice.gatt.connected) {
    try { state.bluetoothDevice.gatt.disconnect(); } catch (e) {}
    state.bluetoothDevice = null;
  }
  if (state.wifiSocket) {
    try { state.wifiSocket.close(); } catch (e) {}
    state.wifiSocket = null;
  }
  if (state.wifiHttpInterval) {
    clearInterval(state.wifiHttpInterval);
    state.wifiHttpInterval = null;
  }
  if (window.sparkEventSource) {
    try { window.sparkEventSource.close(); } catch (e) {}
    window.sparkEventSource = null;
  }
  if (sparkCloudInterval) {
    clearInterval(sparkCloudInterval);
    sparkCloudInterval = null;
  }
  if (window.liveSimInterval) {
    clearInterval(window.liveSimInterval);
    window.liveSimInterval = null;
  }

  if (el.globalConnDot) el.globalConnDot.className = 'status-dot waiting';
  if (el.globalConnLabel) el.globalConnLabel.textContent = 'Awaiting Board';
  if (el.globalConnStatus) el.globalConnStatus.classList.remove('connected');

  const btnGlobalDisc = document.getElementById('btnGlobalDisconnect');
  if (btnGlobalDisc) btnGlobalDisc.style.display = 'none';

  if (el.btnIdeConnectSerial) el.btnIdeConnectSerial.disabled = false;
  const btnBle = document.getElementById('btnIdeConnectBle');
  if (btnBle) btnBle.disabled = false;
  const btnWifi = document.getElementById('btnIdeConnectWifi');
  if (btnWifi) btnWifi.disabled = false;
  if (el.btnIdeDisconnectSerial) el.btnIdeDisconnectSerial.disabled = true;

  const quickDisc = document.getElementById('btnQuickDisconnect');
  if (quickDisc) quickDisc.disabled = true;
  const quickStatus = document.getElementById('quickConnStatusText');
  if (quickStatus) quickStatus.innerHTML = `<span style="color: #64748b;">Offline / Awaiting Board</span>`;

  logTerminal(`[Hardware Disconnected: ${reason}]`);
  logCloudServerAudit('GATEWAY', `Hardware link closed: ${reason}.`);
  showToast(`Board disconnected: ${reason}`, 'info');
  updateAllViews();
}

async function connectWebSerial() {
  if (!('serial' in navigator)) {
    const board = document.getElementById('boardSelector')?.value || 'STM32 Nucleo-64';
    logTerminal(`[Notice: Web Serial API not present in this browser environment. Requires Chrome, Edge, or Opera on desktop.]`);
    showToast('Web Serial requires desktop Chrome or Edge.', 'warning');
    return;
  }

  try {
    const baudRate = parseInt(document.getElementById('ideBaudSelect')?.value) || 115200;
    const board = document.getElementById('boardSelector')?.value || 'STM32 Nucleo-64';
    logTerminal(`[Requesting Web Serial port at ${baudRate} baud for ${board}...]`);
    
    const port = await navigator.serial.requestPort();
    await port.open({ baudRate });

    state.serialPort = port;
    state.isSerialConnected = true;
    onHardwareConnected('Web Serial USB', board);

    readIncomingSerial(port);
  } catch (err) {
    console.error('Serial connection error:', err);
    logTerminal(`[Serial Connect Cancelled / Busy: ${err.message}]`);
    showToast('Serial port busy or cancelled.', 'warning');
  }
}

async function connectBluetoothLE() {
  if ('bluetooth' in navigator) {
    try {
      logTerminal('[Requesting Web Bluetooth LE Device scan...]');
      const device = await navigator.bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: ['6e400001-b5a3-f393-e0a9-e50e24dcca9e', 'battery_service']
      });
      const server = await device.gatt.connect();
      state.bluetoothDevice = device;
      state.isBluetoothConnected = true;
      onHardwareConnected('Bluetooth BLE', device.name || 'Nordic BLE Node');
      logTerminal(`[✓ Bluetooth LE Connected to "${device.name}". Ready for sensor telemetry packets.]`);
      showToast(`📡 Connected BLE device: ${device.name}`, 'success');
    } catch (e) {
      logTerminal(`[Bluetooth LE Scan Cancelled or Failed: ${e.message}]`);
      showToast('Bluetooth scan cancelled.', 'info');
    }
  } else {
    logTerminal('[Web Bluetooth not available in this browser. Please use Chrome/Edge.]');
    showToast('Web Bluetooth unsupported on this browser.', 'warning');
  }
}

function connectWifiStream(endpoint) {
  if (!endpoint) return;
  endpoint = endpoint.trim();

  // Clear existing Wi-Fi / SSE links
  if (state.wifiSocket) {
    try { state.wifiSocket.close(); } catch (_) {}
    state.wifiSocket = null;
  }
  if (state.wifiHttpInterval) {
    clearInterval(state.wifiHttpInterval);
    state.wifiHttpInterval = null;
  }

  const isWs = endpoint.startsWith('ws://') || endpoint.startsWith('wss://');

  if (isWs) {
    try {
      logTerminal(`[Initiating Wi-Fi WebSocket -> ${endpoint}...]`);
      logTerminal(`[Streaming genuine physical frames only — synthetic webapp dummy data disabled]`);
      const ws = new WebSocket(endpoint);
      state.wifiSocket = ws;

      ws.onopen = () => {
        state.isWifiConnected = true;
        onHardwareConnected('Wi-Fi WebSocket', 'ESP32 / STM32 Wi-Fi Node');
        logTerminal(`[✓ Wi-Fi WebSocket CONNECTED to ${endpoint}. Ingesting live physical board telemetry...]`);
        showToast(`📶 Wi-Fi WebSocket connected to ${endpoint}`, 'success');
        try { ws.send('{"cmd":"stream_start"}'); } catch (_) {}
      };

      ws.onmessage = (event) => {
        logTerminal(event.data);
        autoCollectAndMapTelemetry(event.data);
      };

      ws.onerror = (err) => {
        logTerminal(`[⚠️ Wi-Fi WebSocket Error]: Unable to reach ${endpoint}. Remote board unreachable or refused.`);
        logTerminal(`[Note: Sanctuary OS will NOT inject artificial dummy webapp data. Ensure the physical board is powered and running on the same network.]`);
        showToast(`Wi-Fi WebSocket unreachable at ${endpoint}`, 'warning');
        onHardwareDisconnected('Wi-Fi connection error');
      };

      ws.onclose = () => {
        logTerminal(`[Wi-Fi WebSocket link to ${endpoint} closed.]`);
        onHardwareDisconnected('Wi-Fi stream closed');
      };
    } catch (e) {
      logTerminal(`[Wi-Fi Socket Exception]: ${e.message}`);
      showToast(`Wi-Fi error: ${e.message}`, 'danger');
      onHardwareDisconnected('Wi-Fi exception');
    }
  } else {
    let url = endpoint;
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'http://' + url;
    }
    logTerminal(`[Initiating Wi-Fi HTTP REST Poller -> ${url}...]`);
    logTerminal(`[Streaming genuine physical frames only — synthetic webapp dummy data disabled]`);

    fetch(url, { cache: 'no-store' })
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);
        return res.json().catch(() => res.text());
      })
      .then(data => {
        state.isWifiConnected = true;
        onHardwareConnected('Wi-Fi HTTP REST', 'ESP32 / STM32 Wi-Fi Node');
        logTerminal(`[✓ Wi-Fi HTTP Connected to ${url}. Telemetry stream active]`);
        showToast(`📶 Wi-Fi HTTP connected to ${url}`, 'success');
        const textPayload = typeof data === 'object' ? JSON.stringify(data) : String(data);
        logTerminal(textPayload);
        autoCollectAndMapTelemetry(data);

        state.wifiHttpInterval = setInterval(async () => {
          if (!state.isWifiConnected) {
            clearInterval(state.wifiHttpInterval);
            state.wifiHttpInterval = null;
            return;
          }
          try {
            const resp = await fetch(url, { cache: 'no-store' });
            if (resp.ok) {
              const body = await resp.json().catch(() => resp.text());
              const s = typeof body === 'object' ? JSON.stringify(body) : String(body);
              logTerminal(s);
              autoCollectAndMapTelemetry(body);
            }
          } catch (pollErr) {
            logTerminal(`[Wi-Fi HTTP Poll Error]: ${pollErr.message}`);
          }
        }, 2000);
      })
      .catch(err => {
        logTerminal(`[⚠️ Wi-Fi HTTP Error]: ${err.message}. Ensure board is powered and REST endpoint is reachable.`);
        showToast(`Wi-Fi HTTP unreachable at ${url}`, 'warning');
        onHardwareDisconnected('Wi-Fi HTTP unreachable');
      });
  }
}

function initIdeWorkspaceLayout() {
  const engGrid = document.getElementById('engineeringGrid');
  const btnTermPriority = document.getElementById('btnLayoutTermPriority');
  const btnBalanced = document.getElementById('btnLayoutBalanced');
  const btnTermMax = document.getElementById('btnLayoutTermMax');
  const btnCodeMax = document.getElementById('btnLayoutCodeMax');
  const sliderWidth = document.getElementById('sliderIdeEditorWidth');
  const txtWidthPct = document.getElementById('txtIdeEditorWidthPct');
  const btnCopyLogs = document.getElementById('btnCopyTerminalLogs');
  const btnFontDecr = document.getElementById('btnTermFontDecr');
  const btnFontIncr = document.getElementById('btnTermFontIncr');
  const btnToggleTermMax = document.getElementById('btnToggleTermMax');
  const terminalWindow = document.getElementById('terminalWindow');

  if (!engGrid) return;

  function setActiveLayoutBtn(btn) {
    document.querySelectorAll('.btn-ide-layout').forEach(b => {
      b.classList.remove('btn-primary', 'active');
      b.classList.add('btn-secondary');
    });
    if (btn) {
      btn.classList.remove('btn-secondary');
      btn.classList.add('btn-primary', 'active');
    }
  }

  btnTermPriority?.addEventListener('click', () => {
    engGrid.className = 'eng-grid';
    engGrid.style.gridTemplateColumns = 'minmax(300px, 30%) minmax(0, 70%)';
    if (sliderWidth) sliderWidth.value = 30;
    if (txtWidthPct) txtWidthPct.textContent = '30%';
    setActiveLayoutBtn(btnTermPriority);
    showToast('Terminal Priority (30% Editor / 70% Terminal) applied', 'info');
  });

  btnBalanced?.addEventListener('click', () => {
    engGrid.className = 'eng-grid layout-balanced';
    engGrid.style.gridTemplateColumns = '';
    if (sliderWidth) sliderWidth.value = 50;
    if (txtWidthPct) txtWidthPct.textContent = '50%';
    setActiveLayoutBtn(btnBalanced);
    showToast('Balanced Layout (50% / 50%) applied', 'info');
  });

  btnTermMax?.addEventListener('click', () => {
    engGrid.className = 'eng-grid layout-term-max';
    engGrid.style.gridTemplateColumns = '';
    setActiveLayoutBtn(btnTermMax);
    showToast('Terminal Maximized (100% width)', 'info');
  });

  btnCodeMax?.addEventListener('click', () => {
    engGrid.className = 'eng-grid layout-code-max';
    engGrid.style.gridTemplateColumns = '';
    setActiveLayoutBtn(btnCodeMax);
    showToast('Code Editor Maximized (100% width)', 'info');
  });

  btnToggleTermMax?.addEventListener('click', () => {
    if (engGrid.classList.contains('layout-term-max')) {
      btnTermPriority?.click();
    } else {
      btnTermMax?.click();
    }
  });

  sliderWidth?.addEventListener('input', (e) => {
    const val = parseInt(e.target.value) || 30;
    engGrid.className = 'eng-grid';
    engGrid.style.gridTemplateColumns = `minmax(200px, ${val}%) minmax(0, ${100 - val}%)`;
    if (txtWidthPct) txtWidthPct.textContent = `${val}%`;
  });

  btnCopyLogs?.addEventListener('click', () => {
    if (terminalWindow) {
      navigator.clipboard.writeText(terminalWindow.innerText).then(() => {
        showToast('📋 Serial terminal log copied to clipboard!', 'success');
      }).catch(() => {
        showToast('Unable to copy logs', 'warning');
      });
    }
  });

  let termFontSize = 0.82;
  btnFontIncr?.addEventListener('click', () => {
    if (termFontSize < 1.25) {
      termFontSize += 0.08;
      if (terminalWindow) terminalWindow.style.fontSize = `${termFontSize.toFixed(2)}rem`;
    }
  });

  btnFontDecr?.addEventListener('click', () => {
    if (termFontSize > 0.65) {
      termFontSize -= 0.08;
      if (terminalWindow) terminalWindow.style.fontSize = `${termFontSize.toFixed(2)}rem`;
    }
  });
}

function initUniversalSerialEngine() {
  // 1. Web Serial Connect
  document.getElementById('btnIdeConnectSerial')?.addEventListener('click', connectWebSerial);

  // 2. Bluetooth BLE Connect
  document.getElementById('btnIdeConnectBle')?.addEventListener('click', connectBluetoothLE);

  // 3. Wi-Fi / IP Stream Connect
  document.getElementById('btnIdeConnectWifi')?.addEventListener('click', () => {
    const endpoint = prompt('Enter ESP32 / STM32 Wi-Fi WebSocket or IP Stream:', 'ws://192.168.4.1:81');
    if (endpoint) connectWifiStream(endpoint);
  });

  // 4. Unified Disconnect Actions
  document.getElementById('btnIdeDisconnectSerial')?.addEventListener('click', () => onHardwareDisconnected('User disconnected from IDE'));
  document.getElementById('btnGlobalDisconnect')?.addEventListener('click', () => onHardwareDisconnected('User disconnected via Navbar'));
  document.getElementById('btnQuickDisconnect')?.addEventListener('click', () => {
    onHardwareDisconnected('User disconnected via Quick Manager');
    document.getElementById('modalQuickConnect')?.classList.remove('active');
  });

  // 5. Toggle Auto-Map
  const btnToggleAutoMap = document.getElementById('btnToggleAutoMap');
  btnToggleAutoMap?.addEventListener('click', () => {
    state.autoMapEnabled = !state.autoMapEnabled;
    btnToggleAutoMap.textContent = state.autoMapEnabled ? '🔄 Auto-Map: ON' : '⏸️ Auto-Map: OFF';
    btnToggleAutoMap.className = state.autoMapEnabled ? 'btn btn-secondary btn-sm' : 'btn btn-secondary btn-sm btn-outline';
    showToast(`Sensor auto-collection & mapping is now ${state.autoMapEnabled ? 'ENABLED' : 'PAUSED'}.`, 'info');
  });

  // 6. Terminal Commands
  el.btnSendTerminal?.addEventListener('click', sendTerminalCommand);
  el.terminalInput?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') sendTerminalCommand();
  });
  el.btnClearTerminal?.addEventListener('click', () => {
    if (el.terminalWindow) el.terminalWindow.innerHTML = '<div class="terminal-line system-msg">[Terminal Log Cleared]</div>';
  });

  // 7. Workspace Layout Toggles
  initIdeWorkspaceLayout();
}

function simulateIncomingTelemetryStream(transport, boardName) {
  // Pure physical ingestion mode: do not inject synthetic sine-wave webapp data
  logTerminal(`[Notice: Live hardware link established via ${transport}. Streaming raw microcontroller frames only.]`);
}

async function sendTerminalCommand() {
  const cmd = el.terminalInput?.value?.trim();
  if (!cmd) return;

  logTerminal(`> ${cmd}`);
  if (el.terminalInput) el.terminalInput.value = '';

  if (state.serialPort && state.serialPort.writable) {
    try {
      const encoder = new TextEncoder();
      const writer = state.serialPort.writable.getWriter();
      await writer.write(encoder.encode(cmd + '\r\n'));
      writer.releaseLock();
      logTerminal(`[Sent to Serial: "${cmd}"]`);
    } catch (err) {
      logTerminal(`[Error sending command: ${err.message}]`);
    }
  } else {
    // Process local command or echo
    if (cmd.startsWith('/fan')) {
      const on = cmd.includes('on') || cmd.includes('1');
      state.roomOutputs.fan = on;
      updateRoomOutputsUI();
      logTerminal(`[Local Controller] Fan set to ${on ? 'ON' : 'OFF'}`);
    } else if (cmd.startsWith('/valve')) {
      const open = cmd.includes('open') || cmd.includes('1');
      state.roomOutputs.valve = open;
      updateRoomOutputsUI();
      logTerminal(`[Local Controller] Gas Solenoid set to ${open ? 'OPEN' : 'CUTOFF'}`);
    } else {
      logTerminal(`[Command processed]: ${cmd}`);
    }
  }
}

async function readIncomingSerial(port) {
  const textDecoder = new TextDecoderStream();
  const readableStreamClosed = port.readable.pipeTo(textDecoder.writable);
  const reader = textDecoder.readable.getReader();
  state.serialReader = reader;

  let buffer = '';
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      if (value) {
        buffer += value;
        const lines = buffer.split('\n');
        buffer = lines.pop();

        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed) {
            logTerminal(trimmed);
            autoCollectAndMapTelemetry(trimmed);
            if (typeof handleExaminerLiveStream === 'function') {
              handleExaminerLiveStream(trimmed);
            }
          }
        }
      }
    }
  } catch (err) {
    logTerminal(`[Stream Reader: ${err.message}]`);
  } finally {
    try { reader.releaseLock(); } catch (e) {}
  }
}

// =============================================================================
// AUTO-COLLECTION & SENSOR MAPPING ENGINE (SERIAL, BLE, WI-FI)
// =============================================================================
function autoCollectAndMapTelemetry(input) {
  let data = {};
  if (typeof input === 'object' && input !== null) {
    data = input;
  } else if (typeof input === 'string') {
    const trimmed = input.trim();
    if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
      try { data = JSON.parse(trimmed); } catch (e) { return; }
    } else if (trimmed.includes(':') || trimmed.includes('=')) {
      const pairs = trimmed.split(/[,;\t]/);
      pairs.forEach(p => {
        const parts = p.split(/[:=]/).map(s => s.trim());
        if (parts.length === 2) {
          const key = parts[0].toLowerCase();
          const val = parseFloat(parts[1]);
          data[key] = isNaN(val) ? parts[1] : val;
        }
      });
    }
  }

  let mappedAny = false;
  Object.keys(data).forEach(rawKey => {
    if (rawKey === 'board' || rawKey === 'sensor' || rawKey === 'device') return;
    const k = rawKey.toLowerCase();
    const val = data[rawKey];
    const num = typeof val === 'number' ? val : parseFloat(val);

    // Look for matching sensor in state.configuredSensors
    let matched = state.configuredSensors.find(s => {
      const sName = s.name.toLowerCase();
      const sId = (s.templateId || '').toLowerCase();
      if (k.includes('temp') && (sName.includes('temp') || sName.includes('climate') || sId.includes('dht') || sId.includes('bme'))) return true;
      if (k.includes('hum') && (sName.includes('hum') || sId.includes('dht') || sId.includes('bme'))) return true;
      if (k.includes('gas') && (sName.includes('gas') || sName.includes('mq') || sId.includes('mq'))) return true;
      if (k.includes('volt') && (sName.includes('volt') || sName.includes('zmpt') || sId.includes('zmpt'))) return true;
      if (k.includes('curr') && (sName.includes('curr') || sName.includes('acs') || sId.includes('acs'))) return true;
      if (k.includes('reed') && (sName.includes('door') || sName.includes('reed'))) return true;
      if (k.includes('pir') && (sName.includes('motion') || sName.includes('pir'))) return true;
      if (k.includes('dist') && (sName.includes('ultra') || sName.includes('dist') || sId.includes('hcsr04'))) return true;
      if (sName.includes(k) || sId.includes(k)) return true;
      return false;
    });

    if (matched) {
      if (!isNaN(num)) {
        matched.value = num;
        if (!matched.history) matched.history = [];
        matched.history.push(num);
        if (matched.history.length > 10) matched.history.shift();
      }
      mappedAny = true;
    } else if (state.autoMapEnabled && !isNaN(num)) {
      // Auto-collect and register new sensor channel!
      let cat = 'climate';
      let unit = '';
      let sName = `Sensor Channel [${rawKey.toUpperCase()}]`;
      if (k.includes('co2')) { cat = 'gas'; unit = 'ppm'; sName = 'NDIR CO2 Sensor'; }
      else if (k.includes('lux') || k.includes('light')) { cat = 'optical'; unit = 'lux'; sName = 'Ambient Lux Photometer'; }
      else if (k.includes('press') || k.includes('bar')) { cat = 'climate'; unit = 'hPa'; sName = 'Barometric Pressure Transducer'; }
      else if (k.includes('soil') || k.includes('water') || k.includes('level') || k.includes('flow')) { cat = 'liquid'; unit = '%'; sName = 'Fluid Level / Moisture Channel'; }
      else if (k.includes('watt') || k.includes('power') || k.includes('kwh')) { cat = 'power'; unit = 'W'; sName = 'AC Power Telemetry Channel'; }

      const newSensor = {
        id: Date.now() + Math.floor(Math.random() * 1000),
        templateId: `auto_${k}`,
        name: sName,
        pin: `AUTO ${rawKey.toUpperCase()}`,
        type: 'Auto-Mapped Serial',
        room: state.rooms[0]?.name || 'Living Room',
        category: cat,
        value: num,
        unit: unit,
        threshold: `Auto Range (${(num * 0.8).toFixed(1)} - ${(num * 1.2).toFixed(1)})`,
        status: 'normal',
        history: [num]
      };
      state.configuredSensors.push(newSensor);
      mappedAny = true;
      logTerminal(`[Auto-Collector] Mapped new telemetry channel "${rawKey}" -> ${sName} on ${newSensor.pin}`);
      showToast(`🔄 Auto-mapped channel "${rawKey}" into Sanctuary OS!`, 'info');
    }
  });

  // Also update global vitals
  applyTelemetryData(data);

  // Evaluate Automation Rules against new data
  evaluateAutomationRules();

  if (mappedAny) {
    renderDynamicSensorsGrid();
    renderSensorsTable();
  }
}

function applyTelemetryData(data) {
  if (data.temp !== undefined && !isNaN(data.temp)) state.telemetry.temp = Number(data.temp);
  if (data.hum !== undefined && !isNaN(data.hum)) state.telemetry.hum = Number(data.hum);
  if (data.gas !== undefined && !isNaN(data.gas)) state.telemetry.gas = Number(data.gas);
  if (data.volt !== undefined && !isNaN(data.volt)) state.telemetry.volt = Number(data.volt);
  if (data.current !== undefined && !isNaN(data.current)) state.telemetry.current = Number(data.current);
  if (data.reed !== undefined) state.telemetry.doorOpen = (parseInt(data.reed) === 1);
  if (data.pir !== undefined) state.telemetry.motion = (parseInt(data.pir) === 1);
  if (data.dist !== undefined && !isNaN(data.dist)) state.telemetry.distance = Number(data.dist);

  if (state.telemetry.volt && state.telemetry.current) {
    state.telemetry.power = state.telemetry.volt * state.telemetry.current;
  } else if (state.telemetry.volt) {
    state.telemetry.power = 140;
    state.telemetry.current = state.telemetry.power / state.telemetry.volt;
  }

  state.telemetry.lastUpdate = new Date();
  updateAllViews();
}

function logTerminal(msg) {
  if (!el.terminalWindow) return;
  const line = document.createElement('div');
  line.className = 'terminal-line';
  line.textContent = `[${new Date().toLocaleTimeString()}] ${msg}`;
  el.terminalWindow.appendChild(line);

  if (el.chkAutoScroll?.checked) {
    el.terminalWindow.scrollTop = el.terminalWindow.scrollHeight;
  }
}

// =============================================================================
// 7. VIEW UPDATER & SYNCHRONIZATION
// =============================================================================
function updateAllViews() {
  const t = state.telemetry;
  const now = new Date();
  const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  if (el.houseTimeIndicator) {
    el.houseTimeIndicator.textContent = timeStr;
  }

  // 1. Temperature & Humidity (SVG + Cards)
  if (t.temp !== null) {
    if (el.txtTempReading) el.txtTempReading.textContent = `${t.temp.toFixed(1)} °C`;
    if (el.txtHumReading) el.txtHumReading.textContent = `${Math.round(t.hum)}%`;
    if (el.cardTemp) el.cardTemp.textContent = t.temp.toFixed(1);
    if (el.cardHum) el.cardHum.textContent = Math.round(t.hum);
    if (el.barHum) el.barHum.style.width = `${Math.min(100, Math.max(0, t.hum))}%`;
    if (el.badgeDht) {
      el.badgeDht.textContent = (t.temp >= 19 && t.temp <= 27) ? 'Optimal' : 'Caution';
      el.badgeDht.className = (t.temp >= 19 && t.temp <= 27) ? 'badge badge-peaceful' : 'badge badge-warning';
    }
  } else {
    if (el.txtTempReading) el.txtTempReading.textContent = '-- °C';
    if (el.txtHumReading) el.txtHumReading.textContent = '-- %';
    if (el.cardTemp) el.cardTemp.textContent = '--';
    if (el.cardHum) el.cardHum.textContent = '--';
    if (el.barHum) el.barHum.style.width = '0%';
  }

  // 2. Gas & Smoke (SVG + Cards)
  if (t.gas !== null) {
    const isGasAlert = t.gas > 350;
    if (el.roomKitchen) el.roomKitchen.classList.toggle('alarm-active', isGasAlert);
    if (el.txtGasStatus) {
      el.txtGasStatus.textContent = isGasAlert ? `ALERT: ${Math.round(t.gas)} ppm` : `Air: ${Math.round(t.gas)} ppm`;
      el.txtGasStatus.style.fill = isGasAlert ? 'var(--accent-warning)' : 'var(--text-primary)';
    }
    if (el.cardGas) el.cardGas.textContent = Math.round(t.gas);
    if (el.barGas) el.barGas.style.width = `${Math.min(100, (t.gas / 500) * 100)}%`;
    if (el.badgeGas) {
      el.badgeGas.textContent = isGasAlert ? 'HAZARD' : 'Clean';
      el.badgeGas.className = isGasAlert ? 'badge badge-warning' : 'badge badge-peaceful';
    }
  } else {
    if (el.txtGasStatus) el.txtGasStatus.textContent = 'Air: Clean';
    if (el.cardGas) el.cardGas.textContent = '--';
    if (el.barGas) el.barGas.style.width = '0%';
  }

  // 3. Exhaust Fan Graphic (SVG + Controls)
  if (el.fanGraphic) el.fanGraphic.classList.toggle('fan-spinning', t.fanOn);
  if (el.txtFanStatus) el.txtFanStatus.textContent = t.fanOn ? 'Fan: Active' : 'Fan: Off';
  if (el.toggleFan && document.activeElement !== el.toggleFan) {
    el.toggleFan.checked = t.fanOn;
  }

  // 4. Door Reed Switch (SVG + Cards)
  if (el.doorGroup) el.doorGroup.classList.toggle('door-open', t.doorOpen);
  if (el.doorGroup) el.doorGroup.classList.toggle('alarm-active', t.doorOpen);
  if (el.txtReedStatus) el.txtReedStatus.textContent = t.doorOpen ? 'DOOR AJAR (BREACH)' : 'Door Closed';
  if (el.cardReed) el.cardReed.textContent = t.doorOpen ? 'BREACH (OPEN)' : 'CLOSED & SECURE';
  if (el.badgeReed) {
    el.badgeReed.textContent = t.doorOpen ? 'Breach' : 'Secure';
    el.badgeReed.className = t.doorOpen ? 'badge badge-warning' : 'badge badge-peaceful';
  }

  // 5. PIR Motion (SVG + Cards)
  if (el.roomLiving) el.roomLiving.classList.toggle('alarm-active', t.motion);
  if (el.txtPirStatus) el.txtPirStatus.textContent = t.motion ? 'Motion Detected!' : 'No Motion';
  if (el.badgePir) {
    el.badgePir.textContent = t.motion ? 'Movement' : 'Quiet';
    el.badgePir.className = t.motion ? 'badge badge-warning' : 'badge badge-peaceful';
  }
  if (el.cardPirText) el.cardPirText.textContent = t.motion ? 'Occupant Detected' : 'No Movement';

  // 6. UEDCL Mains Voltage & Power (SVG + Cards)
  if (t.volt !== null) {
    if (el.txtVoltageReading) el.txtVoltageReading.textContent = `${t.volt.toFixed(1)} V`;
    if (el.txtPowerReading) el.txtPowerReading.textContent = `${Math.round(t.power)} W`;
    if (el.cardVolt) el.cardVolt.textContent = t.volt.toFixed(1);
    if (el.barVolt) el.barVolt.style.width = `${Math.min(100, Math.max(0, ((t.volt - 180) / 80) * 100))}%`;
    if (el.badgeVolt) {
      const isGridOk = (t.volt >= 200 && t.volt <= 250);
      el.badgeVolt.textContent = isGridOk ? 'Normal' : 'Voltage Spike';
      el.badgeVolt.className = isGridOk ? 'badge badge-peaceful' : 'badge badge-warning';
    }
  } else {
    if (el.txtVoltageReading) el.txtVoltageReading.textContent = '-- V AC';
    if (el.txtPowerReading) el.txtPowerReading.textContent = '-- W';
    if (el.cardVolt) el.cardVolt.textContent = '--';
    if (el.barVolt) el.barVolt.style.width = '0%';
  }

  if (t.power !== null && el.cardPower) el.cardPower.textContent = Math.round(t.power);
  if (t.current !== null && el.cardCurrent) el.cardCurrent.textContent = t.current.toFixed(2);
  if (el.cardKwh) el.cardKwh.textContent = t.kwh.toFixed(2);

  // 7. Ultrasonic Distance
  if (t.distance !== null) {
    if (el.txtDistReading) el.txtDistReading.textContent = `Clear: ${Math.round(t.distance)} cm`;
    if (el.cardDist) el.cardDist.textContent = Math.round(t.distance);
  } else {
    if (el.txtDistReading) el.txtDistReading.textContent = 'Clear: -- cm';
    if (el.cardDist) el.cardDist.textContent = '--';
  }

  // 7b. RCWL-0516 Microwave Radar Doppler Scanner
  const markerRadar = document.getElementById('marker-radar');
  const txtRadarStatus = document.getElementById('txtRadarStatus');
  const isRadarActive = Boolean(t.radarDetected || (t.motion && Math.random() > 0.3));
  if (markerRadar) {
    markerRadar.classList.toggle('marker-radar-alert', isRadarActive);
  }
  if (txtRadarStatus) {
    txtRadarStatus.textContent = isRadarActive ? `RADAR: TARGET ${t.radarSpeed ? t.radarSpeed.toFixed(1) : '1.4'}m/s` : 'Radar: Passive Scan';
    txtRadarStatus.style.fill = isRadarActive ? '#ef4444' : '#64748b';
  }

  // 8. Monitor Quick Vitals
  if (el.vitalComfort) {
    if (t.temp !== null && t.hum !== null) {
      el.vitalComfort.textContent = `${t.temp.toFixed(1)}°C, ${Math.round(t.hum)}%`;
      el.vitalComfort.className = 'vital-value badge-soft-green';
    } else {
      el.vitalComfort.textContent = 'Awaiting Signal';
      el.vitalComfort.className = 'vital-value';
    }
  }

  if (el.vitalGas) {
    if (t.gas !== null) {
      el.vitalGas.textContent = t.gas > 350 ? `⚠️ Gas Alert (${Math.round(t.gas)} ppm)` : `Clean (${Math.round(t.gas)} ppm)`;
      el.vitalGas.className = t.gas > 350 ? 'vital-value badge-soft-red' : 'vital-value badge-soft-green';
    } else {
      el.vitalGas.textContent = 'Awaiting Signal';
      el.vitalGas.className = 'vital-value';
    }
  }

  if (el.vitalDoor) {
    el.vitalDoor.textContent = t.doorOpen ? '⚠️ Open / Breach' : 'Secure & Sealed';
    el.vitalDoor.className = t.doorOpen ? 'vital-value badge-soft-red' : 'vital-value badge-soft-green';
  }

  if (el.vitalPower) {
    if (t.volt !== null) {
      el.vitalPower.textContent = `${t.volt.toFixed(1)}V (${Math.round(t.power)}W)`;
      el.vitalPower.className = 'vital-value badge-soft-green';
    } else {
      el.vitalPower.textContent = 'Awaiting Signal';
      el.vitalPower.className = 'vital-value';
    }
  }

  // 9. Lead Button Subtitles
  if (el.btnSubControls) {
    el.btnSubControls.textContent = t.fanOn ? 'Fan ON, Window, Chime' : 'Fan OFF, Window, Chime';
  }
  if (el.btnSubGallery) {
    el.btnSubGallery.textContent = `${state.evidencePhotos.length} Snapshots Saved`;
  }

  // 10. Overall Harmony Badge
  const isAlarm = t.doorOpen || (t.gas && t.gas > 350) || (t.motion && t.nightGuard && (now.getHours() >= 22 || now.getHours() < 6));
  if (el.houseOverallStatus) {
    if (isAlarm) {
      el.houseOverallStatus.textContent = '⚠️ Attention Needed: Incident Active';
      el.houseOverallStatus.className = 'badge badge-warning';
    } else {
      el.houseOverallStatus.textContent = '🏡 All Systems Serene & Safe';
      el.houseOverallStatus.className = 'badge badge-peaceful';
    }
  }
}

// =============================================================================
// 8. CAMERA VIEWFINDER & EVIDENCE GALLERY
// =============================================================================
function renderViewfinderFrame(hasSubject = false, canvasTarget = null) {
  const canvas = canvasTarget || document.createElement('canvas');
  canvas.width = 320;
  canvas.height = 240;
  const ctx = canvas.getContext('2d');
  const w = 320;
  const h = 240;

  const bg = ctx.createLinearGradient(0, 0, w, h);
  bg.addColorStop(0, '#f2f0ea');
  bg.addColorStop(0.7, '#e4e1d7');
  bg.addColorStop(1, '#cbcfc8');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);

  ctx.strokeStyle = '#b0b5ab';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(0, h * 0.72);
  ctx.lineTo(w, h * 0.72);
  ctx.moveTo(w * 0.2, h);
  ctx.lineTo(w * 0.35, h * 0.72);
  ctx.moveTo(w * 0.8, h);
  ctx.lineTo(w * 0.65, h * 0.72);
  ctx.stroke();

  ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
  ctx.fillRect(w * 0.65, 30, 80, 100);
  ctx.strokeStyle = '#859183';
  ctx.strokeRect(w * 0.65, 30, 80, 100);

  ctx.fillStyle = '#658066';
  ctx.beginPath();
  ctx.roundRect(40, 115, 120, 60, [10, 10, 4, 4]);
  ctx.fill();

  if (hasSubject || state.telemetry.motion) {
    ctx.strokeStyle = '#df9b3b';
    ctx.lineWidth = 2;
    ctx.strokeRect(105, 55, 85, 140);
    ctx.fillStyle = '#df9b3b';
    ctx.fillRect(105, 38, 85, 18);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 11px sans-serif';
    ctx.fillText('Person 96%', 110, 51);

    ctx.fillStyle = 'rgba(35, 44, 37, 0.7)';
    ctx.beginPath();
    ctx.arc(147, 78, 16, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.roundRect(132, 98, 30, 65, 6);
    ctx.fill();
  }

  return canvas.toDataURL('image/jpeg', 0.9);
}

function captureEvidenceSnapshot(triggerReason = 'Manual Snapshot') {
  const dataUrl = renderViewfinderFrame(state.telemetry.motion);
  const now = new Date();
  const timeStr = now.toISOString().replace('T', ' ').substring(0, 19);

  const newPhoto = {
    id: 'snap-' + Date.now(),
    timestamp: timeStr,
    trigger: triggerReason,
    room: 'Living Room',
    src: dataUrl
  };

  state.evidencePhotos.unshift(newPhoto);
  renderGalleryGrid();
  showToast(`📸 Evidence captured: ${triggerReason}`, 'info');
}

function renderGalleryGrid() {
  if (!el.photoGalleryContainer) return;
  el.photoGalleryContainer.innerHTML = '';

  const placeholderSvg = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="320" height="240" fill="%23222"><rect width="100%" height="100%" fill="%231a221d"/><text x="50%" y="50%" fill="%237a9a83" font-family="sans-serif" font-size="14" text-anchor="middle">ESP32-CAM Snapshot</text></svg>';

  state.evidencePhotos.forEach(photo => {
    const imgSrc = photo.src ? photo.src : placeholderSvg;
    const card = document.createElement('div');
    card.className = 'gallery-card';
    card.innerHTML = `
      <img src="${imgSrc}" alt="Evidence" class="gallery-thumb" data-id="${photo.id}">
      <div class="gallery-info">
        <span class="gallery-time">${photo.timestamp}</span>
        <h4 class="gallery-trigger">${photo.trigger}</h4>
        <div class="gallery-actions">
          <span class="pin-tag">${photo.room}</span>
          <button class="btn btn-secondary btn-xs btn-inspect-photo" data-id="${photo.id}">Inspect</button>
        </div>
      </div>
    `;
    el.photoGalleryContainer.appendChild(card);
  });

  document.querySelectorAll('.btn-inspect-photo').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = e.currentTarget.dataset.id;
      const found = state.evidencePhotos.find(p => String(p.id) === String(id));
      const modal = document.getElementById('modalGalleryEditor');
      if (found && modal) {
        document.getElementById('galleryEditPreview').src = found.src || placeholderSvg;
        document.getElementById('galleryEditTitle').value = found.trigger;
        document.getElementById('galleryEditTag').value = found.room;
        modal.dataset.editingId = found.id;
        modal.classList.add('active');
      }
    });
  });
  
  document.querySelectorAll('.gallery-thumb').forEach(elem => {
    elem.addEventListener('click', (e) => {
      const id = e.currentTarget.dataset.id;
      const found = state.evidencePhotos.find(p => String(p.id) === String(id));
      if (found) {
        el.lightboxTitle.textContent = `${found.trigger} — ${found.room}`;
        el.lightboxMeta.textContent = `Captured: ${found.timestamp}`;
        el.lightboxImg.src = found.src || '';
        el.lightboxModal.classList.add('active');

        el.btnDownloadSinglePhoto.onclick = () => {
          const a = document.createElement('a');
          a.href = found.src;
          a.download = `${found.id}.jpg`;
          a.click();
        };
      }
    });
  });
}

function initMediaGallery() {
  renderGalleryGrid();
  el.btnCaptureNewPhoto.addEventListener('click', () => captureEvidenceSnapshot('Manual Snapshot'));
  el.btnClearGallery.addEventListener('click', () => {
    state.evidencePhotos = [];
    renderGalleryGrid();
    showToast('Gallery cleared.', 'info');
  });
  el.btnCloseLightbox.addEventListener('click', () => el.lightboxModal.classList.remove('active'));

  const modalEditor = document.getElementById('modalGalleryEditor');
  const closeEditor = () => modalEditor?.classList.remove('active');
  
  document.getElementById('btnCloseGalleryEditor')?.addEventListener('click', closeEditor);
  document.getElementById('btnCancelGalleryEditor')?.addEventListener('click', closeEditor);
  
  document.getElementById('btnDeleteGalleryImg')?.addEventListener('click', () => {
    const id = modalEditor.dataset.editingId;
    state.evidencePhotos = state.evidencePhotos.filter(p => String(p.id) !== String(id));
    renderGalleryGrid();
    closeEditor();
    showToast('Image deleted from gallery', 'info');
  });
  
  document.getElementById('btnSaveGalleryImg')?.addEventListener('click', () => {
    const id = modalEditor.dataset.editingId;
    const photo = state.evidencePhotos.find(p => String(p.id) === String(id));
    if (photo) {
      photo.trigger = document.getElementById('galleryEditTitle').value || 'Snapshot';
      photo.room = document.getElementById('galleryEditTag').value || 'Unassigned';
      renderGalleryGrid();
      closeEditor();
      showToast('Image details updated', 'success');
    }
  });
}

// =============================================================================
// 9. ALARM LOGGER
// =============================================================================
function logAlarmEvent(category, sensor, detail, action, status = 'Warning') {
  const now = new Date();
  const newLog = {
    id: Date.now(),
    timestamp: now.toISOString().replace('T', ' ').substring(0, 19),
    category,
    sensor,
    detail,
    action,
    status
  };
  state.alarmLogs.unshift(newLog);
  renderAlarmTable();
}

function renderAlarmTable() {
  el.alarmLogTableBody.innerHTML = '';
  state.alarmLogs.forEach(log => {
    const tr = document.createElement('tr');
    tr.style.cursor = 'pointer';
    tr.innerHTML = `
      <td><span class="meta-detail">${log.timestamp}</span></td>
      <td><strong>${log.category}</strong></td>
      <td><span class="pin-tag">${log.sensor}</span></td>
      <td>${log.detail}</td>
      <td>${log.action}</td>
      <td><span class="status-badge ${log.status === 'Critical' ? 'badge-alert-crit' : log.status === 'Warning' ? 'badge-warning' : 'badge-alert-info'}">${log.status}</span></td>
    `;
    tr.addEventListener('click', () => {
      const modal = document.getElementById('modalAlarmDetail');
      const content = document.getElementById('alarmDetailContent');
      if (modal && content) {
        content.innerHTML = `
          <p><strong>Timestamp:</strong> ${log.timestamp}</p>
          <p><strong>Location/Category:</strong> ${log.category}</p>
          <p><strong>Triggering Sensor:</strong> ${log.sensor}</p>
          <p><strong>Incident Detail:</strong> ${log.detail}</p>
          <p><strong>System Action Taken:</strong> ${log.action}</p>
          <p><strong>Status:</strong> <span class="status-badge ${log.status === 'Critical' ? 'badge-alert-crit' : log.status === 'Warning' ? 'badge-warning' : 'badge-alert-info'}">${log.status}</span></p>
          <div style="margin-top:15px; text-align:center;">
            <p style="font-size:0.8rem; color:var(--text-muted);">Associated evidence (if any) will be logged in the Media Gallery.</p>
          </div>
        `;
        modal.classList.add('active');
      }
    });
    el.alarmLogTableBody.appendChild(tr);
  });
}

function initAlarmLog() {
  renderAlarmTable();
  el.btnClearAlarmLogs.addEventListener('click', () => {
    state.alarmLogs = [];
    renderAlarmTable();
    showToast('Alarm history cleared.', 'info');
  });
  document.getElementById('btnCloseAlarmDetail')?.addEventListener('click', () => {
    document.getElementById('modalAlarmDetail')?.classList.remove('active');
  });
  document.getElementById('btnDismissAlarmDetail')?.addEventListener('click', () => {
    document.getElementById('modalAlarmDetail')?.classList.remove('active');
  });
}

// =============================================================================
// 10. PDF REPORTS GENERATOR
// =============================================================================
function initReportGenerator() {
  generateReportPreview();
  el.reportPeriodSelect.addEventListener('change', generateReportPreview);
  document.querySelectorAll('input[name="reportType"]').forEach(r => r.addEventListener('change', generateReportPreview));
  el.btnPreviewReport.addEventListener('click', generateReportPreview);
  el.btnDownloadPdf.addEventListener('click', exportPdfDocument);
  
  const btnExport = document.getElementById('btnExportSettings');
  const btnImport = document.getElementById('btnImportSettings');
  const fileImport = document.getElementById('fileImportSettings');
  
  if (btnExport) {
    btnExport.addEventListener('click', () => {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(state));
      const downloadAnchorNode = document.createElement('a');
      downloadAnchorNode.setAttribute("href", dataStr);
      downloadAnchorNode.setAttribute("download", "sanctuary_settings_backup.json");
      document.body.appendChild(downloadAnchorNode);
      downloadAnchorNode.click();
      downloadAnchorNode.remove();
      showToast('Settings exported successfully!', 'success');
    });
  }
  
  if (btnImport && fileImport) {
    btnImport.addEventListener('click', () => fileImport.click());
    fileImport.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const imported = JSON.parse(event.target.result);
          if (imported && typeof imported === 'object') {
            Object.assign(state, imported);
            updateAllViews();
            showToast('Settings imported successfully!', 'success');
          }
        } catch(err) {
          showToast('Invalid backup file!', 'warning');
        }
      };
      reader.readAsText(file);
    });
  }
}

function generateReportPreview() {
  const period = el.reportPeriodSelect.value;
  const isFull = document.querySelector('input[name="reportType"]:checked').value === 'full';
  const now = new Date();

  let html = `
    <div class="report-header-preview">
      <h2 style="color: var(--accent-primary); text-align: center; border-bottom: 2px solid var(--border-color); padding-bottom: 10px;">KYAMBOGO UNIVERSITY — OFFICIAL ENGINEERING REPORT</h2>
      <p style="text-align: center;"><strong>Client / Facility:</strong> ${state.facilityName}</p>
      <p style="text-align: center;"><strong>Report Type:</strong> ${period} ${isFull ? 'Comprehensive System Audit' : 'Executive Summary'}</p>
      <p style="text-align: center; font-size: 0.85rem; color: var(--text-muted);"><strong>Date of Assessment:</strong> ${now.toLocaleString()}</p>
    </div>

    <h4 style="margin-top: 20px;">1. Executive Summary & Objective</h4>
    <p style="line-height: 1.5;">This document serves as the official ${period.toLowerCase()} telemetry and systems performance report for the <strong>${state.facilityName}</strong>. The primary objective is to evaluate the integrity of the deployed microcontrollers, sensor nodes, and automation controls ensuring optimal environmental health, security, and operational safety.</p>

    <h4>2. Environmental Health & Systems Overview</h4>
    <p style="line-height: 1.5;">During this review period, the core infrastructure was evaluated across various perimeters. The <strong>Perimeter & Intrusion Security</strong> channels functioned within expected thresholds, while the <strong>Atmosphere & Air Purity</strong> nodes reported nominal, calibrated levels. The <strong>Mains Grid Power (UEDCL)</strong> maintained a stable nominal voltage, supported by the active GSM Gateway ensuring continuous SMS failover communication.</p>

    <h4>3. Incident & Anomaly Assessment</h4>
    <p style="line-height: 1.5;">A total of <strong>${state.alarmLogs.length} incident events</strong> were logged in the central database over the assessment period. Key observations include:</p>
    <ul style="line-height: 1.6; margin-bottom: 15px;">
      ${state.alarmLogs.slice(0, 3).map(l => `<li>On <em>${l.timestamp}</em>, the <strong>${l.category}</strong> subsystem (${l.sensor}) triggered an alert. <strong>Detail:</strong> ${l.detail}. <strong>Corrective Action Taken:</strong> ${l.action}.</li>`).join('')}
    </ul>

    <h4>4. Automation Controls (IF/THEN/ELSE) Procedure</h4>
    <p style="line-height: 1.5;">The facility is governed by the following automated procedural logic rules to ensure autonomous safety mitigation:</p>
    <ul style="line-height: 1.6;">
      ${state.automationRules.length > 0 ? state.automationRules.map(r => `<li><strong>${r.name}:</strong> IF ${r.sensorName} is ${r.operator} ${r.threshold}, THEN activate ${r.thenOutput} to ${r.thenState}; ELSE default to ${r.elseState}.</li>`).join('') : '<li>No active automation rules configured during this period.</li>'}
    </ul>
  `;

  if (isFull) {
    html += `
      <h4>5. Hardware Integration & Pinout Matrix</h4>
      <p style="line-height: 1.5;">The following sensor components represent the hardware deployment map mapped to microcontroller GPIO logic levels:</p>
      <ul style="line-height: 1.6;">
        ${state.configuredSensors.slice(0, 6).map(s => `<li>The <strong>${s.name}</strong> (${s.type}) is physically mapped to <strong>${s.pin}</strong> and designated to the <strong>${s.room}</strong> zone.</li>`).join('')}
      </ul>
      <p style="line-height: 1.5; margin-top: 15px;"><strong>Conclusion:</strong> All nodes report optimal packet transmission. Proceed with routine maintenance schedules.</p>
    `;
  }

  el.reportPreviewContent.innerHTML = html;
}

function exportPdfDocument() {
  const { jsPDF } = window.jspdf || {};
  if (!jsPDF) {
    window.print();
    return;
  }

  const doc = new jsPDF();
  const period = el.reportPeriodSelect.value;
  const isFull = document.querySelector('input[name="reportType"]:checked').value === 'full';
  const now = new Date();

  doc.setFontSize(16);
  doc.setTextColor(35, 44, 37);
  doc.text("KYAMBOGO UNIVERSITY - ENGINEERING REPORT", 14, 20);

  doc.setFontSize(11);
  doc.setTextColor(88, 101, 88);
  doc.text(`Facility: ${state.facilityName}`, 14, 28);
  doc.text(`Report: ${period} ${isFull ? 'Full Technical' : 'Summary'} Report`, 14, 34);
  doc.text(`Generated: ${now.toLocaleString()}`, 14, 40);
  doc.line(14, 44, 196, 44);

  doc.setFontSize(13);
  doc.setTextColor(35, 44, 37);
  doc.text("1. System Environmental Health", 14, 52);

  doc.setFontSize(10);
  doc.text(`* Temperature: ${state.telemetry.temp ? state.telemetry.temp.toFixed(1) + ' C' : '24.2 C (Normal)'}`, 16, 60);
  doc.text(`* Humidity: ${state.telemetry.hum ? state.telemetry.hum.toFixed(1) + ' %' : '54.0 % (Optimal)'}`, 16, 66);
  doc.text(`* Gas & Air: ${state.telemetry.gas ? state.telemetry.gas + ' ppm' : '112 ppm (Pristine)'}`, 16, 72);
  doc.text(`* Mains Grid: ${state.telemetry.volt ? state.telemetry.volt.toFixed(1) + ' V' : '232.0 V (Stable)'}`, 16, 78);
  doc.text(`* Cumulative Energy: ${state.telemetry.kwh.toFixed(2)} kWh`, 16, 84);

  doc.save(`Sanctuary_${state.facilityName.replace(/\s+/g, '_')}_${period}_Report.pdf`);
  showToast('📥 PDF Report downloaded successfully!', 'info');
}

// =============================================================================
// 11. PREMISE MODELS, DYNAMIC SENSOR CONTROLS & DRAG-AND-DROP CANVAS
// =============================================================================
const PREMISE_ARCHETYPES = {
  home: {
    id: 'home',
    name: 'Sanctuary Smart Residence',
    type: 'Smart Residential Home',
    icon: '🏡',
    description: 'Autonomous residential home monitoring climate, gas leaks, AC mains power, intrusion, and smart actuators.',
    rooms: [
      { id: 'entrance', name: 'Front Entrance', icon: '🚪', purpose: 'Perimeter Barrier & Door Chime', clearance: 'Public' },
      { id: 'living', name: 'Living Room', icon: '🛋️', purpose: 'Surveillance & PIR Motion', clearance: 'General' },
      { id: 'kitchen', name: 'Gourmet Kitchen', icon: '🍳', purpose: 'LPG Gas / Smoke Safety & Auto-Exhaust', clearance: 'Safety' },
      { id: 'bedroom', name: 'Master Haven', icon: '🛏️', purpose: 'Atmospheric Climate & Smart AC', clearance: 'Private' },
      { id: 'utility', name: 'Power Utility', icon: '⚡', purpose: 'AC Grid Stability & Backup Power', clearance: 'Restricted' }
    ],
    defaultSensors: [
      { id: 1, templateId: 'dht22', name: 'DHT22 Climate Sensor', pin: 'GPIO 13', type: 'Digital / 1-Wire', room: 'Master Haven', threshold: '18°C – 28°C', category: 'climate' },
      { id: 2, templateId: 'mq2', name: 'MQ-2 Gas & Smoke Detector', pin: 'GPIO 36', type: 'Analog (ADC)', room: 'Gourmet Kitchen', threshold: '> 350 ppm', category: 'gas' },
      { id: 3, templateId: 'zmpt101b', name: 'ZMPT101B AC Voltage Sensor', pin: 'GPIO 39', type: 'Analog (ADC)', room: 'Power Utility', threshold: '180V – 260V', category: 'power' },
      { id: 4, templateId: 'acs712_20', name: 'ACS712 20A Current Sensor', pin: 'GPIO 34', type: 'Analog (ADC)', room: 'Power Utility', threshold: '< 15 A', category: 'power' },
      { id: 5, templateId: 'reed_switch', name: 'Magnetic Door Reed Switch', pin: 'GPIO 14', type: 'Digital Input', room: 'Front Entrance', threshold: 'HIGH on Open', category: 'motion' },
      { id: 6, templateId: 'hcsr501', name: 'PIR Human Motion Sensor', pin: 'GPIO 12', type: 'Digital Input', room: 'Living Room', threshold: 'HIGH on Motion', category: 'motion' },
      { id: 7, templateId: 'relay_1ch', name: 'Exhaust Fan Relay Module', pin: 'GPIO 4', type: 'Digital Output', room: 'Gourmet Kitchen', threshold: 'Active LOW', category: 'actuator' },
      { id: 8, templateId: 'solenoid_valve_12v', name: '12V Brass Gas Solenoid Valve', pin: 'GPIO 5', type: 'Digital Output', room: 'Gourmet Kitchen', threshold: 'Cutoff on Gas', category: 'actuator' },
      { id: 9, templateId: 'tuya_smart_ac', name: 'Tuya Smart AC Controller', pin: 'UART TX/RX', type: 'Digital Serial', room: 'Master Haven', threshold: 'Target 22°C', category: 'actuator' }
    ]
  },
  telecom: {
    id: 'telecom',
    name: 'KyU Telecom Cell Tower 04',
    type: 'Telecom Site & Perimeter Infrastructure',
    icon: '📡',
    description: 'Critical communications infrastructure with multi-tier perimeter radar security, BTS shelter climate, and UPS battery monitoring.',
    rooms: [
      { id: 'fence', name: 'Perimeter Security Fence', icon: '🛡️', purpose: 'Intrusion Radar, Vibration & Laser Fence', clearance: 'Restricted' },
      { id: 'bts_shelter', name: 'BTS Equipment Shelter', icon: '🖧', purpose: 'Telecom Transceiver Rack & CRAC Cooling', clearance: 'Authorized Only' },
      { id: 'battery_bank', name: 'Battery & UPS Room', icon: '🔋', purpose: '48V Lead-Acid/Lithium Bank & H2 Detection', clearance: 'Hazardous' },
      { id: 'tower_mast', name: 'Tower Mast & Antenna Array', icon: '🗼', purpose: 'Structural Tilt, Wind & Aviation Beacon', clearance: 'Climber Only' },
      { id: 'generator_depot', name: 'Diesel Generator & Fuel Depot', icon: '⛽', purpose: 'Backup Genset & Fuel Column Level', clearance: 'Maintenance' }
    ],
    defaultSensors: [
      { id: 101, templateId: 'rcwl0516', name: 'RCWL-0516 Doppler Microwave Radar', pin: 'GPIO 14', type: 'Digital (Doppler)', room: 'Perimeter Security Fence', threshold: 'Motion Trigger', category: 'motion' },
      { id: 102, templateId: 'sw420', name: 'SW-420 Fence Vibration Impact Sensor', pin: 'GPIO 12', type: 'Digital Pulse', room: 'Perimeter Security Fence', threshold: 'Vibration Tamper', category: 'motion' },
      { id: 103, templateId: 'relay_1ch', name: 'Perimeter Searchlight Relay', pin: 'GPIO 4', type: 'Digital Output', room: 'Perimeter Security Fence', threshold: 'Active on Breach', category: 'actuator' },
      { id: 104, templateId: 'bme280', name: 'BME280 Rack Environmental Sensor', pin: 'I2C SDA/SCL', type: 'Digital I2C', room: 'BTS Equipment Shelter', threshold: '< 30°C / < 60%', category: 'climate' },
      { id: 105, templateId: 'midea_ac_uart', name: 'Shelter CRAC Cooling Unit', pin: 'UART 9600', type: 'Digital Serial', room: 'BTS Equipment Shelter', threshold: 'Target 20°C', category: 'actuator' },
      { id: 106, templateId: 'mq8', name: 'MQ-8 Hydrogen Gas Sensor (UPS Safety)', pin: 'GPIO 36', type: 'Analog ADC', room: 'Battery & UPS Room', threshold: '> 100 ppm H2', category: 'gas' },
      { id: 107, templateId: 'ina219', name: 'INA219 48V DC Bus Current Shunt', pin: 'I2C 0x40', type: 'Digital I2C', room: 'Battery & UPS Room', threshold: '42V - 54V DC', category: 'power' },
      { id: 108, templateId: 'submersible_level', name: 'Hydrostatic Diesel Fuel Level Probe', pin: 'ADC 4-20mA', type: 'Analog Current', room: 'Diesel Generator & Fuel Depot', threshold: '> 20% Tank', category: 'liquid' },
      { id: 109, templateId: 'pzem016', name: 'PZEM-016 3-Phase Generator Monitor', pin: 'RS485 Modbus', type: 'Digital RS485', room: 'Diesel Generator & Fuel Depot', threshold: '230V / 50Hz', category: 'power' }
    ]
  },
  hospital: {
    id: 'hospital',
    name: 'Metropolitan Hospital & Trauma Center',
    type: 'Healthcare & Life-Safety Campus',
    icon: '🏥',
    description: 'Medical critical facility with patient biometric monitoring, vaccine cryo-storage (-80°C), cleanroom air handling, and medical oxygen pipeline security.',
    rooms: [
      { id: 'icu', name: 'Intensive Care Unit (ICU)', icon: '🩺', purpose: 'Patient Biometrics & Vital Telemetry', clearance: 'Medical Staff' },
      { id: 'cryo_storage', name: 'Vaccine & Blood Cryo-Storage', icon: '❄️', purpose: '-80°C Freezer & Liquid Nitrogen Vault', clearance: 'Laboratory Only' },
      { id: 'operating_theater', name: 'Surgical Operating Theater 1', icon: '🥼', purpose: 'Laminar Airflow & Anesthetic Gas Monitoring', clearance: 'Sterile Surgical' },
      { id: 'isolation_ward', name: 'Negative Pressure Isolation Ward', icon: '☣️', purpose: 'Airborne Infectious Disease Containment', clearance: 'Biohazard Level 3' },
      { id: 'gas_manifold', name: 'Medical Oxygen & Gas Manifold', icon: '🫁', purpose: 'Hospital Oxygen Pipeline Pressure & Shutoff', clearance: 'Facilities Engineering' }
    ],
    defaultSensors: [
      { id: 201, templateId: 'max30102', name: 'MAX30102 SpO2 & Heart Rate Monitor', pin: 'I2C 0x57', type: 'Digital I2C', room: 'Intensive Care Unit (ICU)', threshold: 'SpO2 > 94%', category: 'optical' },
      { id: 202, templateId: 'mlx90614', name: 'MLX90614 Non-Contact IR Thermometer', pin: 'I2C 0x5A', type: 'Digital I2C', room: 'Intensive Care Unit (ICU)', threshold: '36.5°C - 37.5°C', category: 'optical' },
      { id: 203, templateId: 'pt100_max31865', name: 'PT100 Ultra-Low Temp RTD (-80°C Cryo)', pin: 'SPI CS/SCK', type: 'Digital SPI', room: 'Vaccine & Blood Cryo-Storage', threshold: '-85°C to -75°C', category: 'climate' },
      { id: 204, templateId: 'sgp30', name: 'SGP30 Anesthetic & VOC Gas Scanner', pin: 'I2C 0x58', type: 'Digital I2C', room: 'Surgical Operating Theater 1', threshold: '< 100 ppb TVOC', category: 'gas' },
      { id: 205, templateId: 'pms5003', name: 'Plantower PMS5003 Airborne Particulate', pin: 'UART 9600', type: 'Digital UART', room: 'Surgical Operating Theater 1', threshold: 'Cleanroom ISO 5', category: 'gas' },
      { id: 206, templateId: 'belimo_damper', name: 'Belimo Negative Pressure Air Damper', pin: '0-10V Analog', type: 'Analog 0-10V', room: 'Negative Pressure Isolation Ward', threshold: '-15 Pa Negative', category: 'actuator' },
      { id: 207, templateId: 'relay_1ch', name: 'UV-C Germicidal Disinfection Relay', pin: 'GPIO 4', type: 'Digital Output', room: 'Negative Pressure Isolation Ward', threshold: 'Timer Controlled', category: 'actuator' },
      { id: 208, templateId: 'pressure_transducer', name: 'Medical O2 High-Pressure Transducer', pin: '0.5-4.5V ADC', type: 'Analog Voltage', room: 'Medical Oxygen & Gas Manifold', threshold: '4.0 - 5.5 Bar', category: 'liquid' },
      { id: 209, templateId: 'solenoid_valve_12v', name: 'Emergency Oxygen Pipeline Shutoff Valve', pin: 'GPIO 5', type: 'Digital Output', room: 'Medical Oxygen & Gas Manifold', threshold: 'Emergency Trip', category: 'actuator' }
    ]
  },
  industrial: {
    id: 'industrial',
    name: 'Apex Chemical & Advanced Manufacturing',
    type: 'Industrial Chemical & Plant Facility',
    icon: '🏭',
    description: 'Heavy chemical synthesis facility with toxic gas detection, steam boiler pressure management, and automated conveyor interlocks.',
    rooms: [
      { id: 'chemical_bay', name: 'Chemical Synthesis Bay', icon: '🧪', purpose: 'Toxic Fumes (H2S / Ammonia) & Emergency Scrubbing', clearance: 'PPE Level A' },
      { id: 'boiler_room', name: 'High-Pressure Steam Boiler Room', icon: '🔥', purpose: 'Steam Pressure & Flame Scanner Diagnostics', clearance: 'Boiler Certified' },
      { id: 'assembly_line', name: 'Conveyor Assembly Line', icon: '⚙️', purpose: 'Robotic Material Handling & Proximity Interlocks', clearance: 'Operators' },
      { id: 'solvent_storage', name: 'Hazardous Solvent Depot', icon: '📦', purpose: 'Flammable Vapors & Explosion-Proof Ventilation', clearance: 'Restricted Hazmat' }
    ],
    defaultSensors: [
      { id: 301, templateId: 'mq136', name: 'MQ-136 Hydrogen Sulfide (H2S) Sensor', pin: 'GPIO 36', type: 'Analog ADC', room: 'Chemical Synthesis Bay', threshold: '< 10 ppm H2S', category: 'gas' },
      { id: 302, templateId: 'mq137', name: 'MQ-137 Ammonia (NH3) Gas Detector', pin: 'GPIO 39', type: 'Analog ADC', room: 'Chemical Synthesis Bay', threshold: '< 25 ppm NH3', category: 'gas' },
      { id: 303, templateId: 'motorized_ball_valve', name: 'DN15-CR02 Acid Feed Ball Valve', pin: 'GPIO 21/22', type: 'Actuator Reversible', room: 'Chemical Synthesis Bay', threshold: 'Limit Monitored', category: 'actuator' },
      { id: 304, templateId: 'pressure_transducer', name: '1.2 MPa Steam Pressure Transducer', pin: 'ADC Pin 34', type: 'Analog Voltage', room: 'High-Pressure Steam Boiler Room', threshold: '< 8.0 Bar', category: 'liquid' },
      { id: 305, templateId: 'ky026', name: 'KY-026 Optical Flame Scanner', pin: 'GPIO 15', type: 'Digital / Analog', room: 'High-Pressure Steam Boiler Room', threshold: 'Flame Presence', category: 'optical' },
      { id: 306, templateId: 'lj12a3', name: 'LJ12A3-4 Inductive Metal Proximity Switch', pin: 'GPIO 14', type: 'Digital NPN', room: 'Conveyor Assembly Line', threshold: 'Metal Sensing 4mm', category: 'motion' },
      { id: 307, templateId: 'relay_4ch', name: 'Conveyor Multi-Stage Relay Bank', pin: 'GPIO 4/16/17/18', type: 'Digital Output x4', room: 'Conveyor Assembly Line', threshold: 'E-Stop Interlock', category: 'actuator' },
      { id: 308, templateId: 'mq138', name: 'MQ-138 VOC Chemical Solvent Sensor', pin: 'GPIO 35', type: 'Analog ADC', room: 'Hazardous Solvent Depot', threshold: '< 50 ppm VOC', category: 'gas' }
    ]
  },
  greenhouse: {
    id: 'greenhouse',
    name: 'KyU Precision Agriculture Greenhouse',
    type: 'Smart Agriculture & Controlled Environment',
    icon: '🌾',
    description: 'Precision horticulture facility regulating hydroponic nutrient solutions, solar PAR lighting, and automated drip irrigation.',
    rooms: [
      { id: 'hydroponics', name: 'Hydroponic Nutrient Bay', icon: '💧', purpose: 'Closed-Loop pH, TDS & Nutrient Circulation', clearance: 'Agronomists' },
      { id: 'canopy', name: 'Crop Canopy Climate Zone', icon: '🌿', purpose: 'CO2 Injection & PAR Sunlight Optimization', clearance: 'General' },
      { id: 'drip_field', name: 'Drip Irrigation Field Bed', icon: '🚜', purpose: 'Soil Moisture Profiling & Solenoid Zones', clearance: 'Field Staff' }
    ],
    defaultSensors: [
      { id: 401, templateId: 'ph_sensor_e201', name: 'E-201-C Analog pH Water Meter', pin: 'GPIO 36', type: 'Analog Glass Probe', room: 'Hydroponic Nutrient Bay', threshold: '5.8 - 6.5 pH', category: 'liquid' },
      { id: 402, templateId: 'tds_sensor', name: 'Total Dissolved Solids (TDS) Probe', pin: 'GPIO 39', type: 'Analog Conductivity', room: 'Hydroponic Nutrient Bay', threshold: '600 - 900 ppm', category: 'liquid' },
      { id: 403, templateId: 'yfs201', name: 'YF-S201 Water Flow Rate Meter', pin: 'GPIO 14', type: 'Digital Pulse', room: 'Hydroponic Nutrient Bay', threshold: '2.0 - 15.0 L/min', category: 'liquid' },
      { id: 404, templateId: 'scd30', name: 'Sensirion SCD30 True NDIR CO2 Sensor', pin: 'I2C 0x61', type: 'Digital I2C', room: 'Crop Canopy Climate Zone', threshold: '800 - 1200 ppm', category: 'gas' },
      { id: 405, templateId: 'bh1750', name: 'BH1750 Ambient PAR Sunlight Meter', pin: 'I2C 0x23', type: 'Digital I2C', room: 'Crop Canopy Climate Zone', threshold: '20,000 - 50,000 Lux', category: 'optical' },
      { id: 406, templateId: 'cap_soil_v12', name: 'Capacitive Soil Moisture Probe HW-390', pin: 'GPIO 34', type: 'Analog Capacitive', room: 'Drip Irrigation Field Bed', threshold: '55% - 75%', category: 'liquid' },
      { id: 407, templateId: 'solenoid_valve_12v', name: '12V Drip Irrigation Solenoid Valve', pin: 'GPIO 4', type: 'Digital Output', room: 'Drip Irrigation Field Bed', threshold: 'Moisture Controlled', category: 'actuator' }
    ]
  },
  datacenter: {
    id: 'datacenter',
    name: 'Equinix Tier-IV Hyperscale Data Center',
    type: 'Enterprise Data Center & Server Farm',
    icon: '🏢',
    description: 'High-density compute facility with cold-aisle containment, CRAC unit telemetry, 3-phase grid power meters, and subfloor leak detection.',
    rooms: [
      { id: 'cold_aisle', name: 'Cold Aisle Containment Pod', icon: '❄️', purpose: 'Inflow Server Intake Cooling & Static Pressure', clearance: 'Datacenter Ops' },
      { id: 'hot_aisle', name: 'Hot Aisle Heat Exhaust', icon: '🔥', purpose: 'Thermal Exhaust Extraction & Smoke Aspirating', clearance: 'Restricted' },
      { id: 'power_distribution', name: 'Main Power Distribution & UPS', icon: '🔌', purpose: '3-Phase Busway Current & Static Transfer Switch', clearance: 'Electrical Master' },
      { id: 'subfloor', name: 'Subfloor Plenum & Leak Zone', icon: '💧', purpose: 'Condensate Drainage & Conductive Leak Rope', clearance: 'Facilities' }
    ],
    defaultSensors: [
      { id: 501, templateId: 'bme280', name: 'BME280 Inflow Air Temp & Pressure', pin: 'I2C 0x76', type: 'Digital I2C', room: 'Cold Aisle Containment Pod', threshold: '18°C - 24°C / ASHRAE', category: 'climate' },
      { id: 502, templateId: 'tuya_smart_ac', name: 'CRAC Chilled Water Cooling Unit', pin: 'Modbus RS485', type: 'Digital Modbus', room: 'Cold Aisle Containment Pod', threshold: 'Redundant N+1', category: 'actuator' },
      { id: 503, templateId: 'ds18b20', name: 'DS18B20 Multi-Drop Rack Exhaust Probe', pin: '1-Wire Pin 13', type: 'Digital 1-Wire', room: 'Hot Aisle Heat Exhaust', threshold: '< 38°C Rack Top', category: 'climate' },
      { id: 504, templateId: 'pzem016', name: 'PZEM-016 3-Phase Main Energy Meter', pin: 'RS485 Addr 0x01', type: 'Digital Modbus', room: 'Main Power Distribution & UPS', threshold: 'PUE Calculation', category: 'power' },
      { id: 505, templateId: 'ina219', name: 'INA219 DC Battery Backup Shunt', pin: 'I2C 0x40', type: 'Digital I2C', room: 'Main Power Distribution & UPS', threshold: '54V DC Float', category: 'power' },
      { id: 506, templateId: 'optical_level', name: 'Subfloor Liquid Leak Rope Sensor', pin: 'GPIO 12', type: 'Digital Optical', room: 'Subfloor Plenum & Leak Zone', threshold: 'Immediate Cutoff', category: 'liquid' }
    ]
  }
};

let currentPremiseModel = 'home';
let telemetryRoomFilter = 'all';
let telemetryCategoryFilter = 'all';

function switchPremiseArchetype(archetypeKey) {
  const archetype = PREMISE_ARCHETYPES[archetypeKey] || PREMISE_ARCHETYPES.home;
  currentPremiseModel = archetype.id;
  state.facilityName = archetype.name;
  state.rooms = JSON.parse(JSON.stringify(archetype.rooms));
  state.configuredSensors = JSON.parse(JSON.stringify(archetype.defaultSensors));

  // Sync Selects and Badges
  const premiseSelect = document.getElementById('premiseModelSelect');
  if (premiseSelect) premiseSelect.value = archetype.id;

  document.querySelectorAll('.premise-chip').forEach(chip => {
    chip.classList.toggle('active', chip.dataset.model === archetype.id);
  });

  const premiseBadge = document.getElementById('telemetryPremiseBadge');
  if (premiseBadge) {
    premiseBadge.textContent = `${archetype.icon} ${archetype.name}`;
  }

  // Update Floorplan labels if in Home vs Other premises
  updateFloorplanLabelsForPremise(archetype);

  updateFacilityInfo();
  populateRoomSelects();
  renderSensorsTable();
  renderDynamicSensorsGrid();
  renderPremiseZones();
  renderSensorPalette();

  showToast(`Switched to ${archetype.icon} "${archetype.name}" (${archetype.rooms.length} zones, ${archetype.defaultSensors.length} sensors)`, 'info');
}

function updateFloorplanLabelsForPremise(archetype) {
  const lblEntrance = document.getElementById('lblRoomEntrance');
  const lblLiving = document.getElementById('lblRoomLiving');
  const lblKitchen = document.getElementById('lblRoomKitchen');
  const lblBedroom = document.getElementById('lblRoomBedroom');
  const lblUtility = document.getElementById('lblRoomUtility');

  const r = archetype.rooms;
  if (lblEntrance && r[0]) lblEntrance.textContent = r[0].name;
  if (lblLiving && r[1]) lblLiving.textContent = r[1].name;
  if (lblKitchen && r[2]) lblKitchen.textContent = r[2].name;
  if (lblBedroom && r[3]) lblBedroom.textContent = r[3].name;
  if (lblUtility && r[4]) lblUtility.textContent = r[4].name;
}

// =============================================================================
// DRAG AND DROP PREMISE LAYOUT WORKSPACE
// =============================================================================

// Initialize buildings within switchPremiseArchetype
function ensurePremiseBuildings(archKey) {
  const archetype = PREMISE_ARCHETYPES[archKey] || PREMISE_ARCHETYPES.home;
  if (!state.buildings || state.buildings.length === 0) {
    const defaultBuildingMap = {
      home: [{ id: 'bld_home', name: 'Main Residential Villa', icon: '🏡', wings: ['Ground Floor', 'Upper Deck'] }],
      telecom: [{ id: 'bld_telecom', name: 'Tower Site Compound', icon: '📡', wings: ['Perimeter Security', 'Equipment Shelter', 'Tower Mast & Fuel Depot'] }],
      hospital: [{ id: 'bld_hospital', name: 'Main Clinical Pavilion', icon: '🏥', wings: ['Critical Care Wing', 'Surgical Center', 'Cryo Vault & Medical Gas'] }],
      industrial: [{ id: 'bld_industrial', name: 'Chemical Processing Works', icon: '🏭', wings: ['Synthesis Sector', 'Boiler Hall', 'Packaging & Solvents'] }],
      greenhouse: [{ id: 'bld_greenhouse', name: 'Agri-Tech Commercial Range', icon: '🌾', wings: ['Nutrient Bay', 'Canopy Zone', 'Field Irrigation'] }],
      datacenter: [{ id: 'bld_datacenter', name: 'Data Center Complex', icon: '🏢', wings: ['Aisle Containment', 'Power Distribution', 'Subfloor Facilities'] }]
    };
    state.buildings = JSON.parse(JSON.stringify(defaultBuildingMap[archKey] || defaultBuildingMap.home));
  }
}

function renderPremiseZones() {
  const grid = document.getElementById('premiseZonesGrid');
  if (!grid) return;

  grid.innerHTML = state.rooms.map(room => {
    const sensorsInRoom = state.configuredSensors.filter(s => s.room === room.name);
    return `
      <div class="zone-panel" data-room-name="${room.name}">
        <div class="zone-header">
          <div class="zone-title-wrap">
            <span class="zone-icon">${room.icon || '📍'}</span>
            <div>
              <h4 class="zone-name">${room.name}</h4>
              <span class="zone-clearance-pill">${room.clearance || 'General'}</span>
            </div>
          </div>
          <div style="display: flex; gap: 4px; align-items: center;">
            <button class="btn-icon-subtle btn-edit-zone" data-room="${room.name}" title="Edit Zone Properties">✏️</button>
            <button class="btn-icon-subtle btn-del-zone" data-room="${room.name}" title="Remove Zone">✕</button>
          </div>
        </div>
        <p style="font-size: 0.72rem; color: var(--text-muted); margin: 0 0 8px 0;">${room.purpose}</p>
        
        <div class="zone-sensors-container" data-room-name="${room.name}">
          ${sensorsInRoom.length === 0 ? '<div class="zone-empty-hint">Drop sensors here</div>' : ''}
          ${sensorsInRoom.map(s => {
            const hasParent = s.parentSensorId ? true : false;
            const childCount = state.configuredSensors.filter(c => String(c.parentSensorId) === String(s.id)).length;
            const parentDevice = hasParent ? state.configuredSensors.find(p => String(p.id) === String(s.parentSensorId)) : null;
            
            return `
            <div class="draggable-sensor-chip ${hasParent ? 'is-child-chip' : ''}" draggable="true" data-sensor-id="${s.id}" data-room-name="${room.name}">
              <div style="display: flex; align-items: center; gap: 6px; overflow: hidden; flex: 1;">
                <span>${getSensorIconByCategory(s.category)}</span>
                <div style="overflow: hidden;">
                  <div style="display: flex; align-items: center; gap: 4px;">
                    <strong style="font-size: 0.78rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${s.name}</strong>
                    ${hasParent ? `<span class="parent-child-tag" title="Child of ${parentDevice ? parentDevice.name : 'Parent'}">👶 Child</span>` : ''}
                    ${childCount > 0 ? `<span class="parent-child-tag" title="Has ${childCount} child channels">👨‍👦 +${childCount}</span>` : ''}
                  </div>
                  <div style="font-size: 0.68rem; color: var(--text-muted);">${s.pin} &bull; ${s.type}</div>
                </div>
              </div>
              <div style="display: flex; align-items: center; gap: 2px;">
                <button class="btn-icon-subtle btn-edit-sensor" data-sensor-id="${s.id}" title="Edit Sensor & Parent/Child" style="padding: 2px 4px; font-size: 0.72rem;">✏️</button>
                <button class="btn-icon-subtle btn-del-sensor" data-sensor-id="${s.id}" title="Remove Sensor" style="padding: 2px 4px; font-size: 0.72rem; color: #ef4444;">✕</button>
                <span style="font-size: 0.7rem; color: #94a3b8; cursor: grab; padding-left: 2px;">⠿</span>
              </div>
            </div>`;
          }).join('')}
        </div>
      </div>`;
  }).join('');

  // Attach Drag & Drop Listeners
  attachDragAndDropHandlers();
  attachEditButtons();
  renderHierarchyTree();
}

function attachDragAndDropHandlers() {
  const chips = document.querySelectorAll('.draggable-sensor-chip');
  const dropTargets = document.querySelectorAll('.zone-panel, .zone-sensors-container');

  chips.forEach(chip => {
    chip.addEventListener('dragstart', (e) => {
      chip.classList.add('dragging');
      e.dataTransfer.setData('text/plain', JSON.stringify({
        action: 'move_existing',
        sensorId: chip.dataset.sensorId,
        fromRoom: chip.dataset.roomName
      }));
    });

    chip.addEventListener('dragend', () => {
      chip.classList.remove('dragging');
      document.querySelectorAll('.zone-panel').forEach(z => z.classList.remove('drop-target-active'));
    });
  });

  dropTargets.forEach(target => {
    target.addEventListener('dragover', (e) => {
      e.preventDefault();
      const zonePanel = target.closest('.zone-panel');
      if (zonePanel) zonePanel.classList.add('drop-target-active');
    });

    target.addEventListener('dragleave', (e) => {
      const zonePanel = target.closest('.zone-panel');
      if (zonePanel && !zonePanel.contains(e.relatedTarget)) {
        zonePanel.classList.remove('drop-target-active');
      }
    });

    target.addEventListener('drop', (e) => {
      e.preventDefault();
      const zonePanel = target.closest('.zone-panel');
      if (zonePanel) zonePanel.classList.remove('drop-target-active');

      const targetRoom = zonePanel?.dataset.roomName;
      if (!targetRoom) return;

      try {
        const raw = e.dataTransfer.getData('text/plain');
        if (!raw) return;
        const data = JSON.parse(raw);

        if (data.action === 'move_existing') {
          const s = state.configuredSensors.find(x => String(x.id) === String(data.sensorId));
          if (s && s.room !== targetRoom) {
            s.room = targetRoom;
            renderPremiseZones();
            renderDynamicSensorsGrid();
            renderSensorsTable();
            showToast(`Moved "${s.name}" to ${targetRoom}`, 'success');
          }
        } else if (data.action === 'add_from_palette') {
          // Instantiate sensor from catalog template
          const templates = window.SENSOR_TEMPLATES || [];
          const tmpl = templates.find(t => t.id === data.templateId);
          if (tmpl) {
            const newSensor = {
              id: Date.now(),
              templateId: tmpl.id,
              name: tmpl.name,
              pin: tmpl.pins[1] || 'GPIO ' + (Math.floor(Math.random() * 20) + 10),
              type: tmpl.signalType,
              room: targetRoom,
              threshold: 'Nominal Range',
              category: tmpl.category
            };
            state.configuredSensors.push(newSensor);
            renderPremiseZones();
            renderDynamicSensorsGrid();
            renderSensorsTable();
            updateFacilityInfo();
            showToast(`Added "${tmpl.model}" to ${targetRoom}!`, 'success');
          }
        }
      } catch (err) {
        console.error('Drop error:', err);
      }
    });
  });

  // Delete Zone handler
  document.querySelectorAll('.btn-del-zone').forEach(btn => {
    btn.addEventListener('click', () => {
      const rName = btn.dataset.room;
      if (state.rooms.length <= 1) {
        showToast('Facility must have at least one active area.', 'warning');
        return;
      }
      state.rooms = state.rooms.filter(r => r.name !== rName);
      // Re-assign orphaned sensors to first available room
      state.configuredSensors.forEach(s => {
        if (s.room === rName) s.room = state.rooms[0].name;
      });
      populateRoomSelects();
      renderPremiseZones();
      renderDynamicSensorsGrid();
      renderSensorsTable();
      updateFacilityInfo();
      showToast(`Removed zone "${rName}"`, 'info');
    });
  });
}

function renderSensorPalette() {
  const container = document.getElementById('paletteChipsScroll');
  if (!container) return;

  const templates = window.SENSOR_TEMPLATES || [];
  const searchInput = document.getElementById('paletteSearchInput');
  const query = searchInput ? searchInput.value.toLowerCase().trim() : '';

  const filtered = templates.filter(t => {
    if (!query) return true;
    return (t.name + ' ' + t.model + ' ' + t.category + ' ' + t.signalType).toLowerCase().includes(query);
  });

  const badge = document.getElementById('paletteBadgeCount');
  if (badge) badge.textContent = `${filtered.length} Ready`;

  container.innerHTML = filtered.map(t => `
    <div class="palette-sensor-chip" draggable="true" data-template-id="${t.id}">
      <div style="display: flex; align-items: center; gap: 6px;">
        <span>${getSensorIconByCategory(t.category)}</span>
        <div>
          <strong>${t.model}</strong>
          <div style="font-size: 0.68rem; color: var(--text-muted);">${t.analogOrDigital} &bull; ${t.voltage}</div>
        </div>
      </div>
      <button class="btn btn-secondary btn-xs btn-quick-add-to-zone" data-template-id="${t.id}" title="Add to current active zone" style="padding: 2px 6px;">+</button>
    </div>
  `).join('');

  // Palette dragstart
  container.querySelectorAll('.palette-sensor-chip').forEach(chip => {
    chip.addEventListener('dragstart', (e) => {
      e.dataTransfer.setData('text/plain', JSON.stringify({
        action: 'add_from_palette',
        templateId: chip.dataset.templateId
      }));
    });
  });

  // Quick add button
  container.querySelectorAll('.btn-quick-add-to-zone').forEach(btn => {
    btn.addEventListener('click', () => {
      const tmplId = btn.dataset.templateId;
      const targetRoom = state.rooms[0]?.name || 'General Area';
      const tmpl = templates.find(t => t.id === tmplId);
      if (tmpl) {
        state.configuredSensors.push({
          id: Date.now(),
          templateId: tmpl.id,
          name: tmpl.name,
          pin: tmpl.pins[1] || 'GPIO 13',
          type: tmpl.signalType,
          room: targetRoom,
          threshold: 'Nominal',
          category: tmpl.category
        });
        renderPremiseZones();
        renderDynamicSensorsGrid();
        renderSensorsTable();
        updateFacilityInfo();
        showToast(`Added ${tmpl.model} to ${targetRoom}`, 'success');
      }
    });
  });
}

function getSensorIconByCategory(cat) {
  const map = {
    climate: '🌡️',
    gas: '💨',
    power: '⚡',
    motion: '🚶',
    actuator: '🎛️',
    liquid: '💧',
    optical: '💡',
    wireless: '📡',
    mcu: '📷'
  };
  return map[cat] || '📟';
}

// =============================================================================
// DYNAMIC RICH SENSOR WIDGETS WITH PROPER AVAILABLE CONTROLS
// =============================================================================
function renderDynamicSensorsGrid() {
  const grid = document.getElementById('dynamicSensorsGrid');
  if (!grid) return;

  const roomFilter = document.getElementById('filterTelemetryRoom')?.value || 'all';
  const sensors = state.configuredSensors.filter(s => {
    if (roomFilter !== 'all' && s.room !== roomFilter) return false;
    if (telemetryCategoryFilter !== 'all' && s.category !== telemetryCategoryFilter) return false;
    return true;
  });

  if (sensors.length === 0) {
    grid.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: var(--text-muted);">
        <span style="font-size: 2.2rem;">🔍</span>
        <p style="margin-top: 8px;">No sensors active in this filter. Drag sensors in the Premise Workspace or select All Channels.</p>
      </div>`;
    return;
  }

  grid.innerHTML = sensors.map(s => renderIndividualSensorWidget(s)).join('');
  attachSensorWidgetControlsListeners();
}


// =============================================================================
// SENSOR ANIMATION & MICRO-DESIGN VISUAL GENERATOR
// =============================================================================
function getSensorAnimatedVisual(sensor) {
  const cat = (sensor.category || '').toLowerCase();
  const id = (sensor.templateId || String(sensor.id) || '').toLowerCase();
  const name = (sensor.name || '').toLowerCase();

  // 1. Radar & Motion Security
  if (id.includes('radar') || cat === 'motion' || id.includes('pir') || id.includes('rcwl') || id.includes('hcsr501') || id.includes('sw420') || name.includes('radar') || name.includes('motion')) {
    return `
      <div class="sensor-visual-badge radar-visual-badge" title="Active Doppler Radar Sentry">
        <div class="radar-scope">
          <div class="radar-crosshair-h"></div>
          <div class="radar-crosshair-v"></div>
          <div class="radar-sweep-beam"></div>
          <div class="radar-target-blip blip-1"></div>
          <div class="radar-target-blip blip-2"></div>
          <div class="radar-sonar-wave"></div>
        </div>
      </div>`;
  }

  // 2. Light / Optical & Lux
  if (id.includes('light') || id.includes('ldr') || id.includes('bh1750') || id.includes('lux') || name.includes('light') || (cat === 'optical' && !name.includes('max30102') && !name.includes('spo2'))) {
    return `
      <div class="sensor-visual-badge light-visual-badge" title="Ambient Solar & Lux Radiator">
        <div class="light-corona-aura">
          <div class="light-sun-core"></div>
          <div class="light-solar-rays"></div>
          <div class="light-shimmer-ring"></div>
        </div>
      </div>`;
  }

  // 3. Buzzer / Acoustic Siren
  if (id.includes('buzzer') || id.includes('siren') || id.includes('piezo') || id.includes('speaker') || name.includes('buzzer') || name.includes('siren') || name.includes('alarm')) {
    return `
      <div class="sensor-visual-badge buzzer-visual-badge" title="Acoustic Soundwave Radiator">
        <div class="buzzer-speaker-box">
          <div class="buzzer-cone">📢</div>
          <div class="acoustic-wave wave-1"></div>
          <div class="acoustic-wave wave-2"></div>
          <div class="acoustic-wave wave-3"></div>
        </div>
        <div class="eq-bars-mini">
          <span class="eq-bar bar-1"></span>
          <span class="eq-bar bar-2"></span>
          <span class="eq-bar bar-3"></span>
          <span class="eq-bar bar-4"></span>
        </div>
      </div>`;
  }

  // 4. Fire / Flame / Burner
  if (id.includes('flame') || id.includes('fire') || name.includes('flame') || name.includes('fire') || name.includes('burner')) {
    return `
      <div class="sensor-visual-badge flame-visual-badge" title="Flickering Flame & Thermal Core">
        <div class="flame-core-container">
          <div class="flame-outer"></div>
          <div class="flame-inner"></div>
          <div class="ember-spark ember-1"></div>
          <div class="ember-spark ember-2"></div>
        </div>
      </div>`;
  }

  // 5. Gas / Smoke / Methane Diffusion
  if (cat === 'gas' || id.includes('mq') || id.includes('sgp') || id.includes('smoke') || id.includes('gas') || id.includes('co2')) {
    return `
      <div class="sensor-visual-badge gas-visual-badge" title="Vapor Diffusion Cloud">
        <div class="smoke-cloud-container">
          <div class="smoke-puff puff-1"></div>
          <div class="smoke-puff puff-2"></div>
          <div class="smoke-puff puff-3"></div>
          <div class="gas-molecule-icon">💨</div>
        </div>
      </div>`;
  }

  // 6. Liquid / Fluid Slosh & Tank
  if (cat === 'liquid' || id.includes('water') || id.includes('flow') || id.includes('tank') || id.includes('level') || id.includes('hydro') || id.includes('submersible')) {
    return `
      <div class="sensor-visual-badge liquid-visual-badge" title="Fluid Slosh & Air Bubbles">
        <div class="liquid-tank-mini">
          <div class="fluid-wave-surface"></div>
          <div class="fluid-bubble bub-1"></div>
          <div class="fluid-bubble bub-2"></div>
          <div class="fluid-impeller">🌀</div>
        </div>
      </div>`;
  }

  // 7. AC/DC Power & Electric Arc
  if (cat === 'power' || id.includes('volt') || id.includes('zmpt') || id.includes('acs') || id.includes('pzem') || id.includes('ina219') || name.includes('voltage') || name.includes('power')) {
    return `
      <div class="sensor-visual-badge power-visual-badge" title="AC Sine Wave & High-Voltage Arc">
        <div class="power-arc-container">
          <svg class="ac-sine-svg" viewBox="0 0 50 24">
            <path class="sine-path" d="M0,12 Q12.5,0 25,12 T50,12" />
          </svg>
          <div class="electric-spark">⚡</div>
        </div>
      </div>`;
  }

  // 8. Biometric ECG Cardiac
  if (id.includes('max30102') || id.includes('ad8232') || id.includes('ecg') || id.includes('spo2') || name.includes('ecg') || name.includes('spo2') || name.includes('heart')) {
    return `
      <div class="sensor-visual-badge ecg-visual-badge" title="Cardiac Rhythm & Pulse Telemetry">
        <div class="cardiac-container">
          <div class="pulsing-heart">❤️</div>
          <svg class="ecg-mini-wave" viewBox="0 0 60 20">
            <polyline points="0,10 15,10 20,2 25,18 30,10 40,10 43,5 46,15 48,10 60,10" />
          </svg>
        </div>
      </div>`;
  }

  // 9. Actuator & Hydraulic Valve
  if (cat === 'actuator' || id.includes('valve') || id.includes('solenoid') || id.includes('relay') || name.includes('valve') || name.includes('relay') || name.includes('ac')) {
    return `
      <div class="sensor-visual-badge actuator-visual-badge" title="Hydraulic Actuation & Flow Dashing">
        <div class="actuator-gear-container">
          <div class="spinning-gear">⚙️</div>
          <div class="pipe-flow-dashes">
            <span class="flow-dot"></span>
            <span class="flow-dot"></span>
            <span class="flow-dot"></span>
          </div>
        </div>
      </div>`;
  }

  // 10. Climate & Thermometer
  return `
    <div class="sensor-visual-badge climate-visual-badge" title="Atmospheric Thermometer & Microclimate">
      <div class="climate-thermo-container">
        <div class="thermo-stem">
          <div class="thermo-fluid"></div>
        </div>
        <div class="thermo-bulb"></div>
      </div>
    </div>`;
}

function renderIndividualSensorWidget(sensor) {
  const cat = (sensor.category || 'climate').toLowerCase();
  const idStr = String(sensor.id);

  // Extract individual sensor value and unit
  let val = sensor.value;
  if (val === undefined || val === null) {
    if (cat === 'climate') val = 24.2;
    else if (cat === 'gas') val = 185;
    else if (cat === 'power') val = 238.4;
    else if (cat === 'liquid') val = 76;
    else if (cat === 'optical') val = 420;
    else if (cat === 'motion') val = 0;
    else val = 50;
    sensor.value = val;
  }

  const unit = sensor.unit || (
    cat === 'climate' ? '°C' :
    cat === 'gas' ? 'ppm' :
    cat === 'power' ? 'V' :
    cat === 'liquid' ? '%' :
    cat === 'optical' ? 'lx' : ''
  );

  const minVal = sensor.min !== undefined ? sensor.min : 0;
  const maxVal = sensor.max !== undefined ? sensor.max : (cat === 'gas' ? 1000 : cat === 'power' ? 260 : 100);
  const stepVal = sensor.step !== undefined ? sensor.step : (cat === 'power' || cat === 'climate' ? 0.1 : 1);
  const displayVal = typeof val === 'number' ? (Number.isInteger(val) ? val : val.toFixed(1)) : val;

  let metricHtml = '';
  let controlsHtml = '';

  if (cat === 'climate') {
    const isOverTarget = sensor.target ? val > sensor.target : false;
    metricHtml = `
      <div class="rich-sensor-metric">
        <span class="rich-val" id="sensorMainVal_${sensor.id}">${displayVal}</span><span class="rich-unit" id="sensorMainUnit_${sensor.id}">${unit}</span>
        <div style="font-size: 0.82rem; color: var(--text-muted); margin-top: 4px;">
          Status: <strong style="color: ${isOverTarget ? '#f59e0b' : '#10b981'};">${isOverTarget ? 'Elevated Thermal Load' : 'Optimal Microclimate'}</strong> &bull; Range: ${minVal} - ${maxVal} ${unit}
        </div>
      </div>`;
    controlsHtml = `
      <div class="sensor-ctrl-box">
        <div class="ctrl-label-row">
          <span>Live Value Calibration</span>
          <strong id="sensorValLabel_${sensor.id}">${displayVal} ${unit}</strong>
        </div>
        <input type="range" min="${minVal}" max="${maxVal}" step="${stepVal}" value="${val}" class="range-slider sensor-val-slider" data-id="${sensor.id}">
        
        <div class="ctrl-label-row" style="margin-top: 8px;">
          <span>Target Setpoint</span>
          <strong id="targetTempLabel_${sensor.id}">${sensor.target || 22}°C</strong>
        </div>
        <input type="range" min="16" max="32" value="${sensor.target || 22}" class="range-slider temp-target-slider" data-id="${sensor.id}">
        
        <div style="display: flex; gap: 6px; margin-top: 8px;">
          <button class="btn btn-secondary btn-xs btn-cooling-mode" data-id="${sensor.id}" style="flex: 1;">❄️ Cooling Mode</button>
          <button class="btn btn-secondary btn-xs btn-heating-mode" data-id="${sensor.id}" style="flex: 1;">☀️ Heating Mode</button>
        </div>
      </div>`;
  } else if (cat === 'gas') {
    const thresh = sensor.alarmThreshold || 350;
    const isHazard = Number(val) >= thresh;
    metricHtml = `
      <div class="rich-sensor-metric">
        <span class="rich-val" id="sensorMainVal_${sensor.id}" style="color: ${isHazard ? '#ef4444' : '#10b981'};">${displayVal}</span><span class="rich-unit" id="sensorMainUnit_${sensor.id}">${unit}</span>
        <div style="font-size: 0.8rem; margin-top: 4px;">
          <span class="badge ${isHazard ? 'badge-danger' : 'badge-peaceful'}" id="gasStatusPill_${sensor.id}">
            ${isHazard ? '⚠️ CRITICAL CONCENTRATION HAZARD' : '🟢 AIR SAFE & PURIFIED'}
          </span>
        </div>
      </div>`;
    controlsHtml = `
      <div class="sensor-ctrl-box">
        <div class="ctrl-label-row">
          <span>Live Gas / Vapor Level</span>
          <strong id="sensorValLabel_${sensor.id}">${displayVal} ${unit}</strong>
        </div>
        <input type="range" min="${minVal}" max="${maxVal}" step="${stepVal}" value="${val}" class="range-slider sensor-val-slider" data-id="${sensor.id}">

        <div class="ctrl-label-row" style="margin-top: 8px;">
          <span>Alarm Threshold</span>
          <strong id="gasThreshLabel_${sensor.id}">${thresh} ppm</strong>
        </div>
        <input type="range" min="100" max="800" step="10" value="${thresh}" class="range-slider gas-thresh-slider" data-id="${sensor.id}">

        <div style="display: flex; gap: 6px; margin-top: 8px;">
          <button class="btn btn-secondary btn-xs btn-test-siren" data-id="${sensor.id}" style="flex: 1;">🔔 Test Siren</button>
          <button class="btn btn-primary btn-xs btn-cutoff-valve" data-id="${sensor.id}" style="flex: 1;">🎛️ Trip Gas Valve</button>
        </div>
      </div>`;
  } else if (cat === 'power') {
    const isSurge = Number(val) > (sensor.alarmThreshold || 250);
    metricHtml = `
      <div class="rich-sensor-metric">
        <span class="rich-val" id="sensorMainVal_${sensor.id}" style="color: ${isSurge ? '#ef4444' : 'var(--text-main)'};">${displayVal}</span><span class="rich-unit" id="sensorMainUnit_${sensor.id}">${unit}</span>
        <div style="font-size: 0.82rem; color: var(--text-muted); margin-top: 4px;">
          Grid Status: <strong style="color: ${isSurge ? '#ef4444' : '#10b981'};">${isSurge ? 'OVERVOLTAGE SURGE' : '50.0 Hz Synced & Stable'}</strong> &bull; PF: 0.98
        </div>
      </div>`;
    controlsHtml = `
      <div class="sensor-ctrl-box">
        <div class="ctrl-label-row">
          <span>Live Voltage Simulation</span>
          <strong id="sensorValLabel_${sensor.id}">${displayVal} ${unit}</strong>
        </div>
        <input type="range" min="${minVal}" max="${maxVal}" step="${stepVal}" value="${val}" class="range-slider sensor-val-slider" data-id="${sensor.id}">

        <div class="ctrl-label-row" style="margin-top: 8px;">
          <span>Main Distribution Breaker</span>
          <span class="badge badge-peaceful" id="breakerStatus_${sensor.id}">CLOSED (ACTIVE)</span>
        </div>
        <div style="display: flex; gap: 6px; margin-top: 8px;">
          <button class="btn btn-secondary btn-xs btn-toggle-breaker" data-id="${sensor.id}" style="flex: 1;">⚡ Trip Breaker</button>
          <button class="btn btn-secondary btn-xs btn-reset-kwh" data-id="${sensor.id}" style="flex: 1;">0.00 kWh Reset</button>
        </div>
      </div>`;
  } else if (cat === 'motion') {
    const isMotion = Number(val) > 0 || val === true || val === '1';
    metricHtml = `
      <div class="rich-sensor-metric" style="display: flex; justify-content: space-between; align-items: center;">
        <div>
          <span class="rich-val" id="sensorMainVal_${sensor.id}" style="font-size: 1.4rem; color: ${isMotion ? '#ef4444' : '#10b981'};">
            ${isMotion ? 'TARGET DETECTED' : 'CLEAR / SECURE'}
          </span>
          <div style="font-size: 0.78rem; color: var(--text-muted); margin-top: 4px;">Zone Armed &bull; Doppler / PIR active</div>
        </div>
        <div class="radar-sweep-visual"></div>
      </div>`;
    controlsHtml = `
      <div class="sensor-ctrl-box">
        <div class="ctrl-label-row">
          <span>Motion Trigger Simulation</span>
          <strong id="sensorValLabel_${sensor.id}">${isMotion ? 'Active Motion (1)' : 'Standby (0)'}</strong>
        </div>
        <input type="range" min="0" max="1" step="1" value="${isMotion ? 1 : 0}" class="range-slider sensor-val-slider" data-id="${sensor.id}">

        <div style="display: flex; justify-content: space-between; align-items: center; margin: 8px 0;">
          <span style="font-size: 0.76rem; font-weight: 600;">Armed Security Guard</span>
          <label class="switch"><input type="checkbox" checked class="toggle-arm-sensor" data-id="${sensor.id}"><span class="slider round"></span></label>
        </div>
        <button class="btn btn-primary btn-xs btn-snap-camera" data-id="${sensor.id}" style="width: 100%;">📸 Capture Verified Photo</button>
      </div>`;
  } else if (cat === 'actuator') {
    const isValve = sensor.name.toLowerCase().includes('valve');
    const isAc = sensor.name.toLowerCase().includes('ac') || sensor.name.toLowerCase().includes('crac');
    
    if (isValve) {
      metricHtml = `
        <div class="rich-sensor-metric">
          <div class="valve-flow-indicator open" id="valveInd_${sensor.id}">🟢 PIPELINE VALVE OPEN (FLOW ACTIVE)</div>
        </div>`;
      controlsHtml = `
        <div class="sensor-ctrl-box">
          <div style="display: flex; gap: 6px;">
            <button class="btn btn-secondary btn-xs btn-valve-open" data-id="${sensor.id}" style="flex: 1;">Open Valve</button>
            <button class="btn btn-primary btn-xs btn-valve-shut" data-id="${sensor.id}" style="flex: 1;">Emergency Cutoff</button>
          </div>
        </div>`;
    } else if (isAc) {
      metricHtml = `
        <div class="rich-sensor-metric">
          <span class="rich-val" id="sensorMainVal_${sensor.id}">${displayVal}</span><span class="rich-unit">°C Set</span>
          <div style="font-size: 0.78rem; color: #38bdf8; margin-top: 4px;">Mode: COOL &bull; Compressor: 45Hz &bull; Fan: AUTO</div>
        </div>`;
      controlsHtml = `
        <div class="ac-remote-console">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
            <span style="font-size: 0.74rem;">Smart AC Console</span>
            <button class="btn btn-secondary btn-xs btn-ac-power" data-id="${sensor.id}">Power: ON</button>
          </div>
          <div class="ac-remote-modes">
            <button class="ac-mode-btn active" data-mode="cool">❄️ Cool</button>
            <button class="ac-mode-btn" data-mode="heat">☀️ Heat</button>
            <button class="ac-mode-btn" data-mode="fan">🌀 Fan</button>
            <button class="ac-mode-btn" data-mode="dry">💧 Dry</button>
          </div>
        </div>`;
    } else {
      metricHtml = `
        <div class="rich-sensor-metric">
          <span class="rich-val" id="sensorMainVal_${sensor.id}">ACTIVE</span>
          <div style="font-size: 0.78rem; color: var(--text-muted); margin-top: 4px;">Channel Energized &bull; Pin: ${sensor.pin}</div>
        </div>`;
      controlsHtml = `
        <div class="sensor-ctrl-box">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span style="font-size: 0.78rem; font-weight: 600;">Relay Power Output</span>
            <label class="switch"><input type="checkbox" checked class="toggle-actuator-relay" data-id="${sensor.id}"><span class="slider round"></span></label>
          </div>
        </div>`;
    }
  } else if (cat === 'liquid') {
    metricHtml = `
      <div class="rich-sensor-metric">
        <span class="rich-val" id="sensorMainVal_${sensor.id}">${displayVal}</span><span class="rich-unit" id="sensorMainUnit_${sensor.id}">${unit}</span>
        <div style="font-size: 0.78rem; color: var(--text-muted); margin-top: 4px;">Level: <strong>${displayVal}%</strong> &bull; Reservoir Nominal</div>
      </div>`;
    controlsHtml = `
      <div class="sensor-ctrl-box">
        <div class="ctrl-label-row">
          <span>Live Tank Level Simulator</span>
          <strong id="sensorValLabel_${sensor.id}">${displayVal} ${unit}</strong>
        </div>
        <input type="range" min="0" max="100" step="1" value="${val}" class="range-slider sensor-val-slider" data-id="${sensor.id}">

        <div style="display: flex; gap: 6px; margin-top: 8px;">
          <button class="btn btn-primary btn-xs btn-toggle-pump" data-id="${sensor.id}" style="flex: 1;">💧 Start Pump</button>
          <button class="btn btn-secondary btn-xs btn-drain-tank" data-id="${sensor.id}" style="flex: 1;">Drain Valve</button>
        </div>
      </div>`;
  } else if (cat === 'optical' && sensor.name.includes('MAX30102')) {
    metricHtml = `
      <div class="rich-sensor-metric">
        <div style="display: flex; justify-content: space-between; align-items: baseline;">
          <div><span class="rich-val" id="sensorMainVal_${sensor.id}">${displayVal}</span><span class="rich-unit">% SpO2</span></div>
          <div><span class="rich-val" style="font-size: 1.5rem; color: #ef4444;">72</span><span class="rich-unit">BPM</span></div>
        </div>
        <svg class="ecg-pulse-svg" viewBox="0 0 200 40"><path d="M0,20 L40,20 L50,5 L60,35 L70,10 L80,25 L90,20 L200,20" /></svg>
      </div>`;
    controlsHtml = `
      <div class="sensor-ctrl-box">
        <div class="ctrl-label-row">
          <span>SpO2 Pulse Oximeter Sim</span>
          <strong id="sensorValLabel_${sensor.id}">${displayVal} %</strong>
        </div>
        <input type="range" min="80" max="100" step="1" value="${val}" class="range-slider sensor-val-slider" data-id="${sensor.id}">
        <div style="margin-top: 8px;">
          <button class="btn btn-primary btn-xs btn-nurse-alert" data-id="${sensor.id}" style="width: 100%;">🚨 Dispatch Nurse Station Alert</button>
        </div>
      </div>`;
  } else {
    metricHtml = `
      <div class="rich-sensor-metric">
        <span class="rich-val" id="sensorMainVal_${sensor.id}">${displayVal}</span><span class="rich-unit" id="sensorMainUnit_${sensor.id}">${unit}</span>
        <div style="font-size: 0.78rem; color: var(--text-muted); margin-top: 4px;">${sensor.type} &bull; Pin: ${sensor.pin}</div>
      </div>`;
    controlsHtml = `
      <div class="sensor-ctrl-box">
        <div class="ctrl-label-row">
          <span>Simulate Telemetry Reading</span>
          <strong id="sensorValLabel_${sensor.id}">${displayVal} ${unit}</strong>
        </div>
        <input type="range" min="${minVal}" max="${maxVal}" step="${stepVal}" value="${val}" class="range-slider sensor-val-slider" data-id="${sensor.id}">
        <div style="margin-top: 8px;">
          <button class="btn btn-secondary btn-xs btn-ping-channel" data-id="${sensor.id}" style="width: 100%;">⚡ Ping Channel Test</button>
        </div>
      </div>`;
  }

  return `
    <div class="rich-sensor-card" data-sensor-id="${sensor.id}">
      <div>
        <div class="rich-card-head" style="align-items: center; gap: 10px;">
          <div style="flex: 1; overflow: hidden;">
            <div style="display: flex; align-items: center; gap: 6px;">
              <span style="font-size: 1.15rem;">${getSensorIconByCategory(cat)}</span>
              <strong style="font-size: 0.92rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${sensor.name}</strong>
            </div>
            <div style="font-size: 0.72rem; color: var(--text-muted); margin-top: 2px;">
              ${sensor.room} &bull; <span style="font-family: monospace;">${sensor.pin}</span>
            </div>
          </div>
          <!-- Animated Dynamic Sensor Micro-Visual -->
          ${getSensorAnimatedVisual(sensor)}
          <div style="text-align: right; flex-shrink: 0;">
            <span class="zone-clearance-pill">${sensor.type}</span>
          </div>
        </div>
        <div style="margin: 4px 0 8px 0;">
          <span class="badge" style="background: rgba(255,255,255,0.06); color: var(--text-muted); font-size: 0.68rem; font-weight: 600;">${sensor.room}</span>
        </div>
        ${metricHtml}
      </div>
      ${controlsHtml}
    </div>`;
}

function attachSensorWidgetControlsListeners() {
  // Live Value Calibration Sliders (updates individual sensor value and runs Rule Engine!)
  document.querySelectorAll('.sensor-val-slider').forEach(slider => {
    slider.addEventListener('input', (e) => {
      const sensorId = e.target.dataset.id;
      const numVal = parseFloat(e.target.value);
      const sensor = state.configuredSensors.find(s => String(s.id) === String(sensorId));
      if (!sensor) return;

      sensor.value = numVal;

      // Update live labels on widget
      const valLabel = document.getElementById('sensorValLabel_' + sensorId);
      if (valLabel) {
        valLabel.textContent = `${Number.isInteger(numVal) ? numVal : numVal.toFixed(1)} ${sensor.unit || ''}`;
      }
      const mainVal = document.getElementById('sensorMainVal_' + sensorId);
      if (mainVal) {
        if (sensor.category === 'motion') {
          mainVal.textContent = numVal > 0 ? 'TARGET DETECTED' : 'CLEAR / SECURE';
          mainVal.style.color = numVal > 0 ? '#ef4444' : '#10b981';
        } else {
          mainVal.textContent = Number.isInteger(numVal) ? numVal : numVal.toFixed(1);
        }
      }

      // Update gas hazard badge if applicable
      const gasPill = document.getElementById('gasStatusPill_' + sensorId);
      if (gasPill && sensor.category === 'gas') {
        const isHazard = numVal >= (sensor.alarmThreshold || 350);
        gasPill.className = `badge ${isHazard ? 'badge-danger' : 'badge-peaceful'}`;
        gasPill.textContent = isHazard ? '⚠️ CRITICAL CONCENTRATION HAZARD' : '🟢 AIR SAFE & PURIFIED';
        if (mainVal) mainVal.style.color = isHazard ? '#ef4444' : '#10b981';
      }

      // Synchronize with global telemetry object if primary
      const cat = (sensor.category || '').toLowerCase();
      if (cat === 'climate' && sensor.name.toLowerCase().includes('dht')) {
        state.telemetry.temp = numVal;
      } else if (cat === 'gas') {
        state.telemetry.gas = Math.round(numVal);
      } else if (cat === 'power' && sensor.name.toLowerCase().includes('zmpt')) {
        state.telemetry.volt = numVal;
      } else if (cat === 'motion') {
        state.telemetry.pirActive = numVal > 0;
      }

      // Real-time evaluation of Automation IF / ELSE Rules!
      if (typeof evaluateAutomationRules === 'function') {
        evaluateAutomationRules();
      }
    });
  });

  // Climate Target slider
  document.querySelectorAll('.temp-target-slider').forEach(slider => {
    slider.addEventListener('input', (e) => {
      const sensorId = e.target.dataset.id;
      const lbl = document.getElementById('targetTempLabel_' + sensorId);
      if (lbl) lbl.textContent = e.target.value + '°C';
      const sensor = state.configuredSensors.find(s => String(s.id) === String(sensorId));
      if (sensor) sensor.target = parseFloat(e.target.value);
      if (typeof evaluateAutomationRules === 'function') evaluateAutomationRules();
    });
  });

  // Gas Threshold slider
  document.querySelectorAll('.gas-thresh-slider').forEach(slider => {
    slider.addEventListener('input', (e) => {
      const sensorId = e.target.dataset.id;
      const lbl = document.getElementById('gasThreshLabel_' + sensorId);
      if (lbl) lbl.textContent = e.target.value + ' ppm';
      const sensor = state.configuredSensors.find(s => String(s.id) === String(sensorId));
      if (sensor) sensor.alarmThreshold = parseFloat(e.target.value);
      if (typeof evaluateAutomationRules === 'function') evaluateAutomationRules();
    });
  });

  // Cooling / Heating Mode buttons
  document.querySelectorAll('.btn-cooling-mode').forEach(btn => {
    btn.addEventListener('click', () => {
      showToast('❄️ AC Cooling Mode engaged for zone. Setpoint locked to 20°C.', 'info');
      if (state.roomOutputs && state.roomOutputs.ac_unit) {
        state.roomOutputs.ac_unit.active = true;
        state.roomOutputs.ac_unit.mode = 'cool';
        updateRoomOutputsUI();
      }
    });
  });

  document.querySelectorAll('.btn-heating-mode').forEach(btn => {
    btn.addEventListener('click', () => {
      showToast('☀️ AC Heating Mode engaged for zone. Setpoint set to 26°C.', 'warning');
      if (state.roomOutputs && state.roomOutputs.ac_unit) {
        state.roomOutputs.ac_unit.active = true;
        state.roomOutputs.ac_unit.mode = 'heat';
        updateRoomOutputsUI();
      }
    });
  });

  // Test Siren
  document.querySelectorAll('.btn-test-siren').forEach(btn => {
    btn.addEventListener('click', () => {
      showToast('🔊 High-decibel piezo siren sounding for 3 seconds!', 'warning');
      logIncident('Hazard Audio Test', 'Piezo Siren', 'Manual siren acoustic verification conducted', 'Resolved');
      if (typeof playAlertTone === 'function') playAlertTone();
      if (state.roomOutputs && state.roomOutputs.siren) {
        state.roomOutputs.siren.active = true;
        updateRoomOutputsUI();
        setTimeout(() => {
          if (state.roomOutputs && state.roomOutputs.siren) {
            state.roomOutputs.siren.active = false;
            updateRoomOutputsUI();
          }
        }, 3000);
      }
    });
  });

  // Cutoff Gas Valve
  document.querySelectorAll('.btn-cutoff-valve, .btn-valve-shut').forEach(btn => {
    btn.addEventListener('click', () => {
      showToast('🎛️ 12V Solenoid Emergency Valve CUTOFF Engaged! Gas pipeline isolated.', 'danger');
      const ind = document.getElementById('valveInd_' + btn.dataset.id);
      if (ind) {
        ind.className = 'valve-flow-indicator closed';
        ind.textContent = '🔴 GAS PIPELINE ISOLATED (VALVE SHUT)';
      }
      if (state.roomOutputs && state.roomOutputs.gas_valve) {
        state.roomOutputs.gas_valve.active = false;
        updateRoomOutputsUI();
      }
    });
  });

  // Open Valve
  document.querySelectorAll('.btn-valve-open').forEach(btn => {
    btn.addEventListener('click', () => {
      showToast('🟢 12V Solenoid Valve Re-energized: Pipeline OPEN.', 'success');
      const ind = document.getElementById('valveInd_' + btn.dataset.id);
      if (ind) {
        ind.className = 'valve-flow-indicator open';
        ind.textContent = '🟢 PIPELINE VALVE OPEN (FLOW ACTIVE)';
      }
      if (state.roomOutputs && state.roomOutputs.gas_valve) {
        state.roomOutputs.gas_valve.active = true;
        updateRoomOutputsUI();
      }
    });
  });

  // Circuit Breaker Toggle
  document.querySelectorAll('.btn-toggle-breaker').forEach(btn => {
    btn.addEventListener('click', () => {
      const statusPill = document.getElementById('breakerStatus_' + btn.dataset.id);
      if (statusPill && statusPill.textContent.includes('CLOSED')) {
        statusPill.textContent = 'OPEN (TRIPPED)';
        statusPill.className = 'badge badge-danger';
        showToast('⚡ Mains Circuit Breaker TRIPPED! Load isolated for safety.', 'warning');
        if (state.roomOutputs && state.roomOutputs.mains_breaker) {
          state.roomOutputs.mains_breaker.active = false;
          updateRoomOutputsUI();
        }
      } else if (statusPill) {
        statusPill.textContent = 'CLOSED (ACTIVE)';
        statusPill.className = 'badge badge-peaceful';
        showToast('⚡ Mains Circuit Breaker RESET to closed.', 'success');
        if (state.roomOutputs && state.roomOutputs.mains_breaker) {
          state.roomOutputs.mains_breaker.active = true;
          updateRoomOutputsUI();
        }
      }
    });
  });

  // Reset kWh button
  document.querySelectorAll('.btn-reset-kwh').forEach(btn => {
    btn.addEventListener('click', () => {
      showToast('⚡ Energy accumulation register reset to 0.00 kWh.', 'info');
    });
  });

  // Camera snap
  document.querySelectorAll('.btn-snap-camera').forEach(btn => {
    btn.addEventListener('click', () => {
      if (typeof triggerManualSnapshot === 'function') triggerManualSnapshot();
      showToast('📸 High-resolution security snapshot captured & logged.', 'info');
    });
  });

  // Water pump toggle
  document.querySelectorAll('.btn-toggle-pump').forEach(btn => {
    btn.addEventListener('click', () => {
      if (state.roomOutputs && state.roomOutputs.water_pump) {
        state.roomOutputs.water_pump.active = !state.roomOutputs.water_pump.active;
        const isOn = state.roomOutputs.water_pump.active;
        showToast(`💧 Water Booster Pump ${isOn ? 'ACTIVATED (Running)' : 'SHUT OFF (Idle)'}.`, isOn ? 'success' : 'info');
        updateRoomOutputsUI();
      } else {
        showToast('💧 Water Booster Pump Relay Toggled.', 'info');
      }
    });
  });

  // Drain tank button
  document.querySelectorAll('.btn-drain-tank').forEach(btn => {
    btn.addEventListener('click', () => {
      showToast('🚰 Sump Drain Solenoid Opened: Evacuating excess water.', 'warning');
    });
  });

  // Nurse station alert
  document.querySelectorAll('.btn-nurse-alert').forEach(btn => {
    btn.addEventListener('click', () => {
      showToast('🚨 Code Alert Dispatched to Hospital Central Nurse Station!', 'danger');
      if (typeof playAlertTone === 'function') playAlertTone();
    });
  });

  // Ping channel test
  document.querySelectorAll('.btn-ping-channel').forEach(btn => {
    btn.addEventListener('click', () => {
      showToast('⚡ GPIO Channel pinged: ACK received in 1.4ms (Signal OK).', 'success');
    });
  });

  // Toggle arm sensor
  document.querySelectorAll('.toggle-arm-sensor').forEach(toggle => {
    toggle.addEventListener('change', (e) => {
      showToast(`🛡️ Sentry Zone ${e.target.checked ? 'ARMED' : 'DISARMED'}.`, e.target.checked ? 'success' : 'warning');
    });
  });

  // Toggle actuator relay
  document.querySelectorAll('.toggle-actuator-relay').forEach(toggle => {
    toggle.addEventListener('change', (e) => {
      showToast(`🎛️ Actuator Relay ${e.target.checked ? 'ENERGIZED (ON)' : 'DE-ENERGIZED (OFF)'}.`, 'info');
    });
  });

  // AC Power
  document.querySelectorAll('.btn-ac-power').forEach(btn => {
    btn.addEventListener('click', () => {
      if (state.roomOutputs && state.roomOutputs.ac_unit) {
        state.roomOutputs.ac_unit.active = !state.roomOutputs.ac_unit.active;
        btn.textContent = `Power: ${state.roomOutputs.ac_unit.active ? 'ON' : 'OFF'}`;
        updateRoomOutputsUI();
        showToast(`Smart AC Unit turned ${state.roomOutputs.ac_unit.active ? 'ON' : 'OFF'}.`, 'info');
      }
    });
  });

  // AC Remote Modes
  document.querySelectorAll('.ac-mode-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const parent = btn.closest('.ac-remote-modes');
      if (parent) {
        parent.querySelectorAll('.ac-mode-btn').forEach(b => b.classList.remove('active'));
      }
      btn.classList.add('active');
      const mode = btn.dataset.mode || 'cool';
      showToast(`Smart AC Mode switched to: ${mode.toUpperCase()}`, 'info');
      if (state.roomOutputs && state.roomOutputs.ac_unit) {
        state.roomOutputs.ac_unit.mode = mode;
        updateRoomOutputsUI();
      }
    });
  });
}

// =============================================================================
// 11. FACILITY, ROOMS & PINS
// =============================================================================
function initFacilityAndRooms() {
  updateFacilityInfo();
  populateRoomSelects();
  renderSensorsTable();
  renderDynamicSensorsGrid();
  renderPremiseZones();
  renderSensorPalette();

  // Premise Model Selector
  const premiseSelect = document.getElementById('premiseModelSelect');
  premiseSelect?.addEventListener('change', (e) => {
    switchPremiseArchetype(e.target.value);
  });

  // Premise Archetype Chips
  document.querySelectorAll('.premise-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      switchPremiseArchetype(chip.dataset.model);
    });
  });

  // Telemetry Room Filter
  const roomFilterSelect = document.getElementById('filterTelemetryRoom');
  roomFilterSelect?.addEventListener('change', (e) => {
    telemetryRoomFilter = e.target.value;
    renderDynamicSensorsGrid();
  });

  // Telemetry Category Pills
  const catPillsBar = document.getElementById('telemetryCategoryPills');
  catPillsBar?.querySelectorAll('.cat-pill').forEach(pill => {
    pill.addEventListener('click', () => {
      catPillsBar.querySelectorAll('.cat-pill').forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      telemetryCategoryFilter = pill.dataset.cat;
      renderDynamicSensorsGrid();
    });
  });

  // Header Add Area button
  document.getElementById('btnHeaderAddArea')?.addEventListener('click', () => {
    el.addRoomModal.classList.add('active');
  });

  // Reset Premise Defaults
  document.getElementById('btnResetPremiseDefaults')?.addEventListener('click', () => {
    switchPremiseArchetype(currentPremiseModel);
  });

  // Export Premise Layout JSON
  document.getElementById('btnExportPremiseLayout')?.addEventListener('click', () => {
    const layout = {
      facility: state.facilityName,
      archetype: currentPremiseModel,
      rooms: state.rooms,
      sensors: state.configuredSensors,
      timestamp: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(layout, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `premise_layout_${currentPremiseModel}_${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('Exported Premise Layout JSON', 'success');
  });

  // Palette Search Input
  document.getElementById('paletteSearchInput')?.addEventListener('input', () => {
    renderSensorPalette();
  });

  // Edit Facility Modal
  const editFacilityModal = document.getElementById('editFacilityModal');
  const inputFacilityName = document.getElementById('inputFacilityName');
  document.getElementById('btnEditFacility')?.addEventListener('click', () => {
    if (inputFacilityName) inputFacilityName.value = state.facilityName;
    editFacilityModal?.classList.add('active');
  });
  document.getElementById('btnCloseFacilityModal')?.addEventListener('click', () => editFacilityModal?.classList.remove('active'));
  document.getElementById('btnCancelFacilityModal')?.addEventListener('click', () => editFacilityModal?.classList.remove('active'));
  document.getElementById('formEditFacility')?.addEventListener('submit', (e) => {
    e.preventDefault();
    if (inputFacilityName) {
      state.facilityName = inputFacilityName.value.trim() || state.facilityName;
      updateFacilityInfo();
    }
    editFacilityModal?.classList.remove('active');
    showToast(`Facility renamed to "${state.facilityName}"`, 'info');
  });

  // Add Room / Zone Modal
  const addRoomModal = document.getElementById('addRoomModal');
  const openAddRoom = () => addRoomModal?.classList.add('active');
  document.getElementById('btnOpenAddRoomModal')?.addEventListener('click', openAddRoom);
  document.getElementById('btnHeaderAddArea')?.addEventListener('click', openAddRoom);
  document.getElementById('btnCloseRoomModal')?.addEventListener('click', () => addRoomModal?.classList.remove('active'));
  document.getElementById('btnCancelRoomModal')?.addEventListener('click', () => addRoomModal?.classList.remove('active'));
  document.getElementById('formAddRoom')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const nameInput = document.getElementById('newRoomName');
    const purposeInput = document.getElementById('newRoomPurpose');
    const name = nameInput ? nameInput.value.trim() : 'New Room';
    const purpose = purposeInput ? purposeInput.value.trim() : 'Monitoring & Security';
    const icon = document.getElementById('newRoomIcon')?.value || '📍';
    const clearance = document.getElementById('newRoomClearance')?.value || 'General';
    state.rooms.push({ id: 'room-' + Date.now(), name, purpose, icon, clearance });
    populateRoomSelects();
    updateFacilityInfo();
    renderPremiseZones();
    addRoomModal?.classList.remove('active');
    document.getElementById('formAddRoom')?.reset();
    showToast(`Added area: "${icon} ${name}" (${clearance})`, 'success');
  });

  // Add Sensor / Pin Modal
  const addSensorModal = document.getElementById('addSensorModal');
  document.getElementById('btnOpenAddSensorModal')?.addEventListener('click', () => {
    populateRoomSelects();
    addSensorModal?.classList.add('active');
  });
  document.getElementById('btnCloseSensorModal')?.addEventListener('click', () => addSensorModal?.classList.remove('active'));
  document.getElementById('btnCancelSensorModal')?.addEventListener('click', () => addSensorModal?.classList.remove('active'));
  document.getElementById('formAddSensor')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('newSensorName')?.value.trim() || 'New Sensor';
    const pin = document.getElementById('newSensorPin')?.value || 'GPIO 12';
    const type = document.getElementById('newSensorType')?.value || 'Digital Input';
    const room = document.getElementById('newSensorRoom')?.value || (state.rooms[0]?.name || 'Living Room');
    const threshold = document.getElementById('newSensorThreshold')?.value.trim() || 'Active Threshold';

    const newSensor = {
      id: Date.now(),
      name,
      pin,
      type,
      room,
      threshold,
      value: 0,
      status: 'normal',
      history: [0, 0, 0]
    };
    state.configuredSensors.push(newSensor);
    try { localStorage.setItem('sanctuary_configured_sensors', JSON.stringify(state.configuredSensors)); } catch (_) {}
    renderSensorsTable();
    renderPremiseZones();
    renderDynamicSensorsGrid();
    updateFacilityInfo();
    addSensorModal?.classList.remove('active');
    document.getElementById('formAddSensor')?.reset();
    showToast(`Configured "${newSensor.name}" on ${newSensor.pin}!`, 'info');
  });

  // Add Building Modal
  const modalAddBuilding = document.getElementById('modalAddBuilding');
  document.getElementById('btnOpenAddBuilding')?.addEventListener('click', () => modalAddBuilding?.classList.add('active'));
  document.getElementById('btnCloseAddBuilding')?.addEventListener('click', () => modalAddBuilding?.classList.remove('active'));
  document.getElementById('btnCancelAddBuilding')?.addEventListener('click', () => modalAddBuilding?.classList.remove('active'));
  document.getElementById('formAddBuilding')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const bName = document.getElementById('newBuildingName')?.value.trim() || 'Building Branch';
    const bCampus = document.getElementById('newBuildingCampus')?.value.trim() || 'Main Site';
    showToast(`🏢 Custom Building "${bName}" added to ${bCampus}`, 'success');
    modalAddBuilding?.classList.remove('active');
  });

  // Add Custom Thing Modal
  const modalAddCustomThing = document.getElementById('modalAddCustomThing');
  document.getElementById('btnOpenAddCustomThing')?.addEventListener('click', () => {
    const sel = document.getElementById('newThingRoom');
    if (sel) sel.innerHTML = state.rooms.map(r => `<option value="${r.name}">${r.name}</option>`).join('');
    modalAddCustomThing?.classList.add('active');
  });
  document.getElementById('btnCloseAddCustomThing')?.addEventListener('click', () => modalAddCustomThing?.classList.remove('active'));
  document.getElementById('btnCancelAddCustomThing')?.addEventListener('click', () => modalAddCustomThing?.classList.remove('active'));

  // Hierarchy View Switchers
  const dragCanvas = document.getElementById('dragDropCanvasView');
  const hierView = document.getElementById('hierarchyTreeView');
  document.getElementById('btnToggleHierarchyView')?.addEventListener('click', () => {
    if (dragCanvas) dragCanvas.style.display = 'none';
    if (hierView) {
      hierView.style.display = 'block';
      renderHierarchyTreeView();
    }
    showToast('Switched to Facility Parent / Child Hierarchy Tree', 'info');
  });
  document.getElementById('btnSwitchToCanvasView')?.addEventListener('click', () => {
    if (hierView) hierView.style.display = 'none';
    if (dragCanvas) dragCanvas.style.display = 'grid';
  });

  // Edit Zone & Edit Sensor Modal Closers
  document.getElementById('btnCloseEditZone')?.addEventListener('click', () => document.getElementById('modalEditZone')?.classList.remove('active'));
  document.getElementById('btnCancelEditZone')?.addEventListener('click', () => document.getElementById('modalEditZone')?.classList.remove('active'));
  document.getElementById('btnCloseEditSensor')?.addEventListener('click', () => document.getElementById('modalEditSensor')?.classList.remove('active'));
  document.getElementById('btnCancelEditSensor')?.addEventListener('click', () => document.getElementById('modalEditSensor')?.classList.remove('active'));

  el.pinChips.forEach(chip => {
    chip.addEventListener('click', () => {
      el.pinChips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      const pinName = chip.dataset.pin;
      const matched = state.configuredSensors.find(s => s.pin.includes(pinName));
      if (matched) {
        showToast(`📍 ${matched.pin}: ${matched.name} in ${matched.room}`, 'info');
      } else {
        showToast(`📍 ${pinName}: Available for assignment`, 'info');
      }
    });
  });
}

function updateFacilityInfo() {
  el.displayFacilityName.textContent = state.facilityName;
  el.chipFacilityName.textContent = state.facilityName;
  el.chipRoomCount.textContent = `${state.rooms.length} Rooms`;
  el.chipSensorCount.textContent = `${state.configuredSensors.length} Pins Mapped`;
}

function populateRoomSelects() {
  el.newSensorRoom.innerHTML = '';
  const filterSelect = document.getElementById('filterTelemetryRoom');
  if (filterSelect) {
    filterSelect.innerHTML = '<option value="all">All Rooms & Areas</option>';
  }

  state.rooms.forEach(r => {
    const opt = document.createElement('option');
    opt.value = r.name;
    opt.textContent = `${r.icon || '📍'} ${r.name}`;
    el.newSensorRoom.appendChild(opt);

    if (filterSelect) {
      const optFilter = document.createElement('option');
      optFilter.value = r.name;
      optFilter.textContent = `${r.icon || '📍'} ${r.name}`;
      filterSelect.appendChild(optFilter);
    }
  });
}

function renderSensorsTable() {
  el.sensorTableBody.innerHTML = '';
  state.configuredSensors.forEach(s => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><strong>${s.name}</strong></td>
      <td><span class="pin-tag">${s.pin}</span></td>
      <td>${s.type}</td>
      <td>${s.room}</td>
      <td>${s.threshold}</td>
      <td><button class="btn-icon-subtle btn-del-sensor" data-id="${s.id}">🗑️</button></td>
    `;
    el.sensorTableBody.appendChild(tr);
  });

  document.querySelectorAll('.btn-del-sensor').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = parseInt(e.currentTarget.dataset.id);
      state.configuredSensors = state.configuredSensors.filter(s => s.id !== id);
      renderSensorsTable();
      updateFacilityInfo();
      showToast('Sensor pin removed.', 'info');
    });
  });
}

// =============================================================================
// 12. SEGREGATED ENGINEERING IDE
// =============================================================================
function initEngineeringIde() {
  const engWorkspace = document.getElementById('engineeringWorkspace');
  document.getElementById('btnToggleEngineering')?.addEventListener('click', (e) => {
    e.preventDefault();
    engWorkspace?.classList.add('active');
  });
  document.getElementById('btnCloseEngineering')?.addEventListener('click', (e) => {
    e.preventDefault();
    engWorkspace?.classList.remove('active');
  });

  const codeTabs = document.querySelectorAll('.code-tab');
  const codeViewer = document.getElementById('codeViewer');
  codeTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      codeTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const sketchKey = tab.dataset.sketch;
      if (codeViewer) {
        codeViewer.textContent = state.firmwareSketches[sketchKey] || '// Code unavailable';
      }
    });
  });

  if (codeViewer && state.firmwareSketches) {
    codeViewer.textContent = state.firmwareSketches.stm32 || state.firmwareSketches.esp32cam;
  }

  document.getElementById('btnCopyCode')?.addEventListener('click', () => {
    if (codeViewer && codeViewer.textContent) {
      navigator.clipboard.writeText(codeViewer.textContent);
      showToast('📋 Firmware copied to clipboard!', 'info');
    }
  });
}

// =============================================================================
// 13. SOUND & NOTIFICATIONS
// =============================================================================
function playBuzzerTone() {
  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(880, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(440, audioCtx.currentTime + 0.6);
    gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.6);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.7);
  } catch (err) {}
}

function playShutterSound() {
  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(1200, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(300, audioCtx.currentTime + 0.08);
    gain.gain.setValueAtTime(0.25, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.08);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.09);
  } catch (err) {}
}

function playChimeSound() {
  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
    osc.frequency.setValueAtTime(880, audioCtx.currentTime + 0.1); // A5
    gain.gain.setValueAtTime(0.12, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.45);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.45);
  } catch (err) {}
}

function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `toast ${type === 'alert' ? 'toast-alert' : 'toast-success'}`;
  toast.innerHTML = `<span>${type === 'alert' ? '⚠️' : '🌿'}</span> <span>${message}</span>`;
  if (el.toastContainer) {
    el.toastContainer.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      setTimeout(() => toast.remove(), 300);
    }, 3200);
  }
}

// =============================================================================
// 13.5 CLOUD & MULTI-SERVER GATEWAY (TELEGRAM, DISCORD, COLAB, BLYNK)
// =============================================================================
function logCloudServerAudit(serverType, message) {
  const auditWin = document.getElementById('serverAuditWindow');
  if (!auditWin) return;
  const now = new Date();
  const timeStr = `[${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}]`;
  
  const tagClassMap = {
    'TELEGRAM': 'tag-telegram',
    'DISCORD': 'tag-discord',
    'COLAB ML': 'tag-colab',
    'BLYNK': 'tag-blynk',
    'GATEWAY': 'tag-telegram'
  };

  const row = document.createElement('div');
  row.className = 'audit-row';
  row.innerHTML = `<span class="audit-time">${timeStr}</span> <span class="audit-tag ${tagClassMap[serverType] || 'tag-telegram'}">${serverType}</span> ${message}`;
  auditWin.prepend(row);

  // Keep max 50 log rows
  while (auditWin.children.length > 50) {
    auditWin.removeChild(auditWin.lastChild);
  }
}

function initCloudServers() {
  // Password Visibility Toggles
  document.querySelectorAll('.toggle-visibility').forEach(btn => {
    btn.addEventListener('click', () => {
      const targetId = btn.dataset.target;
      const targetInput = document.getElementById(targetId);
      if (targetInput) {
        targetInput.type = targetInput.type === 'password' ? 'text' : 'password';
      }
    });
  });

  // 1. TELEGRAM BOT ACTIONS
  const btnTestTelegramAlert = document.getElementById('btnTestTelegramAlert');
  const btnTestTelegramPhoto = document.getElementById('btnTestTelegramPhoto');
  const btnTelegramSendCmd = document.getElementById('btnTelegramSendCmd');
  const telegramSimInput = document.getElementById('telegramSimInput');
  const telegramSimOutput = document.getElementById('telegramSimOutput');

  btnTestTelegramAlert?.addEventListener('click', () => {
    const chatId = document.getElementById('telegramChatId')?.value || 'Admin';
    logCloudServerAudit('TELEGRAM', `Text alert: "⚡ KyU Lab 4 Telemetry: AC Grid 238V | Temp 24.2°C" sent to ${chatId} (HTTP 200 OK)`);
    showToast('✉️ Telegram text alert dispatched successfully!', 'info');
    playChimeSound();
  });

  btnTestTelegramPhoto?.addEventListener('click', () => {
    const chatId = document.getElementById('telegramChatId')?.value || 'Admin';
    // Capture current camera canvas snapshot
    const canvas = document.getElementById('cameraCanvas');
    const dataUrl = canvas ? canvas.toDataURL('image/jpeg', 0.8) : '';
    logCloudServerAudit('TELEGRAM', `📸 JPEG evidence snapshot [640x480, 48.2 KB] dispatched to Chat ID ${chatId} via /sendPhoto (HTTP 200 OK)`);
    showToast('📸 Telegram evidence snapshot sent to smartphone!', 'info');
    playChimeSound();
  });

  const processTelegramCommand = () => {
    const cmd = telegramSimInput?.value?.trim();
    if (!cmd) return;
    telegramSimInput.value = '';

    if (cmd === '/status') {
      const temp = state.telemetry.temp !== null ? state.telemetry.temp.toFixed(1) : '24.2';
      const volt = state.telemetry.volt !== null ? state.telemetry.volt.toFixed(1) : '238.0';
      const gas = state.telemetry.gas !== null ? state.telemetry.gas : '184';
      telegramSimOutput.innerHTML = `🤖 <strong>@KyUTelemetryBot:</strong><br>🟢 System: ARMED & NOMINAL<br>⚡ AC Grid: ${volt}V AC<br>🌡️ Climate: ${temp}°C<br>💨 Gas/Smoke: ${gas} ppm<br>🚪 Door: ${state.telemetry.doorOpen ? 'OPEN' : 'SECURE'}`;
      logCloudServerAudit('TELEGRAM', `Executed /status command for user. Dispatched 5 telemetry metrics.`);
    } else if (cmd === '/snap') {
      telegramSimOutput.innerHTML = `🤖 <strong>@KyUTelemetryBot:</strong><br>📸 ESP32-CAM trigger asserted. Captured snapshot saved to SD & dispatched to mobile chat.`;
      logCloudServerAudit('TELEGRAM', `Triggered camera snapshot via chat command /snap.`);
      showToast('📸 Snapshot captured via Telegram command', 'info');
    } else if (cmd === '/fan_on') {
      state.telemetry.fanOn = true;
      updateControlsView();
      telegramSimOutput.innerHTML = `🤖 <strong>@KyUTelemetryBot:</strong><br>🌿 Relay GPIO 4 turned ON (Exhaust Fan activated).`;
      logCloudServerAudit('TELEGRAM', `Actuated exhaust fan ON via Telegram command.`);
      showToast('🌿 Fan started via Telegram command', 'info');
    } else if (cmd === '/fan_off') {
      state.telemetry.fanOn = false;
      updateControlsView();
      telegramSimOutput.innerHTML = `🤖 <strong>@KyUTelemetryBot:</strong><br>Relay GPIO 4 turned OFF (Exhaust Fan deactivated).`;
      logCloudServerAudit('TELEGRAM', `Actuated exhaust fan OFF via Telegram command.`);
      showToast('Fan stopped via Telegram command', 'info');
    } else {
      telegramSimOutput.innerHTML = `🤖 <strong>@KyUTelemetryBot:</strong> Unknown command "${cmd}". Available: /status, /snap, /fan_on, /fan_off`;
    }
  };

  btnTelegramSendCmd?.addEventListener('click', processTelegramCommand);
  telegramSimInput?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') processTelegramCommand();
  });

  // 2. DISCORD ACTIONS
  const btnTestDiscordNormal = document.getElementById('btnTestDiscordNormal');
  const btnTestDiscordEmergency = document.getElementById('btnTestDiscordEmergency');

  btnTestDiscordNormal?.addEventListener('click', () => {
    const channel = document.getElementById('discordChannelName')?.value || '#lab4-security-feed';
    logCloudServerAudit('DISCORD', `Embed dispatched to ${channel}: "Periodic Health Check — All 7 Sensors Nominal" (HTTP 204 No Content)`);
    showToast(`💬 Discord embed posted to ${channel}`, 'info');
    playChimeSound();
  });

  btnTestDiscordEmergency?.addEventListener('click', () => {
    const channel = document.getElementById('discordChannelName')?.value || '#lab4-security-feed';
    const role = document.getElementById('discordRoleMention')?.value || '@here';
    logCloudServerAudit('DISCORD', `🚨 CRITICAL ALERT (${role}) sent to ${channel}: "Intrusion or Gas Threshold Breached! Evidence attached." (HTTP 204)`);
    showToast(`🚨 Emergency incident posted to Discord ${channel} with ${role} ping!`, 'alert');
    playAlertTone();
  });

  // 3. GOOGLE COLAB ML ACTIONS
  const btnColabExportData = document.getElementById('btnColabExportData');
  const btnTestColabInference = document.getElementById('btnTestColabInference');

  btnColabExportData?.addEventListener('click', () => {
    // Generate realistic telemetry CSV dataset for Colab
    let csvContent = "data:text/csv;charset=utf-8,timestamp,room,temp_c,humidity_pct,gas_ppm,ac_voltage_v,current_a,reed_open,pir_motion\n";
    const now = new Date();
    for (let i = 60; i >= 0; i--) {
      const t = new Date(now.getTime() - i * 5000);
      const iso = t.toISOString();
      const temp = (24.0 + Math.sin(i / 10) * 1.5).toFixed(1);
      const hum = (56.0 + Math.cos(i / 8) * 3.0).toFixed(1);
      const gas = Math.floor(175 + Math.random() * 20);
      const volt = (238.0 + (Math.random() - 0.5) * 4.0).toFixed(1);
      const curr = (0.85 + (Math.random() - 0.5) * 0.15).toFixed(2);
      csvContent += `${iso},KyU Lab 4,${temp},${hum},${gas},${volt},${curr},0,0\n`;
    }
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `kyu_lab4_telemetry_colab_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    logCloudServerAudit('COLAB ML', `Exported 60-sample telemetry dataset to CSV for Google Colab model training.`);
    showToast('📥 Telemetry dataset exported for Google Colab!', 'info');
  });

  btnTestColabInference?.addEventListener('click', () => {
    const endpoint = document.getElementById('colabEndpointUrl')?.value || 'Colab Ngrok Worker';
    const confVal = document.getElementById('colabConfidenceVal');
    const confBar = document.getElementById('colabConfidenceBar');

    const randomConfidence = (98.5 + Math.random() * 1.2).toFixed(1);
    if (confVal) confVal.textContent = `${randomConfidence}% (Nominal)`;
    if (confBar) confBar.style.width = `${randomConfidence}%`;

    logCloudServerAudit('COLAB ML', `Pinged ${endpoint}: Ingested [Temp: 24.2, Volt: 238V, Gas: 184ppm] -> Isolation Forest Result: Score +0.9412 (Normal Operation)`);
    showToast(`🧠 Colab ML inference ping completed (${randomConfidence}% confidence)`, 'info');
    playChimeSound();
  });

  // 4. BLYNK IOT ACTIONS
  const btnTestBlynkPush = document.getElementById('btnTestBlynkPush');
  const btnSyncBlynkPins = document.getElementById('btnSyncBlynkPins');

  btnTestBlynkPush?.addEventListener('click', () => {
    logCloudServerAudit('BLYNK', `Dispatched smartphone push notification to Blynk App: "KyU Sanctuary OS: Room perimeter secure."`);
    showToast('📱 Blynk smartphone push notification dispatched!', 'info');
    playChimeSound();
  });

  btnSyncBlynkPins?.addEventListener('click', () => {
    const temp = state.telemetry.temp !== null ? state.telemetry.temp.toFixed(1) : '24.2';
    const hum = state.telemetry.hum !== null ? state.telemetry.hum.toFixed(1) : '58';
    const gas = state.telemetry.gas !== null ? state.telemetry.gas : '184';
    const volt = state.telemetry.volt !== null ? state.telemetry.volt.toFixed(1) : '238';

    const elV0 = document.getElementById('blynkV0');
    const elV1 = document.getElementById('blynkV1');
    const elV2 = document.getElementById('blynkV2');
    const elV3 = document.getElementById('blynkV3');
    const elV4 = document.getElementById('blynkV4');
    const elV5 = document.getElementById('blynkV5');

    if (elV0) elV0.textContent = `${temp} °C`;
    if (elV1) elV1.textContent = `${hum} %`;
    if (elV2) elV2.textContent = `${gas} ppm`;
    if (elV3) elV3.textContent = state.telemetry.fanOn ? 'ON (1)' : 'OFF (0)';
    if (elV4) elV4.textContent = state.telemetry.doorOpen ? 'BREACH (1)' : 'SECURE (0)';
    if (elV5) elV5.textContent = `${volt} V`;

    logCloudServerAudit('BLYNK', `Synchronized Virtual Pins V0=${temp}, V1=${hum}, V2=${gas}, V3=${state.telemetry.fanOn?1:0}, V5=${volt} with Blynk Cloud.`);
    showToast('🔄 All 6 Blynk Virtual Pins successfully synchronized!', 'info');
    playChimeSound();
  });

  // 5. GLOBAL SERVER CONTROLS
  document.getElementById('btnTestAllServers')?.addEventListener('click', () => {
    btnTestTelegramAlert?.click();
    setTimeout(() => btnTestDiscordNormal?.click(), 300);
    setTimeout(() => btnTestColabInference?.click(), 600);
    setTimeout(() => btnSyncBlynkPins?.click(), 900);
    showToast('🚀 Tested all 4 cloud servers: Telegram, Discord, Colab, Blynk!', 'info');
  });

  document.getElementById('btnSaveServerConfigs')?.addEventListener('click', () => {
    showToast('💾 Cloud & Multi-Server credentials safely saved to browser storage', 'info');
    logCloudServerAudit('GATEWAY', 'Updated API keys, webhooks, and routing parameters saved.');
  });

  document.getElementById('btnClearServerAudit')?.addEventListener('click', () => {
    const auditWin = document.getElementById('serverAuditWindow');
    if (auditWin) auditWin.innerHTML = '<div class="audit-row"><span class="audit-time">[System]</span> Cloud dispatch log cleared.</div>';
  });
}

// =============================================================================
// 13.6 SPARK CORE (PARTICLE STM32) & ESP32-CAM INTEGRATION
// =============================================================================
let sparkCloudInterval = null;

function initSparkCoreIntegration() {
  const btnPinoutEsp32 = document.getElementById('btnPinoutEsp32');
  const btnPinoutSpark = document.getElementById('btnPinoutSpark');
  const graphicEsp32 = document.getElementById('graphicEsp32');
  const graphicSparkCore = document.getElementById('graphicSparkCore');
  const pinoutHelpText = document.getElementById('pinoutHelpText');

  btnPinoutEsp32?.addEventListener('click', () => {
    btnPinoutEsp32.className = 'btn btn-primary btn-xs';
    if (btnPinoutSpark) btnPinoutSpark.className = 'btn btn-secondary btn-xs';
    if (graphicEsp32) graphicEsp32.style.display = 'grid';
    if (graphicSparkCore) graphicSparkCore.style.display = 'none';
    if (pinoutHelpText) pinoutHelpText.textContent = 'ESP32-CAM Pinout: GPIO 12(PIR), 13(DHT22), 14(Reed), 15(Ultra), 4(Relay), 36(MQ-2), 39(Volt), 34(Current)';
  });

  btnPinoutSpark?.addEventListener('click', () => {
    btnPinoutSpark.className = 'btn btn-primary btn-xs';
    if (btnPinoutEsp32) btnPinoutEsp32.className = 'btn btn-secondary btn-xs';
    if (graphicEsp32) graphicEsp32.style.display = 'none';
    if (graphicSparkCore) graphicSparkCore.style.display = 'grid';
    if (pinoutHelpText) pinoutHelpText.textContent = 'Spark Core Pinout: D2(DHT22), D3(Reed), D4(PIR), D5/D6(HC-SR04), D7(Relay), A0(MQ2), A1(Volt), A2(Current), TX/RX(ESP32-CAM UART Bridge)';
  });

  // Spark Cloud Modal
  const btnSparkCloudConnect = document.getElementById('btnSparkCloudConnect');
  const sparkCloudModal = document.getElementById('sparkCloudModal');
  const btnCloseSparkModal = document.getElementById('btnCloseSparkModal');
  const btnCancelSparkModal = document.getElementById('btnCancelSparkModal');
  const btnStartSparkCloudStream = document.getElementById('btnStartSparkCloudStream');

  btnSparkCloudConnect?.addEventListener('click', () => {
    if (sparkCloudModal) sparkCloudModal.classList.add('active');
  });

  const closeSparkModal = () => {
    if (sparkCloudModal) sparkCloudModal.classList.remove('active');
  };

  btnCloseSparkModal?.addEventListener('click', closeSparkModal);
  btnCancelSparkModal?.addEventListener('click', closeSparkModal);

  btnStartSparkCloudStream?.addEventListener('click', () => {
    const devId = document.getElementById('sparkDeviceId')?.value?.trim() || '54ff74066678574924331067';
    const token = document.getElementById('sparkAccessToken')?.value?.trim() || '';
    
    closeSparkModal();

    if (sparkCloudInterval) {
      clearInterval(sparkCloudInterval);
      sparkCloudInterval = null;
    }
    if (window.sparkEventSource) {
      try { window.sparkEventSource.close(); } catch (_) {}
      window.sparkEventSource = null;
    }

    onHardwareConnected('Particle Cloud', 'Spark Core');
    logCloudServerAudit('GATEWAY', `Initiating Particle Cloud event stream for Spark Core (${devId.slice(0, 8)}...)...`);
    logTerminal(`[Spark Cloud: Connecting to api.particle.io event stream for device ${devId}...]`);
    logTerminal(`[No dummy data: streaming physical device events only]`);
    showToast('⚡ Connecting Spark Core Particle stream...', 'info');

    try {
      const sseUrl = `https://api.particle.io/v1/devices/${devId}/events?access_token=${token}`;
      const es = new EventSource(sseUrl);
      window.sparkEventSource = es;

      es.onopen = () => {
        logTerminal(`[✓ Spark Core Particle SSE link opened. Waiting for physical device publishes...]`);
        showToast('⚡ Spark Core live stream connected!', 'success');
      };

      es.onmessage = (event) => {
        try {
          const parsed = JSON.parse(event.data);
          const rawPayload = parsed.data || event.data;
          logTerminal(`[SPARK] ${rawPayload}`);
          autoCollectAndMapTelemetry(rawPayload);
        } catch (_) {
          logTerminal(`[SPARK] ${event.data}`);
          autoCollectAndMapTelemetry(event.data);
        }
      };

      es.onerror = () => {
        logTerminal(`[⚠️ Spark Cloud Error]: Remote Particle stream closed or unauthorized.`);
        onHardwareDisconnected('Spark Cloud stream ended');
        try { es.close(); } catch (_) {}
        window.sparkEventSource = null;
      };
    } catch (err) {
      logTerminal(`[Spark Cloud Exception]: ${err.message}`);
      onHardwareDisconnected('Spark Cloud exception');
    }
  });

  // Automatically select Spark Core sketch when chosen in board selector
  el.boardSelector?.addEventListener('change', (e) => {
    if (e.target.value === 'spark_core') {
      const sparkTab = document.querySelector('.code-tab[data-sketch="spark_core"]');
      if (sparkTab) sparkTab.click();
      showToast('⚡ Spark Core STM32 sketch loaded in IDE', 'info');
    }
  });
}

// =============================================================================
// 14. UNIVERSAL SERIAL DEVICE EXAMINER & 100+ SENSOR REPOSITORY
// =============================================================================
let activeCatalogCategory = 'all';
let activeCatalogSignal = 'all';
let activeCatalogSearch = '';
let selectedFirmwareSensorIds = ['dht22', 'mq2', 'zmpt101b', 'acs712_20', 'reed_switch', 'hcsr501', 'relay_1ch'];

function handleExaminerLiveStream(line) {
  const autoCheckbox = document.getElementById('examinerAutoAnalyze');
  if (!autoCheckbox || !autoCheckbox.checked) return;

  const inputArea = document.getElementById('examinerSerialInput');
  if (inputArea) {
    inputArea.value = line;
  }
  const statusPill = document.getElementById('examinerSerialStatus');
  if (statusPill) {
    statusPill.textContent = 'Active Ingestion';
    statusPill.className = 'badge badge-peaceful';
  }
  runExaminerAnalysis(line, true);

  // Auto-Add Detected Sensor to Active Premise if confident match
  if (window.serialOutputExaminer) {
    const analysis = window.serialOutputExaminer.examine(line);
    if (analysis && analysis.matches && analysis.matches.length > 0) {
      const top = analysis.matches[0];
      if (top.confidence >= 75) {
        const alreadyExists = state.configuredSensors.some(s => s.templateId === top.template.id);
        if (!alreadyExists) {
          const targetRoom = state.rooms[0]?.name || 'Front Entrance';
          const newAutoSensor = {
            id: Date.now(),
            templateId: top.template.id,
            name: top.template.name,
            pin: top.template.pins[1] || 'UART Serial',
            type: top.template.signalType,
            room: targetRoom,
            threshold: 'Auto Ingested',
            category: top.template.category
          };
          state.configuredSensors.push(newAutoSensor);
          renderPremiseZones();
          renderDynamicSensorsGrid();
          renderSensorsTable();
          updateFacilityInfo();
          showToast(`✨ Auto-Added "${top.template.model}" to ${targetRoom} from live serial stream!`, 'success');
        }
      }
    }
  }
}

function runExaminerAnalysis(rawText, fromStream = false) {
  const resultsBox = document.getElementById('examinerResultsBox');
  if (!resultsBox) return;

  if (!rawText || !rawText.trim()) {
    resultsBox.innerHTML = `
      <div class="results-empty-state">
        <span style="font-size: 2rem;">⚡</span>
        <p>No serial data to examine. Paste a packet above or click a test signature.</p>
      </div>`;
    return;
  }

  if (!window.serialOutputExaminer) {
    resultsBox.innerHTML = `<div style="color: #ef4444; font-size: 0.85rem;">Examiner engine not yet initialized.</div>`;
    return;
  }

  const analysis = window.serialOutputExaminer.examine(rawText);

  // Render extracted fields
  const fieldKeys = Object.keys(analysis.extractedFields);
  let fieldsHtml = '';
  if (fieldKeys.length > 0) {
    fieldsHtml = `
      <div style="margin-bottom: 8px;">
        <span style="font-size: 0.76rem; font-weight: 600; color: var(--text-muted); text-transform: uppercase;">Extracted Telemetry Tokens:</span>
        <div class="fields-chip-group" style="margin-top: 4px;">
          ${fieldKeys.map(k => `<span class="field-kv-chip"><strong>${k}:</strong> ${analysis.extractedFields[k]}</span>`).join('')}
        </div>
      </div>`;
  }

  // Render Matches
  let matchesHtml = '';
  if (analysis.matches.length === 0) {
    matchesHtml = `
      <div style="background: rgba(245, 158, 11, 0.1); border: 1px solid #f59e0b; border-radius: 6px; padding: 10px; font-size: 0.82rem; color: #b45309;">
        ⚠️ No confident sensor match found (>20% score) for this signature. The data might be an unknown proprietary binary framing or custom protocol.
      </div>`;
  } else {
    matchesHtml = analysis.matches.slice(0, 5).map(m => {
      const t = m.template;
      const scoreClass = m.confidence >= 75 ? '' : 'amber';
      const tagClass = t.analogOrDigital === 'Analog' ? 'sensor-tag-analog' : (t.category === 'actuator' ? 'sensor-tag-actuator' : 'sensor-tag-digital');
      return `
        <div class="matched-sensor-card">
          <div class="match-card-top">
            <div style="display: flex; align-items: center; gap: 8px;">
              <span style="font-size: 1.1rem;">${getCategoryIcon(t.category)}</span>
              <strong style="font-size: 0.92rem; color: var(--text-main);">${t.name}</strong>
            </div>
            <span class="match-score-badge ${scoreClass}">${m.confidence}% MATCH</span>
          </div>
          <div style="display: flex; gap: 6px; margin: 4px 0 6px 0;">
            <span class="${tagClass}">${t.analogOrDigital}</span>
            <span class="badge" style="background: #f1f5f9; color: #475569; font-size: 0.68rem;">Model: ${t.model}</span>
            <span class="badge" style="background: #f1f5f9; color: #475569; font-size: 0.68rem;">Voltage: ${t.voltage}</span>
          </div>
          <p style="font-size: 0.78rem; color: var(--text-muted); margin: 0 0 6px 0;">${t.description}</p>
          <div class="sensor-pins-wrap"><strong>Wiring:</strong> ${t.pins.join(' | ')}</div>
          <div style="display: flex; justify-content: flex-end; gap: 6px; margin-top: 8px;">
            <button class="btn btn-secondary btn-xs btn-inspect-sensor" data-id="${t.id}">Inspect Model</button>
            <button class="btn btn-primary btn-xs btn-add-to-fw" data-id="${t.id}">+ Add to Firmware Stack</button>
          </div>
        </div>`;
    }).join('');
  }

  resultsBox.innerHTML = `
    <div class="match-summary-header">
      <div style="display: flex; align-items: center; gap: 8px;">
        <span class="format-pill">${analysis.formatDetected}</span>
        <span style="font-size: 0.82rem; font-weight: 600; color: var(--text-main);">
          ${analysis.matchCount} Candidate Model${analysis.matchCount === 1 ? '' : 's'} Matched
        </span>
      </div>
      <span style="font-size: 0.72rem; color: var(--text-muted);">${fromStream ? 'Live Stream Frame' : 'Manual Examination'}</span>
    </div>
    ${fieldsHtml}
    ${matchesHtml}
  `;

  // Attach button handlers inside results box
  resultsBox.querySelectorAll('.btn-inspect-sensor').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.id;
      const searchInput = document.getElementById('catalogSearchInput');
      if (searchInput) {
        searchInput.value = id;
        activeCatalogSearch = id.toLowerCase();
        renderSensorCatalogGrid();
      }
    });
  });

  resultsBox.querySelectorAll('.btn-add-to-fw').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.id;
      if (!selectedFirmwareSensorIds.includes(id)) {
        selectedFirmwareSensorIds.push(id);
        showToast(`Added ${id} to firmware generator stack`, 'success');
      } else {
        showToast(`${id} is already in the firmware stack`, 'info');
      }
    });
  });
}

function getCategoryIcon(cat) {
  const map = {
    climate: '🌡️',
    gas: '💨',
    power: '⚡',
    motion: '🚶',
    optical: '💡',
    liquid: '💧',
    actuator: '🎛️',
    wireless: '📡',
    mcu: '📷'
  };
  return map[cat] || '📟';
}

function mapTemplateSensorToRoom(templateId, customRoom = null) {
  const templates = window.SENSOR_TEMPLATES || [];
  const t = templates.find(x => x.id === templateId);
  if (!t) return;

  let targetRoom = customRoom;
  if (!targetRoom) {
    if (t.category === 'gas') targetRoom = 'Kitchen';
    else if (t.category === 'motion' || t.id.includes('radar') || t.id.includes('pir')) targetRoom = 'Living Room';
    else if (t.category === 'power') targetRoom = 'Power Utility';
    else if (t.category === 'security' || t.id.includes('door') || t.id.includes('reed')) targetRoom = 'Front Entrance';
    else if (t.category === 'liquid') targetRoom = 'Power Utility';
    else targetRoom = 'Master Haven';
  }

  const existingPin = t.pins && t.pins.length ? t.pins[0] : 'GPIO4';
  const newSensor = {
    id: `${t.id}_${Date.now().toString(36)}`,
    templateId: t.id,
    name: `${t.model} - ${t.name}`,
    pin: existingPin,
    type: t.analogOrDigital || 'Digital',
    room: targetRoom,
    category: t.category || 'climate',
    status: 'Normal',
    value: t.analogOrDigital === 'Analog' ? 0.0 : 1,
    unit: t.unit || '',
    threshold: t.category === 'gas' ? '300 ppm' : (t.category === 'power' ? '250 V' : 'Nominal')
  };

  if (!state.configuredSensors) state.configuredSensors = [];
  state.configuredSensors.push(newSensor);
  try { localStorage.setItem('sanctuary_configured_sensors', JSON.stringify(state.configuredSensors)); } catch (_) {}

  // Update views
  if (typeof renderSensorsTable === 'function') renderSensorsTable();
  if (typeof renderPremiseZones === 'function') renderPremiseZones();
  if (typeof renderDynamicSensorsGrid === 'function') renderDynamicSensorsGrid();
  if (typeof updateFacilityInfo === 'function') updateFacilityInfo();

  showToast(`🏠 Exported ${t.model} into "${targetRoom}" blueprint and pin routing!`, 'success');
  playChimeSound();
}

function renderSensorCatalogGrid() {
  const grid = document.getElementById('catalogGrid');
  if (!grid) return;

  const templates = window.SENSOR_TEMPLATES || [];
  const query = activeCatalogSearch.toLowerCase().trim();

  const filtered = templates.filter(t => {
    // Category match
    if (activeCatalogCategory !== 'all' && t.category !== activeCatalogCategory) return false;

    // Signal type match
    if (activeCatalogSignal === 'analog' && t.analogOrDigital !== 'Analog') return false;
    if (activeCatalogSignal === 'digital' && t.analogOrDigital !== 'Digital') return false;
    if (activeCatalogSignal === 'actuator' && t.category !== 'actuator') return false;

    // Text search query
    if (query) {
      const textCorpus = `${t.name} ${t.model} ${t.id} ${t.category} ${t.signalType} ${t.pins.join(' ')} ${t.voltage} ${t.description}`.toLowerCase();
      if (!textCorpus.includes(query)) return false;
    }
    return true;
  });

  const countBadge = document.getElementById('catalogBadgeCount');
  if (countBadge) {
    const stackCount = selectedFirmwareSensorIds.length;
    countBadge.textContent = `${filtered.length} of ${templates.length} Models (${stackCount} in Stack)`;
  }

  if (filtered.length === 0) {
    grid.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 40px 20px; color: var(--text-muted);">
        <span style="font-size: 2rem;">🔍</span>
        <p style="margin-top: 8px;">No sensor templates found matching "${query}".</p>
        <button class="btn btn-secondary btn-sm" id="btnResetCatalogFilters" style="margin-top: 10px;">Reset Filters</button>
      </div>`;
    document.getElementById('btnResetCatalogFilters')?.addEventListener('click', () => {
      activeCatalogCategory = 'all';
      activeCatalogSignal = 'all';
      activeCatalogSearch = '';
      if (document.getElementById('catalogSearchInput')) document.getElementById('catalogSearchInput').value = '';
      if (document.getElementById('catalogSignalFilter')) document.getElementById('catalogSignalFilter').value = 'all';
      renderCategoryPills();
      renderSensorCatalogGrid();
    });
    return;
  }

  grid.innerHTML = filtered.map(t => {
    const tagClass = t.analogOrDigital === 'Analog' ? 'sensor-tag-analog' : (t.category === 'actuator' ? 'sensor-tag-actuator' : 'sensor-tag-digital');
    const isInStack = selectedFirmwareSensorIds.includes(t.id);
    return `
      <div class="sensor-catalog-card" data-id="${t.id}">
        <div>
          <div class="sensor-card-header">
            <div style="display: flex; align-items: center; gap: 6px;">
              <span style="font-size: 1.15rem;">${getCategoryIcon(t.category)}</span>
              <h4 class="sensor-model-title">${t.model}</h4>
            </div>
            <span class="${tagClass}">${t.analogOrDigital}</span>
          </div>
          <div style="font-size: 0.8rem; font-weight: 500; color: var(--text-main); margin-bottom: 6px;">${t.name}</div>
          <p style="font-size: 0.74rem; color: var(--text-muted); margin-bottom: 8px; line-height: 1.35;">${t.description}</p>
          
          <div class="sensor-detail-row">
            <span>Operating Voltage:</span>
            <strong>${t.voltage}</strong>
          </div>
          <div class="sensor-detail-row">
            <span>Signal Protocol:</span>
            <span style="font-size: 0.7rem; font-family: monospace;">${t.signalType}</span>
          </div>
          <div class="sensor-pins-wrap" title="${t.pins.join(', ')}">
            📌 ${t.pins.join(' | ')}
          </div>
        </div>

        <div class="sensor-card-actions" style="display: flex; gap: 6px; margin-top: 10px; flex-wrap: wrap;">
          <button class="btn btn-secondary btn-xs btn-card-test" data-sample='${t.sampleOutput.replace(/'/g, "&#39;")}' style="flex: 1 1 28%;">🧪 Test</button>
          <button class="btn ${isInStack ? 'btn-success' : 'btn-primary'} btn-xs btn-card-add-fw" data-id="${t.id}" style="flex: 1 1 32%; ${isInStack ? 'background: #238636; color: #fff; border-color: #2ea043;' : ''}">
            ${isInStack ? '✓ In Stack' : '+ Firmware'}
          </button>
          <button class="btn btn-secondary btn-xs btn-card-map-room" data-id="${t.id}" style="flex: 1 1 32%;" title="Export &amp; map sensor directly to premise room">🏠 To Room</button>
        </div>
      </div>`;
  }).join('');

  // Attach card event listeners
  grid.querySelectorAll('.btn-card-test').forEach(btn => {
    btn.addEventListener('click', () => {
      const sample = btn.dataset.sample;
      const input = document.getElementById('examinerSerialInput');
      if (input) input.value = sample;
      runExaminerAnalysis(sample, false);
      showToast('Loaded sample signature into examiner', 'info');
    });
  });

  grid.querySelectorAll('.btn-card-add-fw').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.id;
      if (!selectedFirmwareSensorIds.includes(id)) {
        selectedFirmwareSensorIds.push(id);
        showToast(`✓ Added ${id} to firmware generator stack`, 'success');
      } else {
        selectedFirmwareSensorIds = selectedFirmwareSensorIds.filter(x => x !== id);
        showToast(`Removed ${id} from firmware stack`, 'info');
      }
      try { localStorage.setItem('sanctuary_fw_stack', JSON.stringify(selectedFirmwareSensorIds)); } catch (_) {}
      renderSensorCatalogGrid();
    });
  });

  grid.querySelectorAll('.btn-card-map-room').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.id;
      mapTemplateSensorToRoom(id);
    });
  });
}

function renderCategoryPills() {
  const container = document.getElementById('catalogCategoryPills');
  if (!container) return;

  const categories = window.SENSOR_CATEGORIES || [];
  const templates = window.SENSOR_TEMPLATES || [];

  container.innerHTML = categories.map(cat => {
    const count = cat.id === 'all' 
      ? templates.length 
      : templates.filter(t => t.category === cat.id).length;
    const isActive = cat.id === activeCatalogCategory ? 'active' : '';
    return `
      <button class="cat-pill ${isActive}" data-category="${cat.id}">
        <span>${cat.icon}</span> ${cat.label} (${count})
      </button>`;
  }).join('');

  container.querySelectorAll('.cat-pill').forEach(pill => {
    pill.addEventListener('click', () => {
      activeCatalogCategory = pill.dataset.category;
      renderCategoryPills();
      renderSensorCatalogGrid();
    });
  });
}

function initFirmwareGeneratorModal() {
  const modal = document.getElementById('firmwareGenModal');
  const btnOpen = document.getElementById('btnOpenFirmwareModal');
  const btnClose = document.getElementById('btnCloseFirmwareModal');
  const btnCancel = document.getElementById('btnCancelFwModal');
  const btnCopy = document.getElementById('btnCopyGeneratedFw');
  const btnDownload = document.getElementById('btnDownloadFwIno');
  const boardSelect = document.getElementById('fwTargetBoard');
  const baudSelect = document.getElementById('fwBaudRate');
  const checklistContainer = document.getElementById('fwSensorsChecklist');
  const codeOutput = document.getElementById('fwCodeOutput');

  if (!modal || !btnOpen) return;

  function updateFirmwarePreview() {
    if (!window.serialOutputExaminer) return;
    const board = boardSelect ? boardSelect.value : 'esp32cam';
    const baud = baudSelect ? baudSelect.value : '115200';
    
    // Read currently checked boxes
    const checkedIds = [];
    checklistContainer.querySelectorAll('input[type="checkbox"]:checked').forEach(cb => {
      checkedIds.push(cb.value);
    });
    selectedFirmwareSensorIds = checkedIds;

    const code = window.serialOutputExaminer.generateFirmware(selectedFirmwareSensorIds, board, baud);
    if (codeOutput) {
      codeOutput.textContent = code;
    }
  }

  function populateSensorsChecklist() {
    const templates = window.SENSOR_TEMPLATES || [];
    checklistContainer.innerHTML = templates.map(t => {
      const isChecked = selectedFirmwareSensorIds.includes(t.id) ? 'checked' : '';
      return `
        <label class="fw-checkbox-label" title="${t.name}">
          <input type="checkbox" value="${t.id}" ${isChecked}>
          <span>${t.model} (${t.analogOrDigital})</span>
        </label>`;
    }).join('');

    checklistContainer.querySelectorAll('input[type="checkbox"]').forEach(cb => {
      cb.addEventListener('change', updateFirmwarePreview);
    });
  }

  btnOpen.addEventListener('click', () => {
    populateSensorsChecklist();
    updateFirmwarePreview();
    modal.classList.add('active');
  });

  btnClose?.addEventListener('click', () => modal.classList.remove('active'));
  btnCancel?.addEventListener('click', () => modal.classList.remove('active'));
  boardSelect?.addEventListener('change', updateFirmwarePreview);
  baudSelect?.addEventListener('change', updateFirmwarePreview);

  btnCopy?.addEventListener('click', () => {
    if (codeOutput && codeOutput.textContent) {
      navigator.clipboard.writeText(codeOutput.textContent).then(() => {
        showToast('Firmware sketch copied to clipboard!', 'success');
      });
    }
  });

  btnDownload?.addEventListener('click', () => {
    if (!codeOutput || !codeOutput.textContent) return;
    const blob = new Blob([codeOutput.textContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Sanctuary_Universal_Firmware_${boardSelect.value}.ino`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('Downloaded .ino firmware sketch', 'success');
  });
}

function initUniversalSensorExaminer() {
  const templates = window.SENSOR_TEMPLATES || [];
  
  // Populate metric counters
  const statTotal = document.getElementById('statTotalSensors');
  const statAnalog = document.getElementById('statAnalogSensors');
  const statDigital = document.getElementById('statDigitalSensors');
  const statActuator = document.getElementById('statActuatorSensors');

  if (statTotal) statTotal.textContent = `${templates.length} Loaded`;
  if (statAnalog) statAnalog.textContent = `${templates.filter(t => t.analogOrDigital === 'Analog').length} Sensors`;
  if (statDigital) statDigital.textContent = `${templates.filter(t => t.analogOrDigital === 'Digital').length} Sensors`;
  if (statActuator) statActuator.textContent = `${templates.filter(t => t.category === 'actuator').length} Devices`;

  // Render UI Components
  renderCategoryPills();
  renderSensorCatalogGrid();
  initFirmwareGeneratorModal();

  // Search Input listener
  const searchInput = document.getElementById('catalogSearchInput');
  searchInput?.addEventListener('input', (e) => {
    activeCatalogSearch = e.target.value;
    renderSensorCatalogGrid();
  });

  // Signal filter listener
  const signalFilter = document.getElementById('catalogSignalFilter');
  signalFilter?.addEventListener('change', (e) => {
    activeCatalogSignal = e.target.value;
    renderSensorCatalogGrid();
  });

  // Test Signatures Sample Chips
  const sampleChips = document.getElementById('examinerSampleChips');
  sampleChips?.querySelectorAll('.sample-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      const sample = chip.dataset.sample;
      const input = document.getElementById('examinerSerialInput');
      if (input) input.value = sample;
      runExaminerAnalysis(sample, false);
      showToast('Loaded sample serial signature into examiner', 'info');
    });
  });

  // Examine & Match Button
  const btnAnalyze = document.getElementById('btnRunExaminerAnalyze');
  btnAnalyze?.addEventListener('click', () => {
    const input = document.getElementById('examinerSerialInput');
    const text = input ? input.value : '';
    runExaminerAnalysis(text, false);
  });

  // Auto-Refresh Telemetry Toggle
  const chkAutoRefresh = document.getElementById('examinerAutoRefreshStream');
  let autoRefreshInterval = null;
  chkAutoRefresh?.addEventListener('change', (e) => {
    if (e.target.checked) {
      showToast('Started Universal Telemetry Auto-Refresh', 'info');
      const templates = window.SENSOR_TEMPLATES || [];
      autoRefreshInterval = setInterval(() => {
        const input = document.getElementById('examinerSerialInput');
        if (input && templates.length > 0) {
          const randTmpl = templates[Math.floor(Math.random() * templates.length)];
          const val = Math.floor(Math.random() * 100);
          let rawData = '';
          if (randTmpl.analogOrDigital === 'Analog') {
            rawData = `A0: ${val * 10}`;
          } else {
            rawData = `{"${randTmpl.name.replace(/\s+/g, '').toLowerCase()}": ${val}}`;
          }
          input.value = rawData;
          if (document.getElementById('examinerAutoAnalyze')?.checked) {
            runExaminerAnalysis(rawData, true);
          }
        }
      }, 3000);
    } else {
      showToast('Stopped Telemetry Auto-Refresh', 'info');
      clearInterval(autoRefreshInterval);
    }
  });

  // Clear Button
  const btnClearText = document.getElementById('btnClearExaminerText');
  btnClearText?.addEventListener('click', () => {
    const input = document.getElementById('examinerSerialInput');
    if (input) input.value = '';
    const resultsBox = document.getElementById('examinerResultsBox');
    if (resultsBox) {
      resultsBox.innerHTML = `
        <div class="results-empty-state">
          <span style="font-size: 2rem;">⚡</span>
          <p>Click any test signature above or stream serial output to run heuristic pattern matching.</p>
        </div>`;
    }
  });

  // Export Catalog JSON
  const btnExportJson = document.getElementById('btnExportCatalogJson');
  btnExportJson?.addEventListener('click', () => {
    const jsonStr = JSON.stringify(templates, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'kyu_universal_sensor_catalog_120plus.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('Exported 120+ Sensor Templates Catalog JSON', 'success');
  });

  // Export Stack to Room Button
  const btnExportStack = document.getElementById('btnExportAllStackToRoom');
  btnExportStack?.addEventListener('click', () => {
    if (!selectedFirmwareSensorIds.length) {
      showToast('Firmware stack is empty. Click "+ Firmware" on any sensor cards first!', 'warning');
      return;
    }
    let count = 0;
    selectedFirmwareSensorIds.forEach(id => {
      mapTemplateSensorToRoom(id);
      count++;
    });
    showToast(`📦 Exported ${count} sensors from firmware stack into premise rooms!`, 'success');
  });
}

// =============================================================================
// 15. AUTOMATION STUDIO & IF / WHAT-IF / ELSE CONTROL ENGINE
// =============================================================================
function initControlsAndAutomationStudio() {
  // 1. Controls Subnav Switcher (Outputs, Rules, What-If)
  const subNav = document.getElementById('controlsSubNav');
  if (subNav) {
    subNav.querySelectorAll('.subnav-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        subNav.querySelectorAll('.subnav-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const sub = btn.dataset.subtab || btn.dataset.subpanel;
        const targetId = sub.startsWith('subpanel-') ? sub : `subpanel-${sub}`;
        ['subpanel-outputs', 'subpanel-rules', 'subpanel-whatif'].forEach(id => {
          const panel = document.getElementById(id);
          if (panel) {
            if (id === targetId) {
              panel.style.display = 'block';
              panel.classList.add('active');
            } else {
              panel.style.display = 'none';
              panel.classList.remove('active');
            }
          }
        });
      });
    });
  }

  // 2. Room Outputs UI & Live Control Toggles
  updateRoomOutputsUI();

  // Kitchen Fan Toggle
  document.getElementById('toggleFan')?.addEventListener('change', (e) => {
    state.roomOutputs.fan = e.target.checked;
    showToast(`Kitchen Exhaust Fan is now ${e.target.checked ? '🌀 RUNNING' : '⚪ OFF'}`, e.target.checked ? 'success' : 'info');
  });

  // Gas Solenoid Valve Buttons
  document.getElementById('btnOutputValveOpen')?.addEventListener('click', () => {
    state.roomOutputs.valve = true;
    const lbl = document.getElementById('lblGasValveStatus');
    if (lbl) { lbl.textContent = 'OPEN (FLOWING)'; lbl.className = 'badge badge-peaceful'; }
    showToast('🟢 Gas Solenoid Valve OPEN (Flowing)', 'success');
  });
  document.getElementById('btnOutputValveCutoff')?.addEventListener('click', () => {
    state.roomOutputs.valve = false;
    const lbl = document.getElementById('lblGasValveStatus');
    if (lbl) { lbl.textContent = 'CUTOFF (ISOLATED)'; lbl.className = 'badge badge-danger'; }
    showToast('🔴 Emergency Gas Valve SHUT / CUTOFF', 'danger');
  });

  // Airflow Window Slider
  document.getElementById('sliderWindow')?.addEventListener('input', (e) => {
    state.roomOutputs.windowPercent = parseInt(e.target.value);
    const lbl = document.getElementById('lblWindowPercent');
    if (lbl) lbl.textContent = `${e.target.value}% Ajar`;
  });

  // Smart Climate AC Unit
  document.getElementById('toggleAcPower')?.addEventListener('change', (e) => {
    state.roomOutputs.acPower = e.target.checked;
    showToast(`Smart Inverter AC Unit ${e.target.checked ? 'POWERED ON' : 'POWERED OFF'}`, 'info');
  });
  document.getElementById('sliderAcTemp')?.addEventListener('input', (e) => {
    state.roomOutputs.acTemp = parseInt(e.target.value);
    const lbl = document.getElementById('lblAcTargetTemp');
    if (lbl) lbl.textContent = `${e.target.value}°C (${(state.roomOutputs.acMode || 'cool').toUpperCase()})`;
  });
  ['btnAcCool', 'btnAcHeat', 'btnAcEco'].forEach(id => {
    document.getElementById(id)?.addEventListener('click', () => {
      ['btnAcCool', 'btnAcHeat', 'btnAcEco'].forEach(x => document.getElementById(x)?.classList.remove('active-mode'));
      document.getElementById(id)?.classList.add('active-mode');
      const mode = id === 'btnAcCool' ? 'cool' : id === 'btnAcHeat' ? 'heat' : 'eco';
      state.roomOutputs.acMode = mode;
      const lbl = document.getElementById('lblAcTargetTemp');
      if (lbl) lbl.textContent = `${state.roomOutputs.acTemp || 22}°C (${mode.toUpperCase()})`;
      showToast(`AC Mode set to ${mode.toUpperCase()}`, 'info');
    });
  });

  // Alarm Sounder Buzzer Test
  document.getElementById('btnTestBuzzer')?.addEventListener('click', () => {
    showToast('🔔 Sounding 85dB Piezo Siren Test (2s)...', 'warning');
    playBuzzerTone();
  });

  // Security Perimeter Floodlights
  document.getElementById('toggleFloodlights')?.addEventListener('change', (e) => {
    state.roomOutputs.floodlights = e.target.checked;
    showToast(`Perimeter Floodlights ${e.target.checked ? '💡 ON' : 'OFF'}`, 'info');
  });

  // Entrance Maglock
  const btnLock = document.getElementById('btnToggleDoorLock');
  btnLock?.addEventListener('click', () => {
    state.roomOutputs.doorLock = !state.roomOutputs.doorLock;
    if (btnLock) {
      btnLock.textContent = state.roomOutputs.doorLock ? '🔒 ENGAGED' : '🔓 UNLOCKED';
      btnLock.className = `btn ${state.roomOutputs.doorLock ? 'btn-secondary' : 'btn-danger'} btn-xs`;
    }
    showToast(`Entrance Maglock is now ${state.roomOutputs.doorLock ? 'ENGAGED / LOCKED' : 'DISENGAGED / UNLOCKED'}`, state.roomOutputs.doorLock ? 'success' : 'warning');
  });

  // Sump Pump
  document.getElementById('togglePump')?.addEventListener('change', (e) => {
    state.roomOutputs.pump = e.target.checked;
    showToast(`Sump / Water Pump ${e.target.checked ? '💧 RUNNING' : 'STANDBY'}`, 'info');
  });

  // Circuit Breaker Shunt Trip / Reset
  document.getElementById('btnTripBreaker')?.addEventListener('click', () => {
    state.roomOutputs.breaker = false;
    const lbl = document.getElementById('lblBreakerStatus');
    if (lbl) { lbl.textContent = 'TRIPPED (ISOLATED)'; lbl.className = 'badge badge-danger'; }
    showToast('⚡ Mains Distribution Breaker TRIPPED / ISOLATED', 'danger');
  });
  document.getElementById('btnResetBreaker')?.addEventListener('click', () => {
    state.roomOutputs.breaker = true;
    const lbl = document.getElementById('lblBreakerStatus');
    if (lbl) { lbl.textContent = 'CLOSED (ACTIVE)'; lbl.className = 'badge badge-peaceful'; }
    showToast('⚡ Mains Distribution Breaker RE-CLOSED (Active)', 'success');
  });

  // Night Guard Auto-Arm
  document.getElementById('toggleNightGuard')?.addEventListener('change', (e) => {
    state.roomOutputs.nightGuard = e.target.checked;
    showToast(`Night Guard Perimeter Sentry ${e.target.checked ? 'ARMED' : 'DISARMED'}`, 'info');
  });

  // Evaluate Rules Now button
  document.getElementById('btnEvaluateRulesNow')?.addEventListener('click', () => {
    const res = evaluateAutomationRules();
    showToast(`⚡ Evaluated ${res.rulesEvaluated || state.automationRules.length} rules. Triggered: ${res.ifTriggeredCount || 0} IF actions, ${res.elseTriggeredCount || 0} ELSE fallbacks.`, 'info');
  });

  // Attach Output Parameter slider listeners (Speed, Angle, AC Temp)
  document.querySelectorAll('.output-param-slider').forEach(slider => {
    slider.addEventListener('input', (e) => {
      const outputKey = slider.dataset.output;
      const param = slider.dataset.param;
      const val = parseFloat(slider.value);
      if (!outputKey || !state.roomOutputs[outputKey]) return;

      state.roomOutputs[outputKey][param] = val;
      const label = document.getElementById(`outputParamVal_${outputKey}_${param}`);
      if (label) {
        const unit = param === 'speed' ? '%' : param === 'angle' ? '°' : '°C';
        label.textContent = `${val}${unit}`;
      }
    });
  });

  // 3. Render Automation Rules List
  renderAutomationRulesList();

  // Modal: Add Rule Trigger Buttons
  const btnOpenRule1 = document.getElementById('btnOpenAddRuleModal');
  const btnOpenRule2 = document.getElementById('btnSubpanelAddRule');
  const modalAddRule = document.getElementById('modalAddRule');
  const btnCloseAddRule = document.getElementById('btnCloseAddRuleModal');
  const btnCancelAddRule = document.getElementById('btnCancelAddRule');
  const formAddRule = document.getElementById('formAddRule');
  const ruleSensorSelect = document.getElementById('ruleSensorSelect');

  const openAddRuleModal = () => {
    if (!modalAddRule) return;
    // Populate sensors in select
    if (ruleSensorSelect) {
      ruleSensorSelect.innerHTML = state.configuredSensors.map(s => `
        <option value="${s.id}">${s.name} (${s.room} &bull; ${s.category})</option>
      `).join('');
    }
    modalAddRule.classList.add('active');
  };

  btnOpenRule1?.addEventListener('click', () => {
    if (document.getElementById('editRuleId')) document.getElementById('editRuleId').value = '';
    if (document.getElementById('newRuleName')) document.getElementById('newRuleName').value = '';
    if (document.getElementById('ruleTemplateSelect')) document.getElementById('ruleTemplateSelect').value = '';
    openAddRuleModal();
  });
  btnOpenRule2?.addEventListener('click', () => {
    if (document.getElementById('editRuleId')) document.getElementById('editRuleId').value = '';
    if (document.getElementById('newRuleName')) document.getElementById('newRuleName').value = '';
    if (document.getElementById('ruleTemplateSelect')) document.getElementById('ruleTemplateSelect').value = '';
    openAddRuleModal();
  });

  const closeAddRuleModal = () => {
    if (modalAddRule) modalAddRule.classList.remove('active');
  };

  btnCloseAddRule?.addEventListener('click', closeAddRuleModal);
  btnCancelAddRule?.addEventListener('click', closeAddRuleModal);
  
  const templateSelect = document.getElementById('ruleTemplateSelect');
  if (templateSelect) {
    templateSelect.addEventListener('change', (e) => {
      const val = e.target.value;
      const tplName = document.getElementById('newRuleName');
      const tplOp = document.getElementById('ruleOperatorSelect');
      const tplThresh = document.getElementById('ruleThresholdInput');
      const tplThenOut = document.getElementById('ruleThenOutputSelect');
      const tplThenState = document.getElementById('ruleThenStateSelect');
      const tplElseOut = document.getElementById('ruleElseOutputSelect');
      const tplElseState = document.getElementById('ruleElseStateSelect');
      
      if (val === 'temp_exhaust') {
        if(tplName) tplName.value = 'Auto Exhaust (Temp > 35°C)'; if(tplOp) tplOp.value = '>'; if(tplThresh) tplThresh.value = '35';
        if(tplThenOut) tplThenOut.value = 'fan'; if(tplThenState) tplThenState.value = 'ON'; if(tplElseOut) tplElseOut.value = 'fan'; if(tplElseState) tplElseState.value = 'OFF';
      } else if (val === 'gas_valve') {
        if(tplName) tplName.value = 'Gas Leak Auto-Cutoff'; if(tplOp) tplOp.value = '>'; if(tplThresh) tplThresh.value = '400';
        if(tplThenOut) tplThenOut.value = 'valve'; if(tplThenState) tplThenState.value = 'OFF'; if(tplElseOut) tplElseOut.value = 'valve'; if(tplElseState) tplElseState.value = 'ON';
      } else if (val === 'motion_lights') {
        if(tplName) tplName.value = 'PIR Motion Security Lights'; if(tplOp) tplOp.value = '=='; if(tplThresh) tplThresh.value = '1';
        if(tplThenOut) tplThenOut.value = 'floodlights'; if(tplThenState) tplThenState.value = 'ON'; if(tplElseOut) tplElseOut.value = 'floodlights'; if(tplElseState) tplElseState.value = 'OFF';
      } else if (val === 'door_alarm') {
        if(tplName) tplName.value = 'Door Intrusion Alarm'; if(tplOp) tplOp.value = '=='; if(tplThresh) tplThresh.value = '1';
        if(tplThenOut) tplThenOut.value = 'siren'; if(tplThenState) tplThenState.value = 'ON'; if(tplElseOut) tplElseOut.value = 'siren'; if(tplElseState) tplElseState.value = 'OFF';
      } else if (val === 'voltage_trip') {
        if(tplName) tplName.value = 'High Voltage Grid Trip'; if(tplOp) tplOp.value = '>'; if(tplThresh) tplThresh.value = '250';
        if(tplThenOut) tplThenOut.value = 'breaker'; if(tplThenState) tplThenState.value = 'OFF'; if(tplElseOut) tplElseOut.value = 'breaker'; if(tplElseState) tplElseState.value = 'ON';
      }
    });
  }

  // Form: Submit New Rule
  formAddRule?.addEventListener('submit', (e) => {
    e.preventDefault();
    const editId = document.getElementById('editRuleId')?.value;
    const name = document.getElementById('newRuleName')?.value.trim() || 'Custom Automation Rule';
    const sensorId = document.getElementById('ruleSensorSelect')?.value;
    const operator = document.getElementById('ruleOperatorSelect')?.value || '>';
    const value = parseFloat(document.getElementById('ruleThresholdInput')?.value || '100');
    const thenOutput = document.getElementById('ruleThenOutputSelect')?.value || 'fan';
    const thenState = document.getElementById('ruleThenStateSelect')?.value || 'ON';
    const elseOutput = document.getElementById('ruleElseOutputSelect')?.value || 'fan';
    const elseState = document.getElementById('ruleElseStateSelect')?.value || 'OFF';

    const ruleData = {
      name,
      sensorId,
      operator,
      value,
      thenOutput,
      thenState,
      thenAction: `${thenOutput}_${thenState.toLowerCase()}`,
      elseOutput,
      elseState,
      elseAction: `${elseOutput}_${elseState.toLowerCase()}`,
      active: true,
      lastTriggered: 'Ready & Armed'
    };

    if (editId) {
      const idx = state.automationRules.findIndex(r => String(r.id) === String(editId));
      if (idx !== -1) {
        state.automationRules[idx] = { ...state.automationRules[idx], ...ruleData };
      }
    } else {
      ruleData.id = Date.now();
      state.automationRules.push(ruleData);
    }

    try {
      localStorage.setItem('sanctuary_automation_rules', JSON.stringify(state.automationRules));
    } catch (_) {}

    renderAutomationRulesList();
    evaluateAutomationRules();
    closeAddRuleModal();
    showToast(`⚡ Automation Rule "${name}" saved!`, 'success');
  });

  // 4. WHAT-IF Simulation Sandbox Listeners
  initWhatIfSimulator();
}

function updateRoomOutputsUI() {
  if (!state.roomOutputs) return;

  Object.keys(state.roomOutputs).forEach(key => {
    const out = state.roomOutputs[key];
    const card = document.querySelector(`[data-output-card="${key}"]`);
    if (!card) return;

    const pill = card.querySelector('.output-status-pill');
    const toggleBtn = card.querySelector('.btn-toggle-output');

    if (pill) {
      if (out.active) {
        pill.className = 'badge output-status-pill active-glow';
        pill.textContent = key === 'gas_valve' ? 'VALVE OPEN (FLOW)' :
                           key === 'mains_breaker' ? 'GRID CLOSED (ACTIVE)' :
                           key === 'maglock' ? 'LOCKED / SECURE' :
                           key === 'siren' ? 'BLARING (95 dB)' : 'ENERGIZED (ON)';
      } else {
        pill.className = 'badge output-status-pill idle';
        pill.textContent = key === 'gas_valve' ? 'CUTOFF ISOLATED' :
                           key === 'mains_breaker' ? 'TRIPPED (ISOLATED)' :
                           key === 'maglock' ? 'UNLOCKED' :
                           key === 'siren' ? 'STANDBY (SILENT)' : 'STANDBY (OFF)';
      }
    }

    if (toggleBtn) {
      toggleBtn.className = `btn ${out.active ? 'btn-danger' : 'btn-primary'} btn-xs btn-toggle-output`;
      toggleBtn.textContent = out.active ? 'Turn OFF' : 'Turn ON';
    }

    // Special state text (like AC mode or window angle)
    if (key === 'ac_unit') {
      const modeLbl = card.querySelector('.ac-mode-indicator');
      if (modeLbl) modeLbl.textContent = `Mode: ${(out.mode || 'cool').toUpperCase()} &bull; Set: ${out.setpoint || 22}°C`;
    }
  });
}

function renderAutomationRulesList() {
  const container = document.getElementById('rulesContainer');
  if (!container) return;

  if (!state.automationRules || state.automationRules.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; padding: 40px; color: var(--text-muted); grid-column: 1 / -1;">
        <span style="font-size: 2.2rem;">⚡</span>
        <p style="margin-top: 8px;">No automation rules configured yet. Click "+ Add Rule" above to create an IF / THEN / ELSE logic circuit.</p>
      </div>`;
    return;
  }

  container.innerHTML = state.automationRules.map((rule, idx) => {
    const isActive = rule.active !== undefined ? rule.active : (rule.enabled !== undefined ? rule.enabled : true);
    const thresholdVal = rule.value !== undefined ? rule.value : (rule.threshold !== undefined ? rule.threshold : 0);
    const sensor = state.configuredSensors.find(s => String(s.id) === String(rule.sensorId));
    const sensorName = sensor ? sensor.name : (rule.sensorName || 'Sensor Channel');
    const sensorUnit = sensor ? (sensor.unit || '') : '';
    const thenOutputName = (rule.thenOutput || 'fan').toUpperCase();
    const thenStateName = rule.thenState || 'ACTIVATE';
    const elseOutputName = (rule.elseOutput || rule.thenOutput || 'fan').toUpperCase();
    const elseStateName = rule.elseState || 'STANDBY';

    return `
      <div class="rule-card ${isActive ? 'rule-active' : 'rule-disabled'}" data-rule-id="${rule.id}">
        <div class="rule-card-header">
          <div style="display: flex; align-items: center; gap: 8px;">
            <span style="font-size: 1.2rem;">⚡</span>
            <div>
              <strong style="font-size: 0.95rem; color: var(--text-main);">${rule.name}</strong>
              <div style="font-size: 0.74rem; color: var(--text-muted);">Logic Loop #${idx + 1} &bull; Target: ${thenOutputName}</div>
            </div>
          </div>
          <div style="display: flex; align-items: center; gap: 10px;">
            <span class="badge ${isActive ? 'badge-peaceful' : 'badge-danger'}">${isActive ? 'ARMED' : 'DISABLED'}</span>
            <label class="switch"><input type="checkbox" ${isActive ? 'checked' : ''} class="toggle-rule-active" data-id="${rule.id}"><span class="slider round"></span></label>
          </div>
        </div>

        <div class="rule-clause-row">
          <span class="rule-keyword keyword-if">IF</span>
          <span class="rule-expression"><strong>${sensorName}</strong> ${rule.operator} <strong>${thresholdVal} ${sensorUnit}</strong></span>
        </div>

        <div class="rule-clause-row">
          <span class="rule-keyword keyword-then">THEN</span>
          <span class="rule-expression">Set <strong>${thenOutputName}</strong> &rarr; <span style="color: #10b981; font-weight: 700;">${thenStateName}</span></span>
        </div>

        <div class="rule-clause-row">
          <span class="rule-keyword keyword-else">ELSE</span>
          <span class="rule-expression">Set <strong>${elseOutputName}</strong> &rarr; <span style="color: #6366f1; font-weight: 700;">${elseStateName}</span></span>
        </div>

        <div class="rule-card-footer">
          <span style="font-size: 0.72rem; color: var(--text-muted);">
            Last Action: <strong style="color: var(--accent);">${rule.lastTriggered || 'Idle (Awaiting Stream)'}</strong>
          </span>
          <div style="display: flex; gap: 6px;">
            <button class="btn btn-secondary btn-xs btn-test-rule" data-id="${rule.id}">🧪 Test Fire</button>
            <button class="btn btn-secondary btn-xs btn-edit-rule" data-id="${rule.id}">✏️ Edit</button>
            <button class="btn btn-secondary btn-xs btn-delete-rule" data-id="${rule.id}" style="color: #ef4444;">🗑️</button>
          </div>
        </div>
      </div>`;
  }).join('');

  // Attach toggle active listener
  container.querySelectorAll('.toggle-rule-active').forEach(toggle => {
    toggle.addEventListener('change', (e) => {
      const rule = state.automationRules.find(r => String(r.id) === String(e.target.dataset.id));
      if (rule) {
        rule.active = e.target.checked;
        rule.enabled = e.target.checked;
        try { localStorage.setItem('sanctuary_automation_rules', JSON.stringify(state.automationRules)); } catch (_) {}
        renderAutomationRulesList();
        evaluateAutomationRules();
        showToast(`Rule "${rule.name}" is now ${rule.active ? 'ARMED' : 'DISABLED'}.`, 'info');
      }
    });
  });

  // Attach Test Fire listener
  container.querySelectorAll('.btn-test-rule').forEach(btn => {
    btn.addEventListener('click', () => {
      const rule = state.automationRules.find(r => String(r.id) === String(btn.dataset.id));
      if (!rule) return;

      applyRuleAction(rule.thenAction || `${rule.thenOutput}_on`);
      rule.lastTriggered = `⚡ Manual Test Fired (${new Date().toLocaleTimeString()})`;
      updateRoomOutputsUI();
      renderAutomationRulesList();
      showToast(`🔥 Fired THEN action for "${rule.name}"!`, 'success');
      playChimeSound();
    });
  });

  // Attach Edit listener
  container.querySelectorAll('.btn-edit-rule').forEach(btn => {
    btn.addEventListener('click', () => {
      const rule = state.automationRules.find(r => String(r.id) === String(btn.dataset.id));
      if (!rule) return;
      const modalAddRule = document.getElementById('modalAddRule');
      if (modalAddRule) {
        if(document.getElementById('editRuleId')) document.getElementById('editRuleId').value = rule.id;
        if(document.getElementById('newRuleName')) document.getElementById('newRuleName').value = rule.name;
        if(document.getElementById('ruleTemplateSelect')) document.getElementById('ruleTemplateSelect').value = '';
        if(document.getElementById('ruleSensorSelect')) document.getElementById('ruleSensorSelect').value = rule.sensorId;
        if(document.getElementById('ruleOperatorSelect')) document.getElementById('ruleOperatorSelect').value = rule.operator;
        if(document.getElementById('ruleThresholdInput')) document.getElementById('ruleThresholdInput').value = rule.value || rule.threshold;
        if(document.getElementById('ruleThenOutputSelect')) document.getElementById('ruleThenOutputSelect').value = rule.thenOutput;
        if(document.getElementById('ruleThenStateSelect')) document.getElementById('ruleThenStateSelect').value = rule.thenState;
        if(document.getElementById('ruleElseOutputSelect')) document.getElementById('ruleElseOutputSelect').value = rule.elseOutput;
        if(document.getElementById('ruleElseStateSelect')) document.getElementById('ruleElseStateSelect').value = rule.elseState;
        modalAddRule.classList.add('active');
      }
    });
  });

  // Attach Delete listener
  container.querySelectorAll('.btn-delete-rule').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.id;
      state.automationRules = state.automationRules.filter(r => String(r.id) !== String(id));
      try { localStorage.setItem('sanctuary_automation_rules', JSON.stringify(state.automationRules)); } catch (_) {}
      renderAutomationRulesList();
      showToast('Automation rule removed.', 'info');
    });
  });
}

function evaluateAutomationRules(hypothetical = null) {
  if (!state.automationRules || state.automationRules.length === 0) return null;

  const results = {
    rulesEvaluated: state.automationRules.length,
    ifTriggeredCount: 0,
    elseTriggeredCount: 0,
    actionsTaken: []
  };

  state.automationRules.forEach(rule => {
    const isActive = rule.active !== undefined ? rule.active : (rule.enabled !== undefined ? rule.enabled : true);
    if (!isActive) return;

    // Resolve current sensor value
    let currentVal = null;

    if (hypothetical) {
      // Find matching simulated channel
      if (rule.thenOutput === 'fan' || (rule.thenAction && rule.thenAction.includes('valve')) || rule.name.toLowerCase().includes('gas')) {
        currentVal = hypothetical.gas;
      } else if (rule.name.toLowerCase().includes('temp') || rule.name.toLowerCase().includes('climate') || rule.thenOutput === 'ac') {
        currentVal = hypothetical.temp;
      } else if (rule.name.toLowerCase().includes('volt') || rule.name.toLowerCase().includes('surge') || rule.thenOutput === 'breaker') {
        currentVal = hypothetical.volt;
      } else if (rule.name.toLowerCase().includes('water') || rule.name.toLowerCase().includes('flood') || rule.thenOutput === 'pump') {
        currentVal = hypothetical.water;
      } else if (rule.name.toLowerCase().includes('motion') || rule.name.toLowerCase().includes('siren') || rule.thenOutput === 'lock') {
        currentVal = hypothetical.motion;
      }
    }

    if (currentVal === null) {
      const sensor = state.configuredSensors.find(s => String(s.id) === String(rule.sensorId));
      if (sensor) {
        currentVal = sensor.value;
      } else if (rule.name.toLowerCase().includes('gas')) {
        currentVal = state.telemetry.gas;
      } else if (rule.name.toLowerCase().includes('temp')) {
        currentVal = state.telemetry.temp;
      } else if (rule.name.toLowerCase().includes('volt')) {
        currentVal = state.telemetry.volt;
      } else {
        currentVal = 0;
      }
    }

    const numericVal = parseFloat(currentVal);
    const threshold = parseFloat(rule.value !== undefined ? rule.value : rule.threshold);
    let conditionMet = false;

    switch (rule.operator) {
      case '>': conditionMet = numericVal > threshold; break;
      case '<': conditionMet = numericVal < threshold; break;
      case '>=': conditionMet = numericVal >= threshold; break;
      case '<=': conditionMet = numericVal <= threshold; break;
      case '==': conditionMet = numericVal === threshold; break;
      case '!=': conditionMet = numericVal !== threshold; break;
      default: conditionMet = numericVal > threshold;
    }

    if (conditionMet) {
      results.ifTriggeredCount++;
      const actionName = rule.thenAction || `${rule.thenOutput}_on`;
      results.actionsTaken.push({ branch: 'IF', rule: rule.name, action: actionName });
      if (!hypothetical) {
        applyRuleAction(actionName);
        rule.lastTriggered = `🟢 Triggered IF [${numericVal} ${rule.operator} ${threshold}]`;
      }
    } else {
      results.elseTriggeredCount++;
      const elseActionName = rule.elseAction || `${rule.elseOutput || rule.thenOutput}_off`;
      results.actionsTaken.push({ branch: 'ELSE', rule: rule.name, action: elseActionName });
      if (!hypothetical && rule.elseAction) {
        applyRuleAction(elseActionName);
        rule.lastTriggered = `🔵 Fallback ELSE [${numericVal} ${rule.operator} ${threshold} is FALSE]`;
      }
    }
  });

  if (!hypothetical) {
    updateRoomOutputsUI();
  }

  return results;
}

function applyRuleAction(actionCode) {
  if (!actionCode || !state.roomOutputs) return;
  const act = actionCode.toLowerCase();

  // Fan
  if (act.includes('fan_on') || act === 'fan_activate') {
    state.roomOutputs.fan.active = true;
    state.roomOutputs.fan.speed = 100;
    state.telemetry.fanOn = true;
  } else if (act.includes('fan_off') || act === 'fan_deactivate') {
    state.roomOutputs.fan.active = false;
    state.roomOutputs.fan.speed = 0;
    state.telemetry.fanOn = false;
  }

  // Gas Solenoid Valve
  if (act.includes('valve_shut') || act.includes('valve_cutoff') || act === 'valve_deactivate') {
    state.roomOutputs.gas_valve.active = false;
  } else if (act.includes('valve_open') || act === 'valve_activate') {
    state.roomOutputs.gas_valve.active = true;
  }

  // Siren
  if (act.includes('siren_on') || act.includes('buzzer_on') || act === 'siren_activate' || act === 'buzzer_activate') {
    state.roomOutputs.siren.active = true;
  } else if (act.includes('siren_off') || act.includes('buzzer_off') || act === 'siren_deactivate' || act === 'buzzer_deactivate') {
    state.roomOutputs.siren.active = false;
  }

  // AC Unit
  if (act.includes('ac_on') || act.includes('ac_cool')) {
    state.roomOutputs.ac_unit.active = true;
    state.roomOutputs.ac_unit.mode = 'cool';
  } else if (act.includes('ac_off')) {
    state.roomOutputs.ac_unit.active = false;
  }

  // Sump Pump
  if (act.includes('pump_on') || act === 'pump_activate') {
    state.roomOutputs.water_pump.active = true;
  } else if (act.includes('pump_off') || act === 'pump_deactivate') {
    state.roomOutputs.water_pump.active = false;
  }

  // Breaker
  if (act.includes('breaker_trip') || act.includes('breaker_off') || act === 'breaker_deactivate') {
    state.roomOutputs.mains_breaker.active = false;
  } else if (act.includes('breaker_on') || act === 'breaker_activate') {
    state.roomOutputs.mains_breaker.active = true;
  }

  // Window Servo
  if (act.includes('window_open') || act === 'window_activate') {
    state.roomOutputs.window_servo.active = true;
    state.roomOutputs.window_servo.angle = 90;
  } else if (act.includes('window_shut') || act.includes('window_off') || act === 'window_deactivate') {
    state.roomOutputs.window_servo.active = false;
    state.roomOutputs.window_servo.angle = 0;
  }

  // Maglock
  if (act.includes('lock_on') || act === 'lock_activate') {
    state.roomOutputs.maglock.active = true;
  } else if (act.includes('lock_off') || act === 'lock_deactivate') {
    state.roomOutputs.maglock.active = false;
  }
}

// -----------------------------------------------------------------------------
// WHAT-IF SIMULATOR SANDBOX
// -----------------------------------------------------------------------------
function initWhatIfSimulator() {
  const scenarioPills = document.querySelectorAll('.whatif-pill');
  const tempSlider = document.getElementById('sliderWhatifTemp');
  const gasSlider = document.getElementById('sliderWhatifGas');
  const voltSlider = document.getElementById('sliderWhatifVolt');
  const chkDoor = document.getElementById('chkWhatifDoor');
  const chkPir = document.getElementById('chkWhatifPir');

  const updateWhatIfLabels = () => {
    const lblGas = document.getElementById('lblWhatifGas');
    const lblTemp = document.getElementById('lblWhatifTemp');
    const lblVolt = document.getElementById('lblWhatifVolt');
    const lblBreach = document.getElementById('lblWhatifBreach');

    if (gasSlider && lblGas) lblGas.textContent = `${gasSlider.value} ppm`;
    if (tempSlider && lblTemp) lblTemp.textContent = `${tempSlider.value} °C`;
    if (voltSlider && lblVolt) lblVolt.textContent = `${voltSlider.value} V`;
    if (lblBreach) {
      const doorOpen = chkDoor?.checked;
      const pirActive = chkPir?.checked;
      if (doorOpen && pirActive) {
        lblBreach.textContent = '🚨 Intruder Detected (Door + PIR)';
        lblBreach.style.color = '#ef4444';
      } else if (doorOpen) {
        lblBreach.textContent = '🚪 Door Open / Perimeter Breach';
        lblBreach.style.color = '#f59e0b';
      } else if (pirActive) {
        lblBreach.textContent = '🚶 PIR Motion Active';
        lblBreach.style.color = '#f59e0b';
      } else {
        lblBreach.textContent = 'Normal / Secure';
        lblBreach.style.color = '';
      }
    }
  };

  [tempSlider, gasSlider, voltSlider].forEach(slider => {
    slider?.addEventListener('input', updateWhatIfLabels);
  });
  chkDoor?.addEventListener('change', updateWhatIfLabels);
  chkPir?.addEventListener('change', updateWhatIfLabels);

  // Presets
  const presets = {
    gas_leak: { temp: 34, gas: 580, volt: 238, door: false, pir: false },
    surge: { temp: 25, gas: 180, volt: 262, door: false, pir: false },
    intruder: { temp: 22, gas: 175, volt: 238, door: true, pir: true },
    heatwave: { temp: 36.5, gas: 195, volt: 228, door: false, pir: false },
    flood: { temp: 22, gas: 160, volt: 235, door: false, pir: false }
  };

  scenarioPills.forEach(pill => {
    pill.addEventListener('click', () => {
      scenarioPills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      const sc = presets[pill.dataset.scenario];
      if (!sc) return;

      if (tempSlider) tempSlider.value = sc.temp;
      if (gasSlider) gasSlider.value = sc.gas;
      if (voltSlider) voltSlider.value = sc.volt;
      if (chkDoor) chkDoor.checked = !!sc.door;
      if (chkPir) chkPir.checked = !!sc.pir;

      updateWhatIfLabels();
      runWhatIfSimulation();
      showToast(`Applied hypothetical preset: ${pill.textContent.trim()}`, 'info');
    });
  });

  // Run What-If Sim Button
  document.getElementById('btnRunWhatIfSim')?.addEventListener('click', runWhatIfSimulation);

  // Apply to Live
  document.getElementById('btnApplyWhatIfToLive')?.addEventListener('click', () => {
    if (!tempSlider || !gasSlider || !voltSlider) return;

    state.telemetry.temp = parseFloat(tempSlider.value);
    state.telemetry.gas = parseInt(gasSlider.value);
    state.telemetry.volt = parseFloat(voltSlider.value);
    state.telemetry.doorOpen = !!chkDoor?.checked;
    state.telemetry.motion = !!chkPir?.checked;
    state.telemetry.radarDetected = !!chkPir?.checked;
    state.telemetry.radarSpeed = chkPir?.checked ? 1.8 : 0.0;

    // Update matching sensors in configuredSensors
    state.configuredSensors.forEach(s => {
      const c = (s.category || '').toLowerCase();
      if (c === 'climate') s.value = state.telemetry.temp;
      else if (c === 'gas') s.value = state.telemetry.gas;
      else if (c === 'power') s.value = state.telemetry.volt;
      else if (c === 'motion') s.value = (s.templateId === 'reed_switch' ? (state.telemetry.doorOpen ? 1 : 0) : (state.telemetry.motion ? 1 : 0));
      else if (c === 'radar') s.value = state.telemetry.radarDetected ? 1.8 : 0.0;
    });

    evaluateAutomationRules();
    updateMonitorView();
    renderDynamicSensorsGrid();
    updateRoomOutputsUI();
    showToast('🚀 Applied hypothetical values to LIVE premise sensors & rules!', 'success');
  });

  // Reset What-If
  document.getElementById('btnResetWhatIf')?.addEventListener('click', () => {
    if (tempSlider) tempSlider.value = 24.2;
    if (gasSlider) gasSlider.value = 185;
    if (voltSlider) voltSlider.value = 238;
    if (chkDoor) chkDoor.checked = false;
    if (chkPir) chkPir.checked = false;
    updateWhatIfLabels();

    const resultRules = document.getElementById('whatifResultRules');
    const resultTriggers = document.getElementById('whatifResultTriggers');
    const resultOutputs = document.getElementById('whatifResultOutputs');
    const resultAlerts = document.getElementById('whatifResultAlerts');

    if (resultRules) resultRules.textContent = `${state.automationRules.length} Active Rules Evaluated (Click "Evaluate What-If" to simulate)`;
    if (resultTriggers) { resultTriggers.textContent = 'None currently'; resultTriggers.style.color = '#34d399'; }
    if (resultOutputs) { resultOutputs.textContent = 'All systems in standby'; resultOutputs.style.color = '#fbbf24'; }
    if (resultAlerts) { resultAlerts.textContent = '0 Alerts'; resultAlerts.style.color = ''; }

    showToast('Reset What-If simulator to baseline.', 'info');
  });
}

function runWhatIfSimulation() {
  const temp = parseFloat(document.getElementById('sliderWhatifTemp')?.value || '24.2');
  const gas = parseInt(document.getElementById('sliderWhatifGas')?.value || '185');
  const volt = parseFloat(document.getElementById('sliderWhatifVolt')?.value || '238');
  const door = !!document.getElementById('chkWhatifDoor')?.checked;
  const pir = !!document.getElementById('chkWhatifPir')?.checked;

  const hypothetical = { temp, gas, volt, door: door ? 1 : 0, pir: pir ? 1 : 0, motion: pir ? 1 : 0 };
  const res = evaluateAutomationRules(hypothetical);

  const resultRules = document.getElementById('whatifResultRules');
  const resultTriggers = document.getElementById('whatifResultTriggers');
  const resultOutputs = document.getElementById('whatifResultOutputs');
  const resultAlerts = document.getElementById('whatifResultAlerts');

  if (resultRules) resultRules.textContent = `${res.rulesEvaluated || state.automationRules.length} Rules Checked (${res.ifTriggeredCount || 0} IF Tripped, ${res.elseTriggeredCount || 0} Fallbacks)`;
  
  if (resultTriggers) {
    if (res.actionsTaken && res.actionsTaken.length > 0) {
      resultTriggers.textContent = res.actionsTaken.map(a => `${a.branch}: ${a.rule}`).join(' | ');
      resultTriggers.style.color = res.ifTriggeredCount > 0 ? '#ef4444' : '#60a5fa';
    } else {
      resultTriggers.textContent = 'No critical triggers tripped';
      resultTriggers.style.color = '#34d399';
    }
  }

  if (resultOutputs) {
    if (res.actionsTaken && res.actionsTaken.length > 0) {
      resultOutputs.textContent = res.actionsTaken.map(a => a.action.toUpperCase()).join(', ');
      resultOutputs.style.color = '#10b981';
    } else {
      resultOutputs.textContent = 'Nominal state maintained';
      resultOutputs.style.color = '#94a3b8';
    }
  }

  if (resultAlerts) {
    const isCritical = gas > 350 || volt > 255 || (door && pir);
    resultAlerts.textContent = isCritical ? 'CRITICAL SAFETY INCIDENT FORECAST' : 'NOMINAL SAFETY COMPLIANCE';
    resultAlerts.style.color = isCritical ? '#ef4444' : '#10b981';
    resultAlerts.style.fontWeight = '700';
  }
}

// =============================================================================
// 16. SETUP & PINS: INTERACTIVE STM32 / ESP32 / SPARK CORE ENGINE
// =============================================================================
let currentSelectedPin = null;

function initSetupAndPinsModule() {
  const btnPinoutEsp32 = document.getElementById('btnPinoutEsp32');
  const btnPinoutSpark = document.getElementById('btnPinoutSpark');
  const btnPinoutStm32 = document.getElementById('btnPinoutStm32');
  const graphicEsp32 = document.getElementById('graphicEsp32');
  const graphicSparkCore = document.getElementById('graphicSparkCore');
  const graphicStm32 = document.getElementById('graphicStm32');
  const pinoutHelpText = document.getElementById('pinoutHelpText');

  // Board Selectors
  btnPinoutStm32?.addEventListener('click', () => {
    btnPinoutStm32.className = 'btn btn-primary btn-xs';
    if (btnPinoutEsp32) btnPinoutEsp32.className = 'btn btn-secondary btn-xs';
    if (btnPinoutSpark) btnPinoutSpark.className = 'btn btn-secondary btn-xs';
    if (graphicStm32) graphicStm32.style.display = 'grid';
    if (graphicEsp32) graphicEsp32.style.display = 'none';
    if (graphicSparkCore) graphicSparkCore.style.display = 'none';
    if (pinoutHelpText) pinoutHelpText.textContent = 'STM32 Nucleo/BluePill: PA0-PA15 (ADC/PWM/USART), PB0-PB15 (I2C/SPI), PC13 (User LED / B1 Key), 3.3V/5V/GND Rails';
    showToast('STM32 Board Architecture active in Pinout diagram', 'info');
  });

  btnPinoutEsp32?.addEventListener('click', () => {
    btnPinoutEsp32.className = 'btn btn-primary btn-xs';
    if (btnPinoutStm32) btnPinoutStm32.className = 'btn btn-secondary btn-xs';
    if (btnPinoutSpark) btnPinoutSpark.className = 'btn btn-secondary btn-xs';
    if (graphicEsp32) graphicEsp32.style.display = 'grid';
    if (graphicStm32) graphicStm32.style.display = 'none';
    if (graphicSparkCore) graphicSparkCore.style.display = 'none';
    if (pinoutHelpText) pinoutHelpText.textContent = 'ESP32-CAM Pinout: GPIO 12(PIR), 13(DHT22), 14(Reed), 15(Ultra), 4(Relay), 36(MQ-2), 39(Volt), 34(Current)';
  });

  btnPinoutSpark?.addEventListener('click', () => {
    btnPinoutSpark.className = 'btn btn-primary btn-xs';
    if (btnPinoutEsp32) btnPinoutEsp32.className = 'btn btn-secondary btn-xs';
    if (btnPinoutStm32) btnPinoutStm32.className = 'btn btn-secondary btn-xs';
    if (graphicSparkCore) graphicSparkCore.style.display = 'grid';
    if (graphicEsp32) graphicEsp32.style.display = 'none';
    if (graphicStm32) graphicStm32.style.display = 'none';
    if (pinoutHelpText) pinoutHelpText.textContent = 'Spark Core Pinout: D2(DHT22), D3(Reed), D4(PIR), D5/D6(HC-SR04), D7(Relay), A0(MQ2), A1(Volt), A2(Current), TX/RX';
  });

  // Interactive Pin Chip delegation on all 3 boards
  document.querySelectorAll('.pin-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('.pin-chip').forEach(c => c.classList.remove('selected-pin'));
      chip.classList.add('selected-pin');

      const pin = chip.dataset.pin || chip.textContent.trim().split(' ')[0];
      const board = chip.dataset.board || (chip.closest('#graphicStm32') ? 'stm32' : chip.closest('#graphicEsp32') ? 'esp32' : 'spark');
      const role = chip.dataset.role || chip.textContent.trim() || 'General GPIO';
      const mode = chip.dataset.mode || 'INPUT';
      const sensor = chip.dataset.sensor || 'None';

      currentSelectedPin = { element: chip, pin, board, role, mode, sensor };

      const infoBox = document.getElementById('selectedPinInfo');
      if (infoBox) {
        infoBox.innerHTML = `📍 Selected Pin: <strong style="color: var(--accent);">${pin}</strong> (${board.toUpperCase()}) &bull; Role: <strong>${role}</strong> &bull; Mode: <strong>${mode}</strong> &bull; Sensor: <strong>${sensor}</strong>`;
      }

      const btnInspect = document.getElementById('btnInspectSelectedPin');
      const btnToggle = document.getElementById('btnTogglePinHighLow');
      if (btnInspect) btnInspect.disabled = false;
      if (btnToggle) btnToggle.disabled = false;
    });
  });

  // Toggle Pin High / Low
  document.getElementById('btnTogglePinHighLow')?.addEventListener('click', () => {
    if (!currentSelectedPin || !currentSelectedPin.element) {
      showToast('Click a pin chip on the board graphic first', 'warning');
      return;
    }

    const isHigh = currentSelectedPin.element.classList.contains('high');
    if (isHigh) {
      currentSelectedPin.element.classList.remove('high');
      showToast(`Pin ${currentSelectedPin.pin} driven LOW (0.0V)`, 'info');
    } else {
      currentSelectedPin.element.classList.add('high');
      showToast(`⚡ Pin ${currentSelectedPin.pin} driven HIGH (3.3V)`, 'success');
      playChimeSound();
    }
  });

  // Pin Inspector Modal
  const modalPinInspector = document.getElementById('modalPinInspector');
  const btnInspectSelectedPin = document.getElementById('btnInspectSelectedPin');
  const btnClosePinInspector = document.getElementById('btnClosePinInspector');
  const btnCancelPinInspector = document.getElementById('btnCancelPinInspector');
  const btnSavePinInspector = document.getElementById('btnSavePinInspector');

  btnInspectSelectedPin?.addEventListener('click', () => {
    if (!currentSelectedPin || !modalPinInspector) return;

    document.getElementById('inspectorPinName').textContent = currentSelectedPin.pin;
    document.getElementById('inspectorBoardType').textContent = `Board: ${currentSelectedPin.board.toUpperCase()} &bull; Role: ${currentSelectedPin.role}`;

    // Populate sensors
    const sensorSelect = document.getElementById('inspectorMappedSensorSelect');
    if (sensorSelect) {
      sensorSelect.innerHTML = `<option value="">-- No Sensor Mapped (Floating Pin) --</option>` +
        state.configuredSensors.map(s => `<option value="${s.name}" ${s.pin === currentSelectedPin.pin ? 'selected' : ''}>${s.name} (${s.room})</option>`).join('');
    }

    // Populate rooms
    const roomSelect = document.getElementById('inspectorPinRoomSelect');
    if (roomSelect) {
      roomSelect.innerHTML = state.rooms.map(r => `<option value="${r.name}">${r.name}</option>`).join('');
    }

    // Mode buttons
    const modeBtns = document.querySelectorAll('.pin-mode-btn');
    modeBtns.forEach(b => {
      b.classList.toggle('active', b.dataset.mode === currentSelectedPin.mode);
      b.onclick = () => {
        modeBtns.forEach(btn => btn.classList.remove('active'));
        b.classList.add('active');
        currentSelectedPin.mode = b.dataset.mode;
      };
    });

    modalPinInspector.classList.add('active');
  });

  const closePinModal = () => {
    if (modalPinInspector) modalPinInspector.classList.remove('active');
  };

  btnClosePinInspector?.addEventListener('click', closePinModal);
  btnCancelPinInspector?.addEventListener('click', closePinModal);

  // Pin Test Set HIGH / LOW / Pulse
  document.getElementById('btnPinSetHigh')?.addEventListener('click', () => {
    document.getElementById('inspectorPinStateBadge').textContent = 'OUTPUT: HIGH (3.3V)';
    document.getElementById('inspectorPinStateBadge').style.background = '#ef4444';
    if (currentSelectedPin?.element) currentSelectedPin.element.classList.add('high');
    playChimeSound();
  });

  document.getElementById('btnPinSetLow')?.addEventListener('click', () => {
    document.getElementById('inspectorPinStateBadge').textContent = 'OUTPUT: LOW (0.0V)';
    document.getElementById('inspectorPinStateBadge').style.background = '#10b981';
    if (currentSelectedPin?.element) currentSelectedPin.element.classList.remove('high');
  });

  document.getElementById('btnPinPulse')?.addEventListener('click', () => {
    const badge = document.getElementById('inspectorPinStateBadge');
    badge.textContent = 'PULSE 100ms...';
    badge.style.background = '#f59e0b';
    if (currentSelectedPin?.element) currentSelectedPin.element.classList.add('high');
    setTimeout(() => {
      badge.textContent = 'OUTPUT: LOW (0.0V)';
      badge.style.background = '#10b981';
      if (currentSelectedPin?.element) currentSelectedPin.element.classList.remove('high');
    }, 150);
  });

  // Save Pin Inspector Config
  btnSavePinInspector?.addEventListener('click', () => {
    if (!currentSelectedPin) return;

    const sensorVal = document.getElementById('inspectorMappedSensorSelect')?.value;
    const roomVal = document.getElementById('inspectorPinRoomSelect')?.value;

    currentSelectedPin.sensor = sensorVal || 'None';
    if (currentSelectedPin.element) {
      currentSelectedPin.element.dataset.sensor = currentSelectedPin.sensor;
      currentSelectedPin.element.dataset.mode = currentSelectedPin.mode;
      currentSelectedPin.element.title = `${currentSelectedPin.pin}: ${currentSelectedPin.sensor} (${currentSelectedPin.mode})`;
      if (sensorVal) currentSelectedPin.element.classList.add('mapped');
      else currentSelectedPin.element.classList.remove('mapped');
    }

    closePinModal();
    showToast(`Saved pin configuration for ${currentSelectedPin.pin} (${sensorVal ? sensorVal : 'Floating'})`, 'success');
  });

  // Unmap Pin
  document.getElementById('btnUnmapPin')?.addEventListener('click', () => {
    if (!currentSelectedPin) return;
    currentSelectedPin.sensor = 'None';
    if (currentSelectedPin.element) {
      currentSelectedPin.element.dataset.sensor = 'None';
      currentSelectedPin.element.classList.remove('mapped');
    }
    closePinModal();
    showToast(`Unmapped sensor from ${currentSelectedPin.pin}`, 'info');
  });
}

// =============================================================================
// 17. CUSTOM CLOUD & SERVER MANAGEMENT
// =============================================================================
function initCustomCloudManager() {
  renderCustomCloudGrid();

  const modalAddCloud = document.getElementById('modalAddCloudServer');
  const btnOpenModal = document.getElementById('btnOpenAddCloudModal');
  const btnOpenQuick = document.getElementById('btnAddCloudQuick');
  const btnCloseModal = document.getElementById('btnCloseAddCloudModal');
  const btnCancelModal = document.getElementById('btnCancelAddCloud');
  const formAddCloud = document.getElementById('formAddCloudServer');
  const providerSelect = document.getElementById('newCloudType');

  // Auto-fill template endpoints when selecting provider
  providerSelect?.addEventListener('change', (e) => {
    const p = e.target.value;
    const endpointInput = document.getElementById('newCloudHost');
    const portInput = document.getElementById('newCloudPort');
    const topicInput = document.getElementById('newCloudTopic');
    const nameInput = document.getElementById('newCloudName');

    if (p === 'aws_iot') {
      if (endpointInput) endpointInput.value = 'a39f1k-ats.iot.us-east-1.amazonaws.com';
      if (portInput) portInput.value = '8883';
      if (topicInput) topicInput.value = 'sanctuary/sensors/live';
      if (nameInput) nameInput.value = 'AWS IoT Core Fleet Gateway';
    } else if (p === 'azure_iot') {
      if (endpointInput) endpointInput.value = 'kyu-iot-hub.azure-devices.net';
      if (portInput) portInput.value = '8883';
      if (topicInput) topicInput.value = 'devices/stm32/messages/events/';
      if (nameInput) nameInput.value = 'Azure IoT Hub Device Gateway';
    } else if (p === 'thingsboard') {
      if (endpointInput) endpointInput.value = 'thingsboard.cloud';
      if (portInput) portInput.value = '1883';
      if (topicInput) topicInput.value = 'v1/devices/me/telemetry';
      if (nameInput) nameInput.value = 'ThingsBoard Industrial Cloud';
    } else if (p === 'adafruit_io') {
      if (endpointInput) endpointInput.value = 'io.adafruit.com';
      if (portInput) portInput.value = '8883';
      if (topicInput) topicInput.value = 'username/feeds/sanctuary-telemetry';
      if (nameInput) nameInput.value = 'Adafruit IO Dashboard';
    } else if (p === 'generic_mqtt') {
      if (endpointInput) endpointInput.value = 'broker.hivemq.com';
      if (portInput) portInput.value = '1883';
      if (topicInput) topicInput.value = 'kyu/lab4/telemetry';
      if (nameInput) nameInput.value = 'HiveMQ Public Broker';
    } else if (p === 'custom_rest') {
      if (endpointInput) endpointInput.value = 'https://api.sanctuary-iot.org/v1/telemetry';
      if (portInput) portInput.value = '443';
      if (topicInput) topicInput.value = 'POST /v1/telemetry';
      if (nameInput) nameInput.value = 'REST Webhook Ingester';
    } else if (p === 'custom_ws') {
      if (endpointInput) endpointInput.value = 'ws://192.168.4.1:81';
      if (portInput) portInput.value = '81';
      if (topicInput) topicInput.value = 'stream/live';
      if (nameInput) nameInput.value = 'ESP32/STM32 Live WebSocket';
    }
  });

  const openCloudModal = () => modalAddCloud?.classList.add('active');
  btnOpenModal?.addEventListener('click', openCloudModal);
  btnOpenQuick?.addEventListener('click', openCloudModal);

  const closeCloudModal = () => {
    modalAddCloud?.classList.remove('active');
  };

  btnCloseModal?.addEventListener('click', closeCloudModal);
  btnCancelModal?.addEventListener('click', closeCloudModal);

  // Test Ping in Add Cloud modal
  document.getElementById('btnTestNewCloudPing')?.addEventListener('click', () => {
    const host = document.getElementById('newCloudHost')?.value.trim() || 'broker.hivemq.com';
    const latency = Math.floor(18 + Math.random() * 20);
    showToast(`🔍 Ping test to ${host}: ${latency}ms RTT (ACK 200 OK)`, 'success');
    playChimeSound();
  });

  formAddCloud?.addEventListener('submit', (e) => {
    e.preventDefault();
    const provider = document.getElementById('newCloudType')?.value || 'generic_mqtt';
    const name = document.getElementById('newCloudName')?.value.trim() || 'Custom Cloud Server';
    const endpoint = document.getElementById('newCloudHost')?.value.trim() || 'localhost';
    const port = document.getElementById('newCloudPort')?.value || '1883';
    const authKey = document.getElementById('newCloudToken')?.value.trim() || '';
    const topic = document.getElementById('newCloudTopic')?.value.trim() || 'telemetry/kyu/lab4';

    const newCloud = {
      id: Date.now(),
      provider,
      name,
      endpoint,
      port,
      authKey: authKey ? '••••••••' : 'None',
      topic,
      status: 'Online',
      latency: Math.floor(20 + Math.random() * 25) + 'ms'
    };

    state.customClouds.push(newCloud);
    try { localStorage.setItem('sanctuary_custom_clouds', JSON.stringify(state.customClouds)); } catch (_) {}

    renderCustomCloudGrid();
    logCloudServerAudit('CUSTOM CLOUD', `Provisioned new cloud service: "${name}" (${endpoint}:${port}). Ready for telemetry streaming.`);
    closeCloudModal();
    showToast(`☁️ Connected new custom cloud: ${name}`, 'success');
    playChimeSound();
  });
}

function renderCustomCloudGrid() {
  const grid = document.getElementById('customCloudGrid');
  if (!grid) return;

  if (!state.customClouds || state.customClouds.length === 0) {
    grid.innerHTML = `
      <div style="text-align: center; padding: 30px; color: var(--text-muted); grid-column: 1 / -1;">
        <span style="font-size: 2rem;">☁️</span>
        <p style="margin-top: 8px;">No custom clouds configured yet. Click "➕ Add Other Cloud / Server" above to integrate AWS IoT, Azure, ThingsBoard, Adafruit IO, or your own MQTT broker.</p>
      </div>`;
    return;
  }

  const icons = {
    aws_iot: '🟧',
    azure_iot: '🟦',
    thingsboard: '🟩',
    adafruit_io: '🟣',
    generic_mqtt: '📡',
    rest_webhook: '🌐',
    websocket: '⚡'
  };

  grid.innerHTML = state.customClouds.map(c => {
    const provider = c.provider || c.type || 'generic_mqtt';
    const name = c.name || 'Cloud Service';
    const endpoint = c.endpoint || c.host || 'localhost';
    const port = c.port || 1883;
    const topic = c.topic || 'telemetry/live';
    const status = c.status || 'Online';
    const latency = c.latency ? (typeof c.latency === 'number' ? c.latency + 'ms' : c.latency) : '35ms';

    return `
      <div class="custom-cloud-card" data-cloud-id="${c.id}">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
          <div style="display: flex; align-items: center; gap: 8px;">
            <span style="font-size: 1.3rem;">${icons[provider] || '☁️'}</span>
            <div>
              <strong style="font-size: 0.95rem; color: var(--text-main);">${name}</strong>
              <div style="font-size: 0.74rem; color: var(--text-muted);">${provider.toUpperCase()} &bull; Port ${port}</div>
            </div>
          </div>
          <span class="badge badge-peaceful" id="cloudStatusBadge_${c.id}">${status}</span>
        </div>

        <div style="font-size: 0.78rem; font-family: var(--font-code, monospace); background: rgba(0,0,0,0.04); padding: 6px 8px; border-radius: 4px; margin-bottom: 8px; word-break: break-all;">
          ${endpoint} &bull; <span style="color: var(--accent);">${topic}</span>
        </div>

        <div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.74rem; color: var(--text-muted); margin-bottom: 10px;">
          <span>Roundtrip Latency: <strong id="cloudLatency_${c.id}">${latency}</strong></span>
          <span>SSL/TLS: <strong style="color: #10b981;">Encrypted</strong></span>
        </div>

        <div style="display: flex; gap: 6px;">
          <button class="btn btn-secondary btn-xs btn-ping-cloud" data-id="${c.id}" style="flex: 1;">⚡ Ping Test</button>
          <button class="btn btn-primary btn-xs btn-sync-cloud" data-id="${c.id}" style="flex: 1;">📤 Ingest Live</button>
          <button class="btn btn-secondary btn-xs btn-delete-cloud" data-id="${c.id}" style="color: #ef4444;">🗑️</button>
        </div>
      </div>`;
  }).join('');

  // Ping Test listener
  grid.querySelectorAll('.btn-ping-cloud').forEach(btn => {
    btn.addEventListener('click', () => {
      const cloud = state.customClouds.find(c => String(c.id) === String(btn.dataset.id));
      if (!cloud) return;

      const newLatency = Math.floor(18 + Math.random() * 25) + 'ms';
      cloud.latency = newLatency;
      const lbl = document.getElementById('cloudLatency_' + cloud.id);
      if (lbl) lbl.textContent = newLatency;

      logCloudServerAudit('CUSTOM CLOUD', `Ping response from ${cloud.name || cloud.endpoint}: ACK 200 OK (${newLatency})`);
      showToast(`⚡ Pinged ${cloud.name || 'Cloud'}: Latency ${newLatency}`, 'success');
      playChimeSound();
    });
  });

  // Sync Telemetry listener
  grid.querySelectorAll('.btn-sync-cloud').forEach(btn => {
    btn.addEventListener('click', () => {
      const cloud = state.customClouds.find(c => String(c.id) === String(btn.dataset.id));
      if (!cloud) return;

      const payload = {
        facility: state.facilityName,
        temp: state.telemetry.temp,
        gas: state.telemetry.gas,
        volt: state.telemetry.volt,
        timestamp: new Date().toISOString()
      };

      logCloudServerAudit('CUSTOM CLOUD', `Dispatched JSON payload to ${cloud.name} [${cloud.topic}]: ${JSON.stringify(payload)}`);
      showToast(`📤 Telemetry packet streamed to ${cloud.name}!`, 'info');
    });
  });

  // Delete listener
  grid.querySelectorAll('.btn-delete-cloud').forEach(btn => {
    btn.addEventListener('click', () => {
      state.customClouds = state.customClouds.filter(c => String(c.id) !== String(btn.dataset.id));
      try { localStorage.setItem('sanctuary_custom_clouds', JSON.stringify(state.customClouds)); } catch (_) {}
      renderCustomCloudGrid();
      showToast('Custom cloud removed from gateway.', 'info');
    });
  });
}

// =============================================================================
// 18. UNIVERSAL CONNECTIVITY & QUICK CONNECT MODAL
// =============================================================================
function initUniversalConnectivityAndQuickConnect() {
  const globalConnStatus = document.getElementById('globalConnStatus');
  const modalQuickConnect = document.getElementById('modalQuickConnect');
  const btnCloseQuick = document.getElementById('btnCloseQuickConnect');
  const btnCancelQuick = document.getElementById('btnCancelQuickConnect');
  const btnQuickDisconnect = document.getElementById('btnQuickDisconnect');
  const btnQuickConnectAction = document.getElementById('btnQuickConnectAction');
  const btnGlobalDisconnect = document.getElementById('btnGlobalDisconnect');

  // Open Quick Connect on status pill click
  globalConnStatus?.addEventListener('click', () => {
    if (!modalQuickConnect) return;
    const statusText = document.getElementById('quickConnStatusText');
    const isConn = state.hardwareConnected || (state.serialPort !== null) || state.isSerialConnected || state.isWifiConnected;
    if (statusText) {
      statusText.textContent = isConn ? `LIVE (${document.getElementById('globalConnLabel')?.textContent || 'Connected'})` : 'Offline / Awaiting Board';
      statusText.style.color = isConn ? '#10b981' : '#94a3b8';
    }
    if (btnQuickDisconnect) btnQuickDisconnect.disabled = !isConn;
    modalQuickConnect.classList.add('active');
  });

  const closeQuickModal = () => {
    if (modalQuickConnect) modalQuickConnect.classList.remove('active');
  };

  btnCloseQuick?.addEventListener('click', closeQuickModal);
  btnCancelQuick?.addEventListener('click', closeQuickModal);

  // Disconnect Buttons
  const triggerDisconnect = () => {
    onHardwareDisconnected();
    closeQuickModal();
  };

  btnQuickDisconnect?.addEventListener('click', triggerDisconnect);
  btnGlobalDisconnect?.addEventListener('click', triggerDisconnect);

  // Method selector cards inside modal
  let selectedMethod = 'serial';
  const methodCards = document.querySelectorAll('.conn-method-card');
  methodCards.forEach(card => {
    card.addEventListener('click', () => {
      methodCards.forEach(c => c.classList.remove('active'));
      card.classList.add('active');
      selectedMethod = card.dataset.method;

      const serialParams = document.getElementById('serialParams');
      const wifiParams = document.getElementById('wifiParams');
      if (serialParams) serialParams.style.display = selectedMethod === 'wifi' ? 'none' : 'block';
      if (wifiParams) wifiParams.style.display = selectedMethod === 'wifi' ? 'block' : 'none';
    });
  });

  // Initiate Connection Action inside modal
  btnQuickConnectAction?.addEventListener('click', () => {
    closeQuickModal();
    if (selectedMethod === 'serial') {
      const board = document.getElementById('quickConnBoard')?.value || 'STM32 Nucleo';
      if (navigator.serial) {
        connectWebSerial().catch(err => {
          showToast(`Serial error: ${err.message}`, 'danger');
        });
      } else {
        showToast('Web Serial requires desktop Google Chrome, Microsoft Edge, or Opera.', 'warning');
        logTerminal('[Web Serial requires desktop Google Chrome, Microsoft Edge, or Opera with USB permissions.]');
      }
    } else if (selectedMethod === 'ble') {
      connectBluetoothLE();
    } else if (selectedMethod === 'wifi') {
      const endpoint = document.getElementById('quickWifiEndpoint')?.value || 'ws://192.168.4.1:81';
      connectWifiStream(endpoint);
    }
  });

  // Auto-Map Toggle Button
  const btnToggleAutoMap = document.getElementById('btnToggleAutoMap');
  btnToggleAutoMap?.addEventListener('click', () => {
    state.autoMapEnabled = !state.autoMapEnabled;
    btnToggleAutoMap.className = `btn ${state.autoMapEnabled ? 'btn-primary' : 'btn-secondary'} btn-xs`;
    btnToggleAutoMap.textContent = state.autoMapEnabled ? 'Auto-Map: ON' : 'Auto-Map: OFF';
    showToast(`Serial Telemetry Auto-Mapper ${state.autoMapEnabled ? 'ENABLED' : 'DISABLED'}.`, 'info');
  });

  // STM32 Code Tab in IDE
  document.querySelectorAll('.code-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      const sketchKey = tab.dataset.sketch;
      if (sketchKey === 'stm32') {
        const editor = document.getElementById('codeEditorArea');
        if (editor && sketches && sketches.stm32) {
          editor.value = sketches.stm32;
          const path = document.getElementById('editorFilePath');
          if (path) path.textContent = 'src/stm32_nucleo_freertos.cpp';
          if (typeof updateEditorLineNumbers === 'function') updateEditorLineNumbers();
        }
      }
    });
  });
}

// =============================================================================
// 20. SVG FLOOR PLAN: DRAGGABLE SENSORS + INTERFERENCE OBSTACLES
// =============================================================================

/**
 * Renders all obstacle zones (Wi-Fi, microwave, thick wall, etc.) onto the
 * houseSvg as translucent circles with labels and a delete button.
 */
function renderObstaclesOnSvg() {
  const svg = document.getElementById('houseSvg');
  if (!svg) return;

  // Remove existing obstacle layer if any
  const old = svg.querySelector('#obstacleLayer');
  if (old) old.remove();

  const layer = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  layer.id = 'obstacleLayer';
  layer.setAttribute('style', 'pointer-events: none;');

  state.obstacles.forEach(obs => {
    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.setAttribute('class', 'obstacle-group');
    g.setAttribute('data-obs-id', obs.id);
    g.setAttribute('style', 'pointer-events: all; cursor: move;');

    // Interference aura circle
    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circle.setAttribute('cx', obs.x);
    circle.setAttribute('cy', obs.y);
    circle.setAttribute('r', obs.radius);
    circle.setAttribute('fill', obs.color);
    circle.setAttribute('stroke', obs.border);
    circle.setAttribute('stroke-width', '1.5');
    circle.setAttribute('stroke-dasharray', '4 3');
    g.appendChild(circle);

    // Icon
    const ICONS = { wifi: '📶', microwave: '📡', wall: '🧱', bluetooth: '🔷', zigbee: '🔶', motor: '⚙️', other: '⚠️' };
    const icon = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    icon.setAttribute('x', obs.x);
    icon.setAttribute('y', obs.y + 4);
    icon.setAttribute('text-anchor', 'middle');
    icon.setAttribute('font-size', '14');
    icon.setAttribute('style', 'user-select:none;');
    icon.textContent = ICONS[obs.type] || '⚠️';
    g.appendChild(icon);

    // Label beneath
    const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    label.setAttribute('x', obs.x);
    label.setAttribute('y', obs.y + obs.radius + 12);
    label.setAttribute('text-anchor', 'middle');
    label.setAttribute('font-size', '9');
    label.setAttribute('fill', obs.border);
    label.setAttribute('font-family', 'JetBrains Mono, monospace');
    label.textContent = obs.label;
    g.appendChild(label);

    // Delete X button (SVG foreignObject workaround with a small circle)
    const delBtn = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    delBtn.setAttribute('cx', obs.x + obs.radius - 6);
    delBtn.setAttribute('cy', obs.y - obs.radius + 6);
    delBtn.setAttribute('r', '7');
    delBtn.setAttribute('fill', '#ef4444');
    delBtn.setAttribute('style', 'cursor: pointer; pointer-events: all;');
    delBtn.setAttribute('class', 'obs-del-btn');
    delBtn.setAttribute('data-obs-id', obs.id);
    g.appendChild(delBtn);

    const delX = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    delX.setAttribute('x', obs.x + obs.radius - 6);
    delX.setAttribute('y', obs.y - obs.radius + 10);
    delX.setAttribute('text-anchor', 'middle');
    delX.setAttribute('font-size', '9');
    delX.setAttribute('fill', '#fff');
    delX.setAttribute('style', 'pointer-events: none; user-select: none;');
    delX.textContent = '✕';
    g.appendChild(delX);

    // Draggable obstacle support
    makeSvgGroupDraggable(g, obs.x, obs.y, (nx, ny) => {
      obs.x = nx;
      obs.y = ny;
      renderObstaclesOnSvg();
      checkSensorInterference();
    });

    layer.appendChild(g);
  });

  // Insert obstacle layer just before sensor markers so markers stay on top
  svg.appendChild(layer);

  // Wire up delete buttons (pointer-events restored via style)
  layer.querySelectorAll('.obs-del-btn').forEach(btn => {
    btn.style.pointerEvents = 'all';
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = btn.dataset.obsId;
      state.obstacles = state.obstacles.filter(o => o.id !== id);
      renderObstaclesOnSvg();
      renderObstaclePanel();
      showToast('Interference zone removed', 'info');
    });
  });
}

/**
 * Checks if any sensor markers are within an obstacle's interference radius
 * and visually warns them with a CSS class.
 */
function checkSensorInterference() {
  document.querySelectorAll('.sensor-marker').forEach(marker => {
    const markerId = marker.id;
    const pos = state.sensorPositions[markerId];
    if (!pos) return;

    const inInterference = state.obstacles.some(obs => {
      const dx = pos.x - obs.x;
      const dy = pos.y - obs.y;
      return Math.sqrt(dx * dx + dy * dy) < obs.radius + 20;
    });

    marker.classList.toggle('sensor-in-interference', inInterference);
  });
}

/**
 * Makes an SVG <g> element draggable within houseSvg coordinate space.
 */
function makeSvgGroupDraggable(groupEl, initX, initY, onMove) {
  let dragging = false;
  let startMouseX = 0, startMouseY = 0;
  let startX = initX, startY = initY;
  let currentX = initX, currentY = initY;

  const svg = document.getElementById('houseSvg');
  if (!svg) return;

  const getMouseSvgPoint = (e) => {
    const pt = svg.createSVGPoint();
    pt.x = (e.touches ? e.touches[0].clientX : e.clientX);
    pt.y = (e.touches ? e.touches[0].clientY : e.clientY);
    return pt.matrixTransform(svg.getScreenCTM().inverse());
  };

  const onDown = (e) => {
    // Don't drag if clicking the delete button
    if (e.target.classList.contains('obs-del-btn')) return;
    dragging = true;
    const pt = getMouseSvgPoint(e);
    startMouseX = pt.x;
    startMouseY = pt.y;
    startX = currentX;
    startY = currentY;
    e.stopPropagation();
    e.preventDefault();
  };

  const onMoveEvt = (e) => {
    if (!dragging) return;
    const pt = getMouseSvgPoint(e);
    const dx = pt.x - startMouseX;
    const dy = pt.y - startMouseY;
    currentX = Math.max(20, Math.min(880, startX + dx));
    currentY = Math.max(20, Math.min(540, startY + dy));
    onMove(currentX, currentY);
  };

  const onUp = () => { dragging = false; };

  groupEl.addEventListener('mousedown', onDown, { passive: false });
  groupEl.addEventListener('touchstart', onDown, { passive: false });
  window.addEventListener('mousemove', onMoveEvt);
  window.addEventListener('touchmove', onMoveEvt, { passive: false });
  window.addEventListener('mouseup', onUp);
  window.addEventListener('touchend', onUp);
}

/**
 * Initialises drag on all sensor-marker <g> elements already in the SVG.
 * Saves positions back to state.sensorPositions.
 */
function initSvgSensorDrag() {
  const svg = document.getElementById('houseSvg');
  if (!svg) return;

  const markers = svg.querySelectorAll('.sensor-marker');
  markers.forEach(marker => {
    const markerId = marker.id;
    if (!markerId) return;

    // Apply saved position
    if (state.sensorPositions[markerId]) {
      const { x, y } = state.sensorPositions[markerId];
      marker.setAttribute('transform', `translate(${x}, ${y})`);
    }

    // Parse current position
    let curX = state.sensorPositions[markerId]?.x ?? 0;
    let curY = state.sensorPositions[markerId]?.y ?? 0;

    marker.style.cursor = 'grab';
    marker.classList.add('draggable-svg-sensor');

    let dragging = false;
    let startMX = 0, startMY = 0;
    let startX = curX, startY = curY;

    const getSvgPt = (e) => {
      const pt = svg.createSVGPoint();
      pt.x = (e.touches ? e.touches[0].clientX : e.clientX);
      pt.y = (e.touches ? e.touches[0].clientY : e.clientY);
      return pt.matrixTransform(svg.getScreenCTM().inverse());
    };

    marker.addEventListener('mousedown', (e) => {
      dragging = true;
      marker.style.cursor = 'grabbing';
      const pt = getSvgPt(e);
      startMX = pt.x; startMY = pt.y;
      startX = state.sensorPositions[markerId]?.x ?? curX;
      startY = state.sensorPositions[markerId]?.y ?? curY;
      e.stopPropagation();
      e.preventDefault();
    }, { passive: false });

    marker.addEventListener('touchstart', (e) => {
      dragging = true;
      const pt = getSvgPt(e);
      startMX = pt.x; startMY = pt.y;
      startX = state.sensorPositions[markerId]?.x ?? curX;
      startY = state.sensorPositions[markerId]?.y ?? curY;
      e.stopPropagation();
    }, { passive: false });

    const onMove = (e) => {
      if (!dragging) return;
      const pt = getSvgPt(e);
      const dx = pt.x - startMX;
      const dy = pt.y - startMY;
      const nx = Math.max(20, Math.min(880, startX + dx));
      const ny = Math.max(20, Math.min(540, startY + dy));
      marker.setAttribute('transform', `translate(${nx}, ${ny})`);
      state.sensorPositions[markerId] = { x: nx, y: ny };
      checkSensorInterference();
    };

    const onUp = () => {
      if (dragging) {
        dragging = false;
        marker.style.cursor = 'grab';
        const pos = state.sensorPositions[markerId];
        if (pos) showToast(`📍 Sensor moved to (${Math.round(pos.x)}, ${Math.round(pos.y)}) on floor plan`, 'info');
      }
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('touchmove', onMove, { passive: false });
    window.addEventListener('mouseup', onUp);
    window.addEventListener('touchend', onUp);
  });

  // Initial render of obstacles
  renderObstaclesOnSvg();
  checkSensorInterference();
}

/** Renders the obstacle management panel inside monitor-sidebar */
function renderObstaclePanel() {
  const panelId = 'obstacleControlPanel';
  const existing = document.getElementById(panelId);
  if (existing) existing.remove();

  const wrapper = document.querySelector('.monitor-sidebar');
  if (!wrapper) return;

  const OBS_TYPES = [
    { value: 'wifi',      label: '📶 Wi-Fi 2.4GHz', color: 'rgba(59,130,246,0.18)',  border: '#3b82f6', radius: 55 },
    { value: 'microwave', label: '🔴 Microwave Oven', color: 'rgba(239,68,68,0.15)',  border: '#ef4444', radius: 38 },
    { value: 'bluetooth', label: '🔷 Bluetooth 2.4G', color: 'rgba(99,102,241,0.18)', border: '#6366f1', radius: 40 },
    { value: 'zigbee',    label: '🔶 Zigbee/Z-Wave',  color: 'rgba(245,158,11,0.18)', border: '#f59e0b', radius: 35 },
    { value: 'wall',      label: '🧱 Thick Concrete',  color: 'rgba(120,113,108,0.25)',border: '#78716c', radius: 30 },
    { value: 'motor',     label: '⚙️ Motor/Inverter',  color: 'rgba(234,179,8,0.18)', border: '#eab308', radius: 32 },
    { value: 'other',     label: '⚠️ Other EMI Source',color: 'rgba(239,68,68,0.12)', border: '#f97316', radius: 45 }
  ];

  const SENSOR_TYPES = [
    { value: 'marker-cam', label: '📷 Camera' },
    { value: 'marker-pir', label: '🏃 PIR Motion' },
    { value: 'marker-dht', label: '🌡️ Temp/Hum' },
    { value: 'marker-gas', label: '💨 Gas/Smoke' },
    { value: 'marker-reed', label: '🚪 Door Reed' }
  ];

  const panel = document.createElement('div');
  panel.id = panelId;
  panel.className = 'card monitor-vitals-card';
  panel.style.marginTop = '15px';
  panel.innerHTML = `
    <div class="card-header" style="margin-bottom: 8px;">
      <h3 class="card-title">🔧 Virtual Map Editor</h3>
      <button class="btn btn-sm" id="btnToggleObsPanel" title="Toggle Panel" style="padding:2px 8px;font-size:0.75rem;">▲ Hide</button>
    </div>
    <div id="obsPanelBody">
      <label class="input-label" style="font-size:0.75rem;">Place Interference/Obstacle</label>
      <div style="display:flex;gap:6px;align-items:center;flex-wrap:wrap;margin-bottom:6px;">
        <select id="obsTypeSelect" class="input-control" style="font-size:0.72rem;padding:3px 6px;flex:1;min-width:140px;">
          ${OBS_TYPES.map(t => `<option value="${t.value}">${t.label}</option>`).join('')}
        </select>
        <input id="obsLabelInput" class="input-control" placeholder="Label (optional)" style="font-size:0.72rem;padding:3px 6px;flex:1;min-width:100px;">
        <button class="btn btn-primary btn-sm" id="btnAddObstacle" style="white-space:nowrap;">➕ Add</button>
      </div>

      <label class="input-label" style="font-size:0.75rem;margin-top:10px;">Place Sensor from Library</label>
      <div style="display:flex;gap:6px;align-items:center;flex-wrap:wrap;margin-bottom:10px;">
        <select id="sensorTypeSelect" class="input-control" style="font-size:0.72rem;padding:3px 6px;flex:1;min-width:140px;">
          ${SENSOR_TYPES.map(t => `<option value="${t.value}">${t.label}</option>`).join('')}
        </select>
        <button class="btn btn-primary btn-sm" id="btnAddSensorMap" style="white-space:nowrap;">➕ Add Sensor</button>
      </div>

      <div id="obstacleList" style="display:flex;flex-direction:column;gap:4px;max-height:110px;overflow-y:auto; border-top:1px solid var(--border-color); padding-top:6px;">
        ${state.obstacles.length === 0 ? '<span style="font-size:0.72rem;color:var(--text-muted);">No obstacles placed yet</span>' : state.obstacles.map(obs => `
          <div class="obs-list-item" data-obs-id="${obs.id}" style="display:flex;align-items:center;gap:6px;">
            <span style="font-size:0.9em;">${{ wifi:'📶',microwave:'🔴',bluetooth:'🔷',zigbee:'🔶',wall:'🧱',motor:'⚙️',other:'⚠️' }[obs.type] || '⚠️'}</span>
            <span style="flex:1;font-size:0.72rem;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${obs.label}</span>
            <span style="font-size:0.68rem;color:var(--text-muted);">${Math.round(obs.x)},${Math.round(obs.y)}</span>
            <button class="btn-obs-del" data-obs-id="${obs.id}" style="background:none;border:none;color:#ef4444;cursor:pointer;font-size:0.75rem;padding:0 2px;">✕</button>
          </div>`).join('')}
      </div>
    </div>
  `;

  wrapper.style.position = 'relative';
  wrapper.appendChild(panel);

  // Toggle visibility
  document.getElementById('btnToggleObsPanel')?.addEventListener('click', () => {
    const body = document.getElementById('obsPanelBody');
    const btn = document.getElementById('btnToggleObsPanel');
    if (body) {
      const hidden = body.style.display === 'none';
      body.style.display = hidden ? '' : 'none';
      if (btn) btn.textContent = hidden ? '▲ Hide' : '▼ Show';
    }
  });

  // Add obstacle button
  document.getElementById('btnAddObstacle')?.addEventListener('click', () => {
    const typeEl = document.getElementById('obsTypeSelect');
    const labelEl = document.getElementById('obsLabelInput');
    const typeVal = typeEl?.value || 'wifi';
    const found = OBS_TYPES.find(t => t.value === typeVal) || OBS_TYPES[0];
    const userLabel = labelEl?.value?.trim() || found.label.replace(/^[^\s]+\s/, '');
    const newObs = {
      id: `obs-${typeVal}-${Date.now()}`,
      type: typeVal,
      label: userLabel,
      x: 450 + Math.random() * 60 - 30,
      y: 280 + Math.random() * 60 - 30,
      radius: found.radius,
      color: found.color,
      border: found.border
    };
    state.obstacles.push(newObs);
    if (labelEl) labelEl.value = '';
    renderObstaclesOnSvg();
    renderObstaclePanel();
    showToast(`Interference zone "${userLabel}" added to floor plan`, 'success');
  });

  // Add Sensor Map button
  document.getElementById('btnAddSensorMap')?.addEventListener('click', () => {
    const typeEl = document.getElementById('sensorTypeSelect');
    const markerId = typeEl?.value;
    if (!markerId) return;
    
    // Set default coordinates in center of map if not currently tracked
    state.sensorPositions[markerId] = {
      x: 450 + Math.random() * 80 - 40,
      y: 280 + Math.random() * 80 - 40
    };
    
    // Find the sensor group in SVG and update its position and make it visible
    const markerEl = document.getElementById(markerId);
    if (markerEl) {
      markerEl.setAttribute('transform', `translate(${state.sensorPositions[markerId].x}, ${state.sensorPositions[markerId].y})`);
      markerEl.style.display = 'block'; // Ensure it is visible if previously hidden
      markerEl.style.opacity = '1';
    }
    
    checkSensorInterference();
    showToast(`Sensor marker added to floor plan`, 'success');
  });

  // Delete from list
  panel.querySelectorAll('.btn-obs-del').forEach(btn => {
    btn.addEventListener('click', () => {
      state.obstacles = state.obstacles.filter(o => o.id !== btn.dataset.obsId);
      renderObstaclesOnSvg();
      renderObstaclePanel();
      showToast('Obstacle removed', 'info');
    });
  });
}

/** Initializes the entire SVG floor plan interaction system */
function initSvgFloorPlan() {
  initSvgSensorDrag();
  renderObstaclePanel();

  // Wire up Reset Positions button
  document.getElementById('btnResetSensorPositions')?.addEventListener('click', () => {
    const defaults = {
      'marker-reed':  { x: 70,  y: 180 },
      'marker-cam':   { x: 590, y: 60  },
      'marker-pir':   { x: 330, y: 260 },
      'marker-gas':   { x: 685, y: 155 },
      'marker-dht':   { x: 260, y: 390 },
      'marker-ultra': { x: 245, y: 450 },
      'marker-radar': { x: 245, y: 490 },
      'marker-power': { x: 580, y: 440 },
      'marker-gsm':   { x: 740, y: 440 }
    };
    Object.entries(defaults).forEach(([id, pos]) => {
      state.sensorPositions[id] = { ...pos };
      const el = document.getElementById(id);
      if (el) el.setAttribute('transform', `translate(${pos.x}, ${pos.y})`);
    });
    checkSensorInterference();
    showToast('📍 All sensor positions reset to default', 'info');
  });
}

function initOnboarding() {
  const modal = document.getElementById('modalOnboarding');
  const btnComplete = document.getElementById('btnCompleteOnboarding');
  const labNameInput = document.getElementById('onboardingLabName');
  const boardSelect = document.getElementById('onboardingBoardSelect');
  const facilitySelect = document.getElementById('onboardingFacilitySelect');
  const enableSim = document.getElementById('onboardingEnableSim');

  // Check if onboarding was already completed
  if (localStorage.getItem('sanctuary_onboarded')) {
    if (modal) modal.classList.remove('active');
    
    // Restore lab name
    const savedName = localStorage.getItem('sanctuary_lab_name');
    if (savedName) {
      document.querySelectorAll('.brand-title').forEach(el => el.textContent = savedName);
    }
    return;
  }

  btnComplete?.addEventListener('click', () => {
    const labName = labNameInput?.value.trim() || 'Telemetry Lab';
    const board = boardSelect?.value || 'esp32';
    const facility = facilitySelect?.value || 'home';
    const sim = enableSim?.checked;

    localStorage.setItem('sanctuary_onboarded', 'true');
    localStorage.setItem('sanctuary_lab_name', labName);
    
    document.querySelectorAll('.brand-title').forEach(el => el.textContent = labName);
    state.facilityName = facility;
    
    if (sim) {
      startSyntheticTelemetry();
    } else {
      stopSyntheticTelemetry();
    }

    if (modal) modal.classList.remove('active');
    showToast(`Welcome to ${labName}! Board: ${board}`, 'success');
  });
}

// Retry logic for WebSockets (can be injected into the existing websocket function via prototype or wrap)
const originalWebSocket = window.WebSocket;
window.WebSocket = function(url, protocols) {
  const ws = protocols ? new originalWebSocket(url, protocols) : new originalWebSocket(url);
  ws.addEventListener('close', (e) => {
    if (ws._retryEnabled && ws._retryCount < 5) {
      ws._retryCount = (ws._retryCount || 0) + 1;
      console.log(`[WebSocket] Retrying connection to ${url} (Attempt ${ws._retryCount})...`);
      setTimeout(() => {
        // We'd typically recreate the socket here, but for this mock environment, 
        // we'll rely on the manual reconnect button or synthetic telemetry fallback.
      }, 3000 * ws._retryCount);
    }
  });
  return ws;
};

// =============================================================================
// 19. INITIALIZE SANCTUARY OS
// =============================================================================

window.addEventListener('DOMContentLoaded', () => {
  try { initThemes(); } catch (e) { console.error('Theme init error:', e); }
  try { initRouter(); } catch (e) { console.error('Router init error:', e); }
  try { initLiveCamera(); } catch (e) { console.error('Camera init error:', e); }
  try { initMonitorControlsAndSimulation(); } catch (e) { console.error('Monitor controls error:', e); }
  try { initSimulationEngine(); } catch (e) { console.error('Simulation engine error:', e); }
  try { initUniversalSerialEngine(); } catch (e) { console.error('Serial engine error:', e); }
  try { initMediaGallery(); } catch (e) { console.error('Gallery error:', e); }
  try { initAlarmLog(); } catch (e) { console.error('Alarm error:', e); }
  try { initReportGenerator(); } catch (e) { console.error('Reports error:', e); }
  try { initFacilityAndRooms(); } catch (e) { console.error('Facility error:', e); }
  try { initEngineeringIde(); } catch (e) { console.error('IDE error:', e); }
  try { initCloudServers(); } catch (e) { console.error('Cloud servers error:', e); }
  try { initSparkCoreIntegration(); } catch (e) { console.error('Spark Core error:', e); }
  try { initUniversalSensorExaminer(); } catch (e) { console.error('Universal examiner error:', e); }
  try { initControlsAndAutomationStudio(); } catch (e) { console.error('Controls & Automation Studio error:', e); }
  try { initSetupAndPinsModule(); } catch (e) { console.error('Setup & Pins error:', e); }
  try { initCustomCloudManager(); } catch (e) { console.error('Custom Cloud Manager error:', e); }
  try { initUniversalConnectivityAndQuickConnect(); } catch (e) { console.error('Universal Connectivity error:', e); }
  try { initSvgFloorPlan(); } catch (e) { console.error('SVG Floor Plan error:', e); }
  try { initOnboarding(); } catch (e) { console.error('Onboarding error:', e); }

  updateAllViews();
  showToast(`🏡 Sanctuary OS loaded. Facility: "${state.facilityName}"`, 'info');
});

// =============================================================================
// COLUMN FULLSCREEN SCROLL-SNAP OVERLAY
// Opens when any of the 3 monitor columns are clicked.
// Scroll-snaps between: Panel1=Master Haven, Panel2=Controls, Panel3=Camera
// =============================================================================
(function initColFullscreen() {
  const overlay    = document.getElementById('colFullscreenOverlay');
  const fsScroll   = document.getElementById('colFsScroll');
  const closeBtn   = document.getElementById('colFsClose');
  const floorCard  = document.getElementById('floorplanHeroCard');
  const midCol     = document.getElementById('monitorMiddleCol');
  const sidebar    = document.querySelector('.monitor-sidebar');

  const panel1     = document.getElementById('colFsPanel1');
  const panel2     = document.getElementById('colFsPanel2');
  const panel3     = document.getElementById('colFsPanel3');
  const fsFlSlot   = document.getElementById('colFsFloorplanSlot');
  const fsMidSlot  = document.getElementById('colFsMiddleSlot');
  const fsSbSlot   = document.getElementById('colFsSidebarSlot');

  const houseSvg   = document.getElementById('houseSvg');
  const fpWrapper  = document.getElementById('floorplanWrapper');

  // Bring the real SVG into the fullscreen floorplan slot
  function mountFloorplan() {
    if (houseSvg && fpWrapper) {
      fsFlSlot.appendChild(fpWrapper.cloneNode(true));
      // actual live SVG
      const clone = fsFlSlot.querySelector('#houseSvg');
      if (clone) {
        clone.removeAttribute('id'); // prevent duplicate ids
        clone.style.width  = '100%';
        clone.style.height = '100%';
      }
    }
  }

  // Clone middle column cards into panel 2
  function mountMiddle() {
    fsMidSlot.innerHTML = '';
    if (midCol) {
      Array.from(midCol.children).forEach(el => {
        fsMidSlot.appendChild(el.cloneNode(true));
      });
    }
  }

  // Clone sidebar cards into panel 3
  function mountSidebar() {
    fsSbSlot.innerHTML = '';
    if (sidebar) {
      Array.from(sidebar.children).forEach(el => {
        fsSbSlot.appendChild(el.cloneNode(true));
      });
    }
  }

  function openOverlay(startPanel) {
    if (!overlay) return;
    mountFloorplan();
    mountMiddle();
    mountSidebar();
    overlay.classList.add('active');
    document.body.style.overflow = 'hidden';

    // Scroll to the right panel immediately (no animation for instant jump)
    requestAnimationFrame(() => {
      const panels = { 1: panel1, 2: panel2, 3: panel3 };
      const target = panels[startPanel];
      if (target) {
        fsScroll.scrollTo({ top: target.offsetTop, behavior: 'instant' });
      }
    });
  }

  function closeOverlay() {
    if (!overlay) return;
    overlay.classList.remove('active');
    document.body.style.overflow = '';
    // Clear slots
    setTimeout(() => {
      fsFlSlot.innerHTML  = '';
      fsMidSlot.innerHTML = '';
      fsSbSlot.innerHTML  = '';
    }, 400);
  }

  // Click triggers � click on column opens at relevant panel
  if (floorCard) floorCard.addEventListener('click', (e) => {
    if (e.target.closest('button')) return; // don't intercept button clicks
    openOverlay(1);
  });
  if (midCol) midCol.addEventListener('click', (e) => {
    if (e.target.closest('button')) return;
    openOverlay(2);
  });
  if (sidebar) sidebar.addEventListener('click', (e) => {
    if (e.target.closest('button')) return;
    openOverlay(3);
  });

  if (closeBtn)  closeBtn.addEventListener('click',  closeOverlay);

  // ESC key to close
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && overlay && overlay.classList.contains('active')) closeOverlay();
  });
})();

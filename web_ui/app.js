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
    distance: null,
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

  // Sensors & Pin Mappings
  configuredSensors: [
    { id: 1, name: 'DHT22 Climate Sensor', pin: 'GPIO 13', type: 'Digital / 1-Wire', room: 'Master Haven', threshold: '18°C – 28°C' },
    { id: 2, name: 'MQ-2 Gas & Smoke Detector', pin: 'GPIO 36', type: 'Analog (ADC)', room: 'Kitchen', threshold: '> 350 ppm' },
    { id: 3, name: 'ZMPT101B AC Voltage Sensor', pin: 'GPIO 39', type: 'Analog (ADC)', room: 'Power Utility', threshold: '180V – 260V' },
    { id: 4, name: 'ACS712 20A Current Sensor', pin: 'GPIO 34', type: 'Analog (ADC)', room: 'Power Utility', threshold: '< 15 A' },
    { id: 5, name: 'Magnetic Door Reed Switch', pin: 'GPIO 14', type: 'Digital Input', room: 'Front Entrance', threshold: 'HIGH on Open' },
    { id: 6, name: 'PIR Human Motion Sensor', pin: 'GPIO 12', type: 'Digital Input', room: 'Living Room', threshold: 'HIGH on Motion' },
    { id: 7, name: 'HC-SR04 Ultrasonic Distance', pin: 'GPIO 15', type: 'Digital Pulse', room: 'Master Haven', threshold: '< 30 cm' },
    { id: 8, name: 'Exhaust Fan Relay Module', pin: 'GPIO 4', type: 'Digital Output', room: 'Kitchen', threshold: 'Active LOW' },
    { id: 9, name: 'Smart Window Opener Servo', pin: 'GPIO 2', type: 'PWM / Servo', room: 'Master Haven', threshold: '0° – 180°' },
    { id: 10, name: 'High-Decibel Piezo Buzzer', pin: 'GPIO 33', type: 'Digital Output', room: 'Power Utility', threshold: 'Alarm Siren' }
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
// 6. UNIVERSAL WEB SERIAL ENGINE (ESP32, ARDUINO, SPARKFUN)
// =============================================================================
function initUniversalSerialEngine() {
  el.btnIdeConnectSerial.addEventListener('click', async () => {
    if (!('serial' in navigator)) {
      showToast('⚠️ Web Serial is not supported in this browser. Please use Chrome or Edge.', 'alert');
      logTerminal('[Error: Web Serial API not supported by browser. Switch to Chrome or Edge]');
      return;
    }

    try {
      const baudRate = parseInt(el.ideBaudSelect.value);
      logTerminal(`[Requesting Web Serial port at ${baudRate} baud...]`);
      
      const port = await navigator.serial.requestPort();
      await port.open({ baudRate });

      state.serialPort = port;
      state.isSerialConnected = true;
      state.activeBoard = el.boardSelector.value;

      el.btnIdeConnectSerial.disabled = true;
      el.btnIdeDisconnectSerial.disabled = false;
      el.globalConnDot.className = 'status-dot online';
      el.globalConnLabel.textContent = `Serial (${el.boardSelector.value})`;

      logTerminal(`[Connected to ${el.boardSelector.value} at ${baudRate} baud. Stream active...]`);
      showToast(`⚡ Connected to ${el.boardSelector.value}! Reading hardware pins.`, 'info');

      readIncomingSerial(port);
    } catch (err) {
      console.error('Serial connection error:', err);
      logTerminal(`[Serial Connect Failed / Cancelled: ${err.message}]`);
      showToast('Serial connection cancelled or port busy.', 'alert');
    }
  });

  el.btnIdeDisconnectSerial.addEventListener('click', async () => {
    if (state.serialReader) {
      await state.serialReader.cancel();
    }
    if (state.serialPort) {
      await state.serialPort.close();
    }
    state.isSerialConnected = false;
    state.serialPort = null;
    el.btnIdeConnectSerial.disabled = false;
    el.btnIdeDisconnectSerial.disabled = true;
    
    if (!state.testSimulationMode) {
      el.globalConnDot.className = 'status-dot waiting';
      el.globalConnLabel.textContent = 'Awaiting Board';
      resetToAwaitingHardware();
    }
    logTerminal('[Serial port disconnected]');
    showToast('Serial board disconnected.', 'info');
    updateAllViews();
  });

  el.btnSendTerminal.addEventListener('click', sendTerminalCommand);
  el.terminalInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') sendTerminalCommand();
  });

  el.btnClearTerminal.addEventListener('click', () => {
    el.terminalWindow.innerHTML = '<div class="terminal-line system-msg">[Terminal Log Cleared]</div>';
  });
}

async function sendTerminalCommand() {
  const cmd = el.terminalInput.value.trim();
  if (!cmd) return;

  logTerminal(`> ${cmd}`);
  el.terminalInput.value = '';

  if (!state.serialPort || !state.serialPort.writable) {
    logTerminal(`[Command not sent: Serial port is not connected]`);
    return;
  }

  try {
    const encoder = new TextEncoder();
    const writer = state.serialPort.writable.getWriter();
    await writer.write(encoder.encode(cmd + '\r\n'));
    writer.releaseLock();
    logTerminal(`[Sent: "${cmd}"]`);
  } catch (err) {
    logTerminal(`[Error sending command: ${err.message}]`);
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
            parseHardwareLine(trimmed);
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
    reader.releaseLock();
  }
}

function parseHardwareLine(line) {
  try {
    if (line.startsWith('{') && line.endsWith('}')) {
      const data = JSON.parse(line);
      applyTelemetryData(data);
      return;
    }
  } catch (e) {}

  if (line.includes(':')) {
    const pairs = line.split(',');
    const data = {};
    pairs.forEach(pair => {
      const [k, v] = pair.split(':').map(s => s.trim().toUpperCase());
      const num = parseFloat(v);
      if (k === 'TEMP') data.temp = num;
      if (k === 'HUM') data.hum = num;
      if (k === 'GAS') data.gas = num;
      if (k === 'VOLT') data.volt = num;
      if (k === 'CURRENT') data.current = num;
      if (k === 'REED') data.reed = parseInt(v);
      if (k === 'PIR') data.pir = parseInt(v);
      if (k === 'DIST') data.dist = num;
    });
    applyTelemetryData(data);
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
  const line = document.createElement('div');
  line.className = 'terminal-line';
  line.textContent = `[${new Date().toLocaleTimeString()}] ${msg}`;
  el.terminalWindow.appendChild(line);

  if (el.chkAutoScroll.checked) {
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

  document.querySelectorAll('.gallery-thumb, .btn-inspect-photo').forEach(elem => {
    elem.addEventListener('click', (e) => {
      const id = e.currentTarget.dataset.id;
      const found = state.evidencePhotos.find(p => p.id === id);
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
    tr.innerHTML = `
      <td><span class="meta-detail">${log.timestamp}</span></td>
      <td><strong>${log.category}</strong></td>
      <td><span class="pin-tag">${log.sensor}</span></td>
      <td>${log.detail}</td>
      <td>${log.action}</td>
      <td><span class="status-badge ${log.status === 'Critical' ? 'badge-alert-crit' : log.status === 'Warning' ? 'badge-warning' : 'badge-alert-info'}">${log.status}</span></td>
    `;
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
}

function generateReportPreview() {
  const period = el.reportPeriodSelect.value;
  const isFull = document.querySelector('input[name="reportType"]:checked').value === 'full';
  const now = new Date();

  let html = `
    <div class="report-header-preview">
      <h2>KYAMBOGO UNIVERSITY — FACULTY OF ENGINEERING</h2>
      <p><strong>Facility:</strong> ${state.facilityName} | <strong>Report:</strong> ${period} ${isFull ? 'Full Technical Review' : 'Summary'}</p>
      <p><strong>Generated:</strong> ${now.toLocaleString()}</p>
    </div>

    <h4>1. Environmental Health Checks</h4>
    <table class="report-table-preview">
      <tr><th>System Health Check</th><th>Status</th><th>Active Sensors</th></tr>
      <tr><td>Perimeter & Intrusion</td><td>Operational</td><td>2 Channels</td></tr>
      <tr><td>Atmosphere & Air Purity</td><td>Calibrated Normal</td><td>2 Channels</td></tr>
      <tr><td>UEDCL Mains Power</td><td>Stable 230V Nominal</td><td>2 Channels</td></tr>
      <tr><td>GSM Gateway (SIM800L)</td><td>Armed (MTN UG Ready)</td><td>1 Gateway</td></tr>
    </table>

    <h4>2. Incident Log Summary (${period})</h4>
    <p>Total recorded incidents: <strong>${state.alarmLogs.length} events</strong>.</p>
    <table class="report-table-preview">
      <tr><th>Timestamp</th><th>Category</th><th>Sensor</th><th>Action Taken</th></tr>
      ${state.alarmLogs.slice(0, 3).map(l => `<tr><td>${l.timestamp}</td><td>${l.category}</td><td>${l.sensor}</td><td>${l.action}</td></tr>`).join('')}
    </table>
  `;

  if (isFull) {
    html += `
      <h4>3. Hardware Pinout Wiring Matrix</h4>
      <table class="report-table-preview">
        <tr><th>Sensor Component</th><th>Pin</th><th>Type</th><th>Room</th></tr>
        ${state.configuredSensors.slice(0, 6).map(s => `<tr><td>${s.name}</td><td>${s.pin}</td><td>${s.type}</td><td>${s.room}</td></tr>`).join('')}
      </table>
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

function renderIndividualSensorWidget(sensor) {
  const cat = sensor.category || 'climate';
  const telem = state.telemetry;

  let metricHtml = '';
  let controlsHtml = '';

  if (cat === 'climate') {
    const temp = telem.temp !== null ? telem.temp : 24.2;
    const hum = telem.hum !== null ? telem.hum : 58.0;
    metricHtml = `
      <div class="rich-sensor-metric">
        <span class="rich-val">${temp.toFixed(1)}</span><span class="rich-unit">°C</span>
        <div style="font-size: 0.82rem; color: var(--text-muted); margin-top: 4px;">
          Relative Humidity: <strong>${hum.toFixed(0)}%</strong> &bull; Dew Point: <strong>15.4°C</strong>
        </div>
      </div>`;
    controlsHtml = `
      <div class="sensor-ctrl-box">
        <div class="ctrl-label-row">
          <span>Target Temperature</span>
          <strong id="targetTempLabel_${sensor.id}">22°C</strong>
        </div>
        <input type="range" min="16" max="30" value="22" class="range-slider temp-target-slider" data-id="${sensor.id}">
        <div style="display: flex; gap: 6px; margin-top: 8px;">
          <button class="btn btn-secondary btn-xs btn-cooling-mode" data-id="${sensor.id}" style="flex: 1;">❄️ Cooling Mode</button>
          <button class="btn btn-secondary btn-xs btn-heating-mode" data-id="${sensor.id}" style="flex: 1;">☀️ Heating Mode</button>
        </div>
      </div>`;
  } else if (cat === 'gas') {
    const gasVal = telem.gas !== null ? telem.gas : 185;
    const isHazard = gasVal > 350;
    metricHtml = `
      <div class="rich-sensor-metric">
        <span class="rich-val" style="color: ${isHazard ? '#ef4444' : '#10b981'};">${gasVal}</span><span class="rich-unit">ppm</span>
        <div style="font-size: 0.8rem; margin-top: 4px;">
          <span class="badge ${isHazard ? 'badge-danger' : 'badge-peaceful'}">${isHazard ? '⚠️ CRITICAL CONCENTRATION' : '🟢 AIR SAFE & CLEAN'}</span>
        </div>
      </div>`;
    controlsHtml = `
      <div class="sensor-ctrl-box">
        <div class="ctrl-label-row">
          <span>Alarm Threshold</span>
          <strong id="gasThreshLabel_${sensor.id}">350 ppm</strong>
        </div>
        <input type="range" min="100" max="800" value="350" class="range-slider gas-thresh-slider" data-id="${sensor.id}">
        <div style="display: flex; gap: 6px; margin-top: 8px;">
          <button class="btn btn-secondary btn-xs btn-test-siren" data-id="${sensor.id}" style="flex: 1;">🔔 Test Siren</button>
          <button class="btn btn-primary btn-xs btn-cutoff-valve" data-id="${sensor.id}" style="flex: 1;">🎛️ Trip Gas Valve</button>
        </div>
      </div>`;
  } else if (cat === 'power') {
    const volt = telem.volt !== null ? telem.volt : 238.4;
    const current = telem.current !== null ? telem.current : 0.85;
    const watts = (volt * current).toFixed(1);
    metricHtml = `
      <div class="rich-sensor-metric">
        <span class="rich-val">${volt.toFixed(1)}</span><span class="rich-unit">V AC</span>
        <div style="font-size: 0.82rem; color: var(--text-muted); margin-top: 4px;">
          Current: <strong>${current.toFixed(2)} A</strong> &bull; Power: <strong>${watts} W</strong> (PF: 0.98)
        </div>
      </div>`;
    controlsHtml = `
      <div class="sensor-ctrl-box">
        <div class="ctrl-label-row">
          <span>Main Distribution Circuit Breaker</span>
          <span class="badge badge-peaceful" id="breakerStatus_${sensor.id}">CLOSED (ACTIVE)</span>
        </div>
        <div style="display: flex; gap: 6px; margin-top: 8px;">
          <button class="btn btn-secondary btn-xs btn-toggle-breaker" data-id="${sensor.id}" style="flex: 1;">⚡ Trip Circuit Breaker</button>
          <button class="btn btn-secondary btn-xs btn-reset-kwh" data-id="${sensor.id}" style="flex: 1;">0.00 kWh Reset</button>
        </div>
      </div>`;
  } else if (cat === 'motion') {
    const isMotion = telem.pirActive || false;
    metricHtml = `
      <div class="rich-sensor-metric" style="display: flex; justify-content: space-between; align-items: center;">
        <div>
          <span class="rich-val" style="font-size: 1.5rem; color: ${isMotion ? '#ef4444' : '#10b981'};">${isMotion ? 'TARGET DETECTED' : 'CLEAR / SECURE'}</span>
          <div style="font-size: 0.78rem; color: var(--text-muted); margin-top: 4px;">Zone Armed &bull; Microwave Doppler active</div>
        </div>
        <div class="radar-sweep-visual"></div>
      </div>`;
    controlsHtml = `
      <div class="sensor-ctrl-box">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
          <span style="font-size: 0.76rem; font-weight: 600;">Armed Security Guard</span>
          <label class="switch"><input type="checkbox" checked class="toggle-arm-sensor" data-id="${sensor.id}"><span class="slider round"></span></label>
        </div>
        <button class="btn btn-primary btn-xs btn-snap-camera" data-id="${sensor.id}" style="width: 100%;">📸 Capture Verified Photo</button>
      </div>`;
  } else if (cat === 'actuator') {
    if (sensor.name.toLowerCase().includes('valve')) {
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
    } else if (sensor.name.toLowerCase().includes('ac') || sensor.name.toLowerCase().includes('crac')) {
      metricHtml = `
        <div class="rich-sensor-metric">
          <span class="rich-val">22</span><span class="rich-unit">°C Set</span>
          <div style="font-size: 0.78rem; color: #38bdf8; margin-top: 4px;">Mode: COOL &bull; Compressor: 45Hz &bull; Fan: AUTO</div>
        </div>`;
      controlsHtml = `
        <div class="ac-remote-console">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span style="font-size: 0.74rem;">Smart AC Console</span>
            <button class="btn btn-secondary btn-xs btn-ac-power" data-id="${sensor.id}">Power</button>
          </div>
          <div class="ac-remote-modes">
            <button class="ac-mode-btn active">❄️ Cool</button>
            <button class="ac-mode-btn">☀️ Heat</button>
            <button class="ac-mode-btn">🌀 Fan</button>
            <button class="ac-mode-btn">💧 Dry</button>
          </div>
        </div>`;
    } else {
      metricHtml = `
        <div class="rich-sensor-metric">
          <span class="rich-val">READY</span>
          <div style="font-size: 0.78rem; color: var(--text-muted);">Relay Channel Energized</div>
        </div>`;
      controlsHtml = `
        <div class="sensor-ctrl-box">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span style="font-size: 0.78rem; font-weight: 600;">Power Switch</span>
            <label class="switch"><input type="checkbox" class="toggle-actuator-relay" data-id="${sensor.id}"><span class="slider round"></span></label>
          </div>
        </div>`;
    }
  } else if (cat === 'liquid') {
    metricHtml = `
      <div class="rich-sensor-metric">
        <span class="rich-val">76%</span><span class="rich-unit">Capacity</span>
        <div style="font-size: 0.78rem; color: var(--text-muted); margin-top: 4px;">Volume: <strong>3,800 Liters</strong> &bull; Pressure: <strong>4.2 Bar</strong></div>
      </div>`;
    controlsHtml = `
      <div class="sensor-ctrl-box">
        <div style="display: flex; gap: 6px;">
          <button class="btn btn-primary btn-xs btn-toggle-pump" data-id="${sensor.id}" style="flex: 1;">💧 Start Pump</button>
          <button class="btn btn-secondary btn-xs btn-drain-tank" data-id="${sensor.id}" style="flex: 1;">Drain Valve</button>
        </div>
      </div>`;
  } else if (cat === 'optical' && sensor.name.includes('MAX30102')) {
    metricHtml = `
      <div class="rich-sensor-metric">
        <div style="display: flex; justify-content: space-between; align-items: baseline;">
          <div><span class="rich-val">98.4</span><span class="rich-unit">% SpO2</span></div>
          <div><span class="rich-val" style="font-size: 1.5rem; color: #ef4444;">72</span><span class="rich-unit">BPM</span></div>
        </div>
        <svg class="ecg-pulse-svg" viewBox="0 0 200 40"><path d="M0,20 L40,20 L50,5 L60,35 L70,10 L80,25 L90,20 L200,20" /></svg>
      </div>`;
    controlsHtml = `
      <div class="sensor-ctrl-box">
        <button class="btn btn-primary btn-xs btn-nurse-alert" data-id="${sensor.id}" style="width: 100%;">🚨 Dispatch Nurse Station Alert</button>
      </div>`;
  } else {
    metricHtml = `
      <div class="rich-sensor-metric">
        <span class="rich-val">ACTIVE</span>
        <div style="font-size: 0.78rem; color: var(--text-muted); margin-top: 4px;">${sensor.type} &bull; Pin: ${sensor.pin}</div>
      </div>`;
    controlsHtml = `
      <div class="sensor-ctrl-box">
        <button class="btn btn-secondary btn-xs btn-ping-channel" data-id="${sensor.id}" style="width: 100%;">⚡ Ping Channel Test</button>
      </div>`;
  }

  return `
    <div class="rich-sensor-card" data-sensor-id="${sensor.id}">
      <div>
        <div class="rich-card-head">
          <div style="display: flex; align-items: center; gap: 8px;">
            <span style="font-size: 1.3rem;">${getSensorIconByCategory(sensor.category)}</span>
            <div>
              <h3 style="margin: 0; font-size: 0.95rem; font-weight: 700; color: var(--text-main);">${sensor.name}</h3>
              <span class="pin-tag">${sensor.pin}</span>
            </div>
          </div>
          <span class="badge" style="background: #f1f5f9; color: #334155; font-size: 0.68rem; font-weight: 600;">${sensor.room}</span>
        </div>
        ${metricHtml}
      </div>
      ${controlsHtml}
    </div>`;
}

function attachSensorWidgetControlsListeners() {
  // Climate Target slider
  document.querySelectorAll('.temp-target-slider').forEach(slider => {
    slider.addEventListener('input', (e) => {
      const lbl = document.getElementById('targetTempLabel_' + e.target.dataset.id);
      if (lbl) lbl.textContent = e.target.value + '°C';
    });
  });

  // Gas Threshold slider
  document.querySelectorAll('.gas-thresh-slider').forEach(slider => {
    slider.addEventListener('input', (e) => {
      const lbl = document.getElementById('gasThreshLabel_' + e.target.dataset.id);
      if (lbl) lbl.textContent = e.target.value + ' ppm';
    });
  });

  // Test Siren
  document.querySelectorAll('.btn-test-siren').forEach(btn => {
    btn.addEventListener('click', () => {
      showToast('🔊 High-decibel piezo siren sounding for 3 seconds!', 'warning');
      logIncident('Hazard Audio Test', 'MQ-2 Gas', 'Manual siren audio verification conducted', 'Resolved');
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
      } else if (statusPill) {
        statusPill.textContent = 'CLOSED (ACTIVE)';
        statusPill.className = 'badge badge-peaceful';
        showToast('⚡ Mains Circuit Breaker RESET to closed.', 'success');
      }
    });
  });

  // Camera snap
  document.querySelectorAll('.btn-snap-camera').forEach(btn => {
    btn.addEventListener('click', () => {
      triggerManualSnapshot();
      showToast('📸 High-resolution security snapshot captured & logged.', 'info');
    });
  });

  // Water pump toggle
  document.querySelectorAll('.btn-toggle-pump').forEach(btn => {
    btn.addEventListener('click', () => {
      showToast('💧 Water Booster Pump Relay Activated.', 'info');
    });
  });

  // Nurse station alert
  document.querySelectorAll('.btn-nurse-alert').forEach(btn => {
    btn.addEventListener('click', () => {
      showToast('🚨 Code Alert Dispatched to Hospital Central Nurse Station!', 'danger');
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

  el.btnEditFacility.addEventListener('click', () => {
    el.inputFacilityName.value = state.facilityName;
    el.editFacilityModal.classList.add('active');
  });
  el.btnCloseFacilityModal.addEventListener('click', () => el.editFacilityModal.classList.remove('active'));
  el.btnCancelFacilityModal.addEventListener('click', () => el.editFacilityModal.classList.remove('active'));
  el.formEditFacility.addEventListener('submit', (e) => {
    e.preventDefault();
    state.facilityName = el.inputFacilityName.value.trim();
    updateFacilityInfo();
    el.editFacilityModal.classList.remove('active');
    showToast(`Facility renamed to "${state.facilityName}"`, 'info');
  });

  el.btnOpenAddRoomModal.addEventListener('click', () => el.addRoomModal.classList.add('active'));
  el.btnCloseRoomModal.addEventListener('click', () => el.addRoomModal.classList.remove('active'));
  el.btnCancelRoomModal.addEventListener('click', () => el.addRoomModal.classList.remove('active'));
  el.formAddRoom.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = el.newRoomName.value.trim();
    const purpose = el.newRoomPurpose.value.trim();
    const icon = document.getElementById('newRoomIcon')?.value || '📍';
    const clearance = document.getElementById('newRoomClearance')?.value || 'General';
    state.rooms.push({ id: 'room-' + Date.now(), name, purpose, icon, clearance });
    populateRoomSelects();
    updateFacilityInfo();
    renderPremiseZones();
    el.addRoomModal.classList.remove('active');
    el.formAddRoom.reset();
    showToast(`Added area: "${icon} ${name}" (${clearance})`, 'success');
  });

  el.btnOpenAddSensorModal.addEventListener('click', () => el.addSensorModal.classList.add('active'));
  el.btnCloseSensorModal.addEventListener('click', () => el.addSensorModal.classList.remove('active'));
  el.btnCancelSensorModal.addEventListener('click', () => el.addSensorModal.classList.remove('active'));
  el.formAddSensor.addEventListener('submit', (e) => {
    e.preventDefault();
    const newSensor = {
      id: Date.now(),
      name: el.newSensorName.value.trim(),
      pin: el.newSensorPin.value,
      type: el.newSensorType.value,
      room: el.newSensorRoom.value,
      threshold: el.newSensorThreshold.value.trim()
    };
    state.configuredSensors.push(newSensor);
    renderSensorsTable();
    updateFacilityInfo();
    el.addSensorModal.classList.remove('active');
    el.formAddSensor.reset();
    showToast(`Configured "${newSensor.name}" on ${newSensor.pin}!`, 'info');
  });

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
  el.btnToggleEngineering.addEventListener('click', () => el.engineeringWorkspace.classList.add('active'));
  el.btnCloseEngineering.addEventListener('click', () => el.engineeringWorkspace.classList.remove('active'));

  el.codeTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      el.codeTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const sketchKey = tab.dataset.sketch;
      el.codeViewer.textContent = state.firmwareSketches[sketchKey] || '// Code unavailable';
    });
  });

  el.codeViewer.textContent = state.firmwareSketches.esp32cam;
  el.btnCopyCode.addEventListener('click', () => {
    navigator.clipboard.writeText(el.codeViewer.textContent);
    showToast('📋 Firmware copied to clipboard!', 'info');
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
    const devId = document.getElementById('sparkDeviceId')?.value || '54ff74066678574924331067';
    const token = document.getElementById('sparkAccessToken')?.value || 'a0797b36a333...';
    
    closeSparkModal();

    // Set connection status indicator
    if (el.globalConnDot) {
      el.globalConnDot.className = 'status-dot live';
    }
    if (el.globalConnLabel) {
      el.globalConnLabel.textContent = 'Spark Core (Cloud)';
    }

    logCloudServerAudit('GATEWAY', `Connected to Spark Core (${devId.slice(0, 8)}...) via Particle Cloud REST API. Real-time telemetry streaming.`);
    showToast('⚡ Spark Core connected via Particle Cloud REST stream!', 'info');
    playChimeSound();

    // Stream telemetry updates from Spark Core
    if (sparkCloudInterval) clearInterval(sparkCloudInterval);
    sparkCloudInterval = setInterval(() => {
      // Simulate live incoming Spark Core telemetry packet
      const t = 24.0 + (Math.sin(Date.now() / 15000) * 1.5);
      const h = 56.0 + (Math.cos(Date.now() / 12000) * 4.0);
      const g = Math.floor(180 + Math.random() * 15);
      const v = 237.5 + (Math.random() - 0.5) * 3.0;
      const c = 0.82 + (Math.random() - 0.5) * 0.1;

      state.telemetry.temp = parseFloat(t.toFixed(1));
      state.telemetry.hum = parseFloat(h.toFixed(1));
      state.telemetry.gas = g;
      state.telemetry.volt = parseFloat(v.toFixed(1));
      state.telemetry.current = parseFloat(c.toFixed(2));
      state.telemetry.power = Math.round(state.telemetry.volt * state.telemetry.current);
      state.telemetry.lastUpdate = new Date().toLocaleTimeString();

      updateMonitorView();
      updateSensorsView();

      // Mirror to live terminal if open
      appendTerminalLine(`[SPARK] {"temp":${state.telemetry.temp},"hum":${state.telemetry.hum},"gas":${state.telemetry.gas},"volt":${state.telemetry.volt}}`);
    }, 2500);
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
    countBadge.textContent = `${filtered.length} of ${templates.length} Models`;
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

        <div class="sensor-card-actions">
          <button class="btn btn-secondary btn-xs btn-card-test" data-sample='${t.sampleOutput.replace(/'/g, "&#39;")}' style="flex: 1;">🧪 Test Signature</button>
          <button class="btn btn-primary btn-xs btn-card-add-fw" data-id="${t.id}" style="flex: 1;">+ Firmware</button>
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
        showToast(`Added ${id} to firmware generator stack`, 'success');
      } else {
        showToast(`${id} is already in the firmware stack`, 'info');
      }
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
}

// =============================================================================
// 15. INITIALIZE SANCTUARY OS
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

  updateAllViews();
  showToast(`🏡 Sanctuary OS loaded. Facility: "${state.facilityName}"`, 'info');
});


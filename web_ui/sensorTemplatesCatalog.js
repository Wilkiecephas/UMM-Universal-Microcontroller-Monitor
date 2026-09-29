/**
 * UNIVERSAL SERIAL SENSOR & DEVICE TEMPLATE REPOSITORY
 * Over 120+ Sensor, Control, Switch, Gas Valve, AC, BLE and Wi-Fi Templates
 * Includes pattern matching heuristics, signal types (Analog vs Digital),
 * operating voltages, calibration equations, and code snippet generators.
 *
 * Part of Sanctuary OS & KyU Universal Telemetry Platform
 */

const SENSOR_CATEGORIES = [
  {
    "id": "all",
    "label": "All Templates",
    "icon": "🌐"
  },
  {
    "id": "climate",
    "label": "Climate & Temp",
    "icon": "🌡️"
  },
  {
    "id": "gas",
    "label": "Gas & Air Quality",
    "icon": "💨"
  },
  {
    "id": "power",
    "label": "Power & Grid AC",
    "icon": "⚡"
  },
  {
    "id": "motion",
    "label": "Motion, Radar & Security",
    "icon": "🚶"
  },
  {
    "id": "optical",
    "label": "Light, Flame & Bio",
    "icon": "💡"
  },
  {
    "id": "liquid",
    "label": "Liquid, Soil & Flow",
    "icon": "💧"
  },
  {
    "id": "actuator",
    "label": "Valves, AC & Actuators",
    "icon": "🎛️"
  },
  {
    "id": "wireless",
    "label": "BLE, Wi-Fi & Cellular",
    "icon": "📡"
  },
  {
    "id": "mcu",
    "label": "Controllers & Cameras",
    "icon": "📷"
  }
];

const SENSOR_TEMPLATES = [
  {
    id: "dht11",
    name: "DHT11 Basic Climate Sensor",
    model: "DHT11",
    category: "climate",
    signalType: "Digital (1-Wire Proprietary)",
    voltage: "3.3V – 5.0V",
    range: "0°C to 50°C (±2°C), 20% to 90% RH (±5%)",
    unit: "°C, % RH",
    pins: ["VCC","DATA (GPIO 13 / D2)","NC","GND"],
    serialSignature: /dht11|temp(?:erature)?\s*[:=]\s*(\d{1,2}(?:\.\d)?).*?hum(?:idity)?\s*[:=]\s*(\d{1,2})/i,
    sampleOutput: "{\"temp\": 24, \"hum\": 60, \"sensor\": \"DHT11\"}",
    analogOrDigital: "Digital",
    description: "Basic low-cost digital temperature and relative humidity sensor with single-bus protocol."
  },
  {
    id: "dht22",
    name: "DHT22 / AM2302 High-Accuracy Climate Sensor",
    model: "DHT22 / AM2302",
    category: "climate",
    signalType: "Digital (1-Wire Proprietary)",
    voltage: "3.3V – 6.0V",
    range: "-40°C to 80°C (±0.5°C), 0% to 100% RH (±2%)",
    unit: "°C, % RH",
    pins: ["VCC (3.3V-5V)","DATA (10k pullup)","NC","GND"],
    serialSignature: /dht22|am2302|temp(?:erature)?\s*[:=]\s*([+-]?\d{1,2}\.\d+).*?hum(?:idity)?\s*[:=]\s*(\d{1,3}\.\d+)/i,
    sampleOutput: "{\"temp\": 24.2, \"hum\": 58.4, \"sensor\": \"DHT22\"}",
    analogOrDigital: "Digital",
    description: "Capacitive humidity sensing and thermistor module for precise ambient room conditioning."
  },
  {
    id: "ds18b20",
    name: "DS18B20 Programmable Waterproof Temp Sensor",
    model: "DS18B20",
    category: "climate",
    signalType: "Digital (Dallas 1-Wire, 64-bit ROM)",
    voltage: "3.0V – 5.5V",
    range: "-55°C to +125°C (±0.5°C)",
    unit: "°C",
    pins: ["VCC (Red)","DATA (Yellow/White with 4.7k pullup)","GND (Black)"],
    serialSignature: /ds18b20|water_temp|probe_temp\s*[:=]\s*([+-]?\d{1,3}\.\d+)/i,
    sampleOutput: "TEMP_PROBE: 25.62 C, ROM: 28FF641E8216035A (DS18B20)",
    analogOrDigital: "Digital",
    description: "Submersible stainless probe with unique 64-bit address for multi-drop liquid and pipe temperature."
  },
  {
    id: "bme280",
    name: "BME280 Environmental Sensor (Temp, Hum, Pressure)",
    model: "BME280",
    category: "climate",
    signalType: "Digital (I2C / SPI)",
    voltage: "1.8V – 3.6V (3.3V nominal)",
    range: "-40°C–85°C, 0–100% RH, 300–1100 hPa",
    unit: "°C, %, hPa",
    pins: ["VIN (3.3V)","GND","SCL (GPIO 22 / D1)","SDA (GPIO 21 / D0)"],
    serialSignature: /bme280|press(?:ure)?\s*[:=]\s*(\d{3,4}(?:\.\d+)?)\s*(?:hpa)?/i,
    sampleOutput: "{\"temp\": 23.85, \"hum\": 52.1, \"press\": 1013.25, \"sensor\": \"BME280\"}",
    analogOrDigital: "Digital",
    description: "Combined atmospheric sensor developed by Bosch for indoor navigation and weather forecasting."
  },
  {
    id: "bmp280",
    name: "BMP280 Barometric Pressure & Altimeter",
    model: "BMP280",
    category: "climate",
    signalType: "Digital (I2C / SPI)",
    voltage: "1.8V – 3.6V",
    range: "-40°C to 85°C, 300 to 1100 hPa",
    unit: "°C, hPa, m",
    pins: ["VCC (3.3V)","GND","SCL","SDA"],
    serialSignature: /bmp280|altitude\s*[:=]\s*([+-]?\d+(?:\.\d+)?)/i,
    sampleOutput: "BMP280: Temp=24.1C, Press=1012.8hPa, Alt=124.5m",
    analogOrDigital: "Digital",
    description: "Precision absolute barometric pressure sensor for altimeter and HVAC pressure differential."
  },
  {
    id: "bme680",
    name: "BME680 4-in-1 Gas, Pressure, Temp & Humidity",
    model: "BME680",
    category: "climate",
    signalType: "Digital (I2C / SPI)",
    voltage: "1.71V – 3.6V",
    range: "-40–85°C, 0–100%, 300–1100hPa, 0–500 IAQ",
    unit: "°C, %, hPa, IAQ/kOhm",
    pins: ["VIN (3.3V)","GND","SCL","SDA"],
    serialSignature: /bme680|iaq\s*[:=]\s*(\d{1,3})/i,
    sampleOutput: "BME680: Temp=24.5C, Hum=45%, Press=1011hPa, Gas=124kOhm, IAQ=35",
    analogOrDigital: "Digital",
    description: "Integrated environmental sensor with MOX gas scanner for volatile organic compounds and indoor air quality."
  },
  {
    id: "sht31",
    name: "Sensirion SHT31-D Precision Humidity & Temp",
    model: "SHT31-D",
    category: "climate",
    signalType: "Digital (I2C addr 0x44/0x45)",
    voltage: "2.4V – 5.5V",
    range: "-40°C to +125°C (±0.2°C), 0% to 100% RH (±2%)",
    unit: "°C, % RH",
    pins: ["VIN","GND","SCL","SDA","ALERT"],
    serialSignature: /sht31|sht3x/i,
    sampleOutput: "{\"sensor\":\"SHT31\",\"temp\":24.15,\"hum\":54.32}",
    analogOrDigital: "Digital",
    description: "Industrial grade Sensirion sensor with true I2C interface, alert pin, and internal heater for de-fogging."
  },
  {
    id: "sht40",
    name: "Sensirion SHT40 4th Gen Ultra-Low Power Sensor",
    model: "SHT40",
    category: "climate",
    signalType: "Digital (I2C addr 0x44)",
    voltage: "1.08V – 3.6V",
    range: "-40°C to 125°C (±0.2°C), 0 to 100% RH (±1.8%)",
    unit: "°C, % RH",
    pins: ["VDD","GND","SCL","SDA"],
    serialSignature: /sht40|sht4x/i,
    sampleOutput: "SHT40: Temp=23.9C, Hum=50.2% [High Accuracy Mode]",
    analogOrDigital: "Digital",
    description: "Fourth-generation flagship sensor offering 1.08V operation for extreme battery life IoT nodes."
  },
  {
    id: "aht20",
    name: "AOSONG AHT20 Integrated Temp & Humidity",
    model: "AHT20",
    category: "climate",
    signalType: "Digital (I2C addr 0x38)",
    voltage: "2.0V – 5.5V",
    range: "-40°C to +85°C (±0.3°C), 0% to 100% (±2%)",
    unit: "°C, % RH",
    pins: ["VDD","GND","SCL","SDA"],
    serialSignature: /aht20|aht10/i,
    sampleOutput: "{\"sensor\":\"AHT20\",\"temp\":25.10,\"hum\":48.9}",
    analogOrDigital: "Digital",
    description: "Calibrated digital output with standard I2C protocol, immune to condensation in harsh rooms."
  },
  {
    id: "si7021",
    name: "Silicon Labs Si7021 I2C Humidity Sensor",
    model: "Si7021",
    category: "climate",
    signalType: "Digital (I2C addr 0x40)",
    voltage: "1.9V – 3.6V",
    range: "-10°C to +85°C (±0.4°C), 0% to 80% (±3%)",
    unit: "°C, % RH",
    pins: ["VIN","GND","SCL","SDA"],
    serialSignature: /si7021/i,
    sampleOutput: "Si7021: Temp: 22.8C, RH: 46.2%",
    analogOrDigital: "Digital",
    description: "Monolithic CMOS IC with patented low-K dielectric sensor element and integrated heater."
  },
  {
    id: "lm35",
    name: "Texas Instruments LM35 Precision Analog Temp",
    model: "LM35DZ",
    category: "climate",
    signalType: "Analog Voltage (10mV/°C linear)",
    voltage: "4.0V – 30.0V",
    range: "0°C to +100°C (±0.5°C)",
    unit: "°C (Vout / 0.01V)",
    pins: ["VS (+5V)","VOUT (Analog ADC A0)","GND"],
    serialSignature: /lm35|analog_temp|lm35dz\s*[:=]\s*(\d{1,2}(?:\.\d+)?)/i,
    sampleOutput: "LM35: Vout=242mV -> Temp=24.2C (ADC=495)",
    analogOrDigital: "Analog",
    description: "Directly calibrated in Celsius with linear 10.0 mV/°C scale factor and low self-heating (0.08°C in still air)."
  },
  {
    id: "tmp36",
    name: "Analog Devices TMP36 Low Voltage Temp Sensor",
    model: "TMP36GT9Z",
    category: "climate",
    signalType: "Analog Voltage (10mV/°C with 500mV offset)",
    voltage: "2.7V – 5.5V",
    range: "-40°C to +125°C",
    unit: "°C ((Vout - 0.5V) / 0.01V)",
    pins: ["VIN (3.3V-5V)","VOUT (ADC A1)","GND"],
    serialSignature: /tmp36|analog_temp_tmp/i,
    sampleOutput: "TMP36: Vout=742mV -> Temp=24.2C",
    analogOrDigital: "Analog",
    description: "Analog temperature sensor with 500mV offset at 0°C allowing negative temperature measurement with single supply."
  },
  {
    id: "ntc_10k",
    name: "NTC 10K Thermistor (Steinhart-Hart Equation)",
    model: "NTC-MF52-10K",
    category: "climate",
    signalType: "Analog Resistance (Voltage Divider)",
    voltage: "3.3V or 5.0V with 10k fixed resistor",
    range: "-50°C to +110°C (B-constant 3950)",
    unit: "°C, Ohms",
    pins: ["VCC (+3.3V)","DIVIDER_MID (ADC A0)","GND"],
    serialSignature: /ntc_10k|thermistor|steinhart/i,
    sampleOutput: "THERMISTOR_NTC: Raw ADC=2048, R_ntc=10020 Ohm, Temp=24.95C",
    analogOrDigital: "Analog",
    description: "Rugged negative temperature coefficient resistor modeled via 3-parameter Steinhart-Hart equation."
  },
  {
    id: "pt100_max31865",
    name: "PT100 Platinum RTD with MAX31865 Amplifier",
    model: "PT100 / MAX31865",
    category: "climate",
    signalType: "Digital SPI (15-bit ADC RTD-to-Digital)",
    voltage: "3.0V – 5.5V",
    range: "-200°C to +650°C (±0.03°C platinum precision)",
    unit: "°C",
    pins: ["VIN","GND","SCK","SDO (MISO)","SDI (MOSI)","CS"],
    serialSignature: /pt100|max31865|rtd_temp/i,
    sampleOutput: "MAX31865: RTD Resistance=109.42 Ohm, Temp=24.18C, Fault=None",
    analogOrDigital: "Digital",
    description: "Ultra-high-precision platinum resistance temperature detector for industrial furnaces, cryo and HVAC ducts."
  },
  {
    id: "mcp9808",
    name: "Microchip MCP9808 Maximum Accuracy Digital Temp",
    model: "MCP9808",
    category: "climate",
    signalType: "Digital (I2C addr 0x18)",
    voltage: "2.7V – 5.5V",
    range: "-40°C to +125°C (±0.25°C typical)",
    unit: "°C",
    pins: ["VDD","GND","SCL","SDA","ALERT"],
    serialSignature: /mcp9808/i,
    sampleOutput: "MCP9808: Ambient Temp = 24.1875 C (Resolution: 0.0625C)",
    analogOrDigital: "Digital",
    description: "High-precision temperature-to-digital converter with user-programmable alert boundaries."
  },
  {
    id: "am2320",
    name: "AM2320 Digital Temperature & Humidity Sensor",
    model: "AM2320",
    category: "climate",
    signalType: "Digital (I2C or 1-Wire Single Bus)",
    voltage: "3.1V – 5.5V",
    range: "-40°C to 80°C (±0.5°C), 0% to 99.9% RH (±3%)",
    unit: "°C, % RH",
    pins: ["VDD","SDA / 1-Wire","GND","SCL"],
    serialSignature: /am2320/i,
    sampleOutput: "AM2320: Temp: 24.6C, Hum: 56.1%",
    analogOrDigital: "Digital",
    description: "Dual-mode sensor supporting standard I2C protocol as well as single-bus asynchronous serial."
  },
  {
    id: "mq2",
    name: "MQ-2 Flammable Gas, LPG & Smoke Sensor",
    model: "MQ-2",
    category: "gas",
    signalType: "Analog ADC (0-5V) + Digital Comparator Out",
    voltage: "5.0V ± 0.1V (Heater ~800mW)",
    range: "300 to 10,000 ppm (LPG, Propane, Hydrogen, Smoke)",
    unit: "ppm / Raw ADC",
    pins: ["VCC (+5V)","GND","DO (Digital Threshold)","AO (Analog ADC A0)"],
    serialSignature: /mq-?2|smoke|gas\s*[:=]\s*(\d{1,4})/i,
    sampleOutput: "MQ-2 Gas Sensor: Analog A0 = 840 (185 ppm Smoke/LPG)",
    analogOrDigital: "Analog/Digital",
    description: "Tin dioxide (SnO2) semiconductor sensor with internal heating circuit for general combustible gas and smoke."
  },
  {
    id: "mq3",
    name: "MQ-3 Alcohol Vapor Breathalyzer Sensor",
    model: "MQ-3",
    category: "gas",
    signalType: "Analog ADC + Digital DO",
    voltage: "5.0V",
    range: "0.05 mg/L to 10 mg/L Alcohol",
    unit: "mg/L or ppm",
    pins: ["VCC","GND","DO","AO"],
    serialSignature: /mq-?3|alcohol\s*[:=]\s*(\d+(?:\.\d+)?)/i,
    sampleOutput: "MQ-3: Alcohol Concentration = 0.04 mg/L (AO=210)",
    analogOrDigital: "Analog/Digital",
    description: "High sensitivity to alcohol vapor with strong resistance to gasoline and smoke interference."
  },
  {
    id: "mq4",
    name: "MQ-4 Compressed Natural Gas (CNG) & Methane",
    model: "MQ-4",
    category: "gas",
    signalType: "Analog ADC + Digital DO",
    voltage: "5.0V",
    range: "300 to 10,000 ppm Methane (CH4)",
    unit: "ppm",
    pins: ["VCC","GND","DO","AO"],
    serialSignature: /mq-?4|cng|methane\s*[:=]\s*(\d+)/i,
    sampleOutput: "MQ-4: Natural Gas CH4 = 420 ppm (Safe)",
    analogOrDigital: "Analog/Digital",
    description: "Tailored for natural gas leak detection in municipal pipelines, kitchens, and CNG vehicle enclosures."
  },
  {
    id: "mq5",
    name: "MQ-5 LPG, Natural Gas & Town Gas Sensor",
    model: "MQ-5",
    category: "gas",
    signalType: "Analog ADC + Digital DO",
    voltage: "5.0V",
    range: "200 to 10,000 ppm",
    unit: "ppm",
    pins: ["VCC","GND","DO","AO"],
    serialSignature: /mq-?5|lpg\s*[:=]\s*(\d+)/i,
    sampleOutput: "MQ-5: Gas Level = 180 ppm (AO=320)",
    analogOrDigital: "Analog/Digital",
    description: "High sensitivity to LPG, methane, and coal gas with fast response and recovery characteristics."
  },
  {
    id: "mq6",
    name: "MQ-6 Isobutane & Propane Gas Sensor",
    model: "MQ-6",
    category: "gas",
    signalType: "Analog ADC + Digital DO",
    voltage: "5.0V",
    range: "300 to 10,000 ppm Isobutane/Propane",
    unit: "ppm",
    pins: ["VCC","GND","DO","AO"],
    serialSignature: /mq-?6|propane\s*[:=]\s*(\d+)/i,
    sampleOutput: "MQ-6: Propane = 250 ppm, DO=LOW (Nominal)",
    analogOrDigital: "Analog/Digital",
    description: "Dedicated propane and butane gas leak detection for domestic and industrial boiler safety."
  },
  {
    id: "mq7",
    name: "MQ-7 Carbon Monoxide (CO) Sensor",
    model: "MQ-7",
    category: "gas",
    signalType: "Analog ADC (High/Low heating cycle)",
    voltage: "5.0V high heat (60s) / 1.4V low read (90s)",
    range: "20 to 2000 ppm Carbon Monoxide",
    unit: "ppm CO",
    pins: ["VCC","GND","DO","AO"],
    serialSignature: /mq-?7|carbon_monoxide|co_ppm\s*[:=]\s*(\d+)/i,
    sampleOutput: "MQ-7: CO Concentration = 14 ppm (Safe Ambient)",
    analogOrDigital: "Analog/Digital",
    description: "Cyclic heating sensor for deadly carbon monoxide detection in residential bedrooms and furnace closets."
  },
  {
    id: "mq8",
    name: "MQ-8 Hydrogen Gas (H2) Sensor",
    model: "MQ-8",
    category: "gas",
    signalType: "Analog ADC + Digital DO",
    voltage: "5.0V",
    range: "100 to 10,000 ppm Hydrogen",
    unit: "ppm H2",
    pins: ["VCC","GND","DO","AO"],
    serialSignature: /mq-?8|hydrogen\s*[:=]\s*(\d+)/i,
    sampleOutput: "MQ-8: H2 Gas Level = 110 ppm (Battery Room Monitor)",
    analogOrDigital: "Analog/Digital",
    description: "High sensitivity to hydrogen gas for uninterruptible power supply (UPS) lead-acid battery rooms."
  },
  {
    id: "mq9",
    name: "MQ-9 Carbon Monoxide & Flammable Gas Sensor",
    model: "MQ-9",
    category: "gas",
    signalType: "Analog ADC + Digital DO",
    voltage: "5.0V high heat / 1.5V low read",
    range: "10-1000 ppm CO, 100-10000 ppm Combustibles",
    unit: "ppm",
    pins: ["VCC","GND","DO","AO"],
    serialSignature: /mq-?9|co_flammable\s*[:=]\s*(\d+)/i,
    sampleOutput: "MQ-9: Dual Gas Scan: CO=8ppm, Methane=210ppm",
    analogOrDigital: "Analog/Digital",
    description: "Dual-target sensor detecting both carbon monoxide and combustible gases using alternating thermal cycles."
  },
  {
    id: "mq135",
    name: "MQ-135 Hazardous Air Quality & Ammonia Sensor",
    model: "MQ-135",
    category: "gas",
    signalType: "Analog ADC + Digital DO",
    voltage: "5.0V",
    range: "10 to 1000 ppm (NH3, Benzene, Alcohol, Smoke, CO2)",
    unit: "ppm / Air Quality Index",
    pins: ["VCC","GND","DO","AO (Analog Pin A0)"],
    serialSignature: /mq-?135|air_qual(?:ity)?\s*[:=]\s*(\d+)/i,
    sampleOutput: "MQ-135: Air Quality Index = 112 ppm (Normal Office)",
    analogOrDigital: "Analog/Digital",
    description: "Wide-spectrum air purifier sensor for benzene, ammonia, nitrogen oxides, and building ventilation control."
  },
  {
    id: "mq136",
    name: "MQ-136 Hydrogen Sulfide Gas (H2S) Sensor",
    model: "MQ-136",
    category: "gas",
    signalType: "Analog ADC + Digital DO",
    voltage: "5.0V",
    range: "1 to 200 ppm H2S (Rotten Egg Gas)",
    unit: "ppm H2S",
    pins: ["VCC","GND","DO","AO"],
    serialSignature: /mq-?136|h2s\s*[:=]\s*(\d+(?:\.\d+)?)/i,
    sampleOutput: "MQ-136: H2S Level = 0.8 ppm (Sewage / Manhole Monitor)",
    analogOrDigital: "Analog/Digital",
    description: "Specialized for hydrogen sulfide sewer gas detection in subterranean utility vaults and washrooms."
  },
  {
    id: "mq137",
    name: "MQ-137 Ammonia (NH3) Gas Sensor",
    model: "MQ-137",
    category: "gas",
    signalType: "Analog ADC + Digital DO",
    voltage: "5.0V",
    range: "5 to 500 ppm NH3",
    unit: "ppm NH3",
    pins: ["VCC","GND","DO","AO"],
    serialSignature: /mq-?137|nh3|ammonia\s*[:=]\s*(\d+)/i,
    sampleOutput: "MQ-137: Ammonia NH3 = 12 ppm (Poultry / Cold Storage)",
    analogOrDigital: "Analog/Digital",
    description: "Monitors ammonia refrigerant leaks in industrial freezers and livestock ventilation facilities."
  },
  {
    id: "mq138",
    name: "MQ-138 Formaldehyde & Volatile Organics",
    model: "MQ-138",
    category: "gas",
    signalType: "Analog ADC + Digital DO",
    voltage: "5.0V",
    range: "5 to 500 ppm Toluene, Acetone, Formaldehyde",
    unit: "ppm VOC",
    pins: ["VCC","GND","DO","AO"],
    serialSignature: /mq-?138|voc_gas|formaldehyde/i,
    sampleOutput: "MQ-138: VOC Vapor Index = 45 ppm (Safe Post-Paint)",
    analogOrDigital: "Analog/Digital",
    description: "Detects hazardous paint thinners, formaldehyde from new furniture, and industrial chemical fumes."
  },
  {
    id: "sgp30",
    name: "Sensirion SGP30 Multi-Pixel TVOC & eCO2 Sensor",
    model: "SGP30",
    category: "gas",
    signalType: "Digital (I2C addr 0x58)",
    voltage: "1.8V nominal (Module 3.3V-5V)",
    range: "0 to 60,000 ppb TVOC, 400 to 60,000 ppm eCO2",
    unit: "ppb, ppm",
    pins: ["VIN (3.3V)","GND","SCL","SDA"],
    serialSignature: /sgp30|tvoc\s*[:=]\s*(\d+).*?eco2\s*[:=]\s*(\d+)/i,
    sampleOutput: "{\"co2_ppm\": 745, \"tvoc_ppb\": 42, \"eco2\": 720, \"sensor\": \"SGP30\"}",
    analogOrDigital: "Digital",
    description: "Multi-pixel MOX gas sensor with dynamic baseline compensation algorithm for true indoor air quality."
  },
  {
    id: "sgp40",
    name: "Sensirion SGP40 VOC Index Sensor",
    model: "SGP40",
    category: "gas",
    signalType: "Digital (I2C addr 0x59)",
    voltage: "1.7V – 3.6V (3.3V)",
    range: "0 to 500 VOC Index",
    unit: "VOC Index points",
    pins: ["VDD","GND","SCL","SDA"],
    serialSignature: /sgp40|voc_index\s*[:=]\s*(\d+)/i,
    sampleOutput: "SGP40: VOC Index = 100 (Typical Clean Indoor Background)",
    analogOrDigital: "Digital",
    description: "Provides standardized VOC Index output directly compatible with Sensirion Gas Index Algorithm."
  },
  {
    id: "mhz19b",
    name: "Winsen MH-Z19B NDIR Infrared Carbon Dioxide",
    model: "MH-Z19B",
    category: "gas",
    signalType: "Digital UART (9600 Baud) + PWM + Analog (0.4-2V)",
    voltage: "4.5V – 5.5V DC",
    range: "400 to 5000 ppm CO2 (±50ppm + 5% reading)",
    unit: "ppm CO2",
    pins: ["VIN (+5V)","GND","TX (GPIO 16 / RX2)","RX (GPIO 17 / TX2)","PWM","HD"],
    serialSignature: /mh-?z19b?|ndir_co2|co2_ppm\s*[:=]\s*(\d{3,5})/i,
    sampleOutput: "MH-Z19B: CO2 = 824 ppm, Temp = 25C [UART 9600]",
    analogOrDigital: "Digital/Analog",
    description: "Gold-plated optical cavity NDIR sensor for laboratory-grade absolute carbon dioxide concentration."
  },
  {
    id: "senseair_s8",
    name: "Senseair S8 Commercial NDIR CO2 Sensor",
    model: "Senseair S8 0053",
    category: "gas",
    signalType: "Digital UART (Modbus RTU 9600 Baud)",
    voltage: "4.5V – 5.25V DC",
    range: "400 to 2000 ppm CO2 (expandable to 10,000 ppm)",
    unit: "ppm CO2",
    pins: ["G+ (+5V)","G0 (GND)","UART_TxD","UART_RxD"],
    serialSignature: /senseair|s8_co2/i,
    sampleOutput: "SENSEAIR_S8: CO2 = 680 ppm, Status = 0x0000",
    analogOrDigital: "Digital",
    description: "Swedish miniature NDIR sensor with 15-year design life and automatic baseline correction (ABC)."
  },
  {
    id: "scd30",
    name: "Sensirion SCD30 True NDIR CO2, Temp & Humidity",
    model: "SCD30",
    category: "gas",
    signalType: "Digital (I2C addr 0x61 or Modbus UART)",
    voltage: "3.3V – 5.5V",
    range: "400 to 10,000 ppm (±30 ppm + 3%)",
    unit: "ppm, °C, %",
    pins: ["VDD","GND","TX/SCL","RX/SDA","RDY","PWM"],
    serialSignature: /scd30/i,
    sampleOutput: "{\"sensor\":\"SCD30\",\"co2\":612.4,\"temp\":23.8,\"hum\":49.5}",
    analogOrDigital: "Digital",
    description: "Dual-channel NDIR sensor designed for demand-controlled ventilation (DCV) and green building standards."
  },
  {
    id: "pms5003",
    name: "Plantower PMS5003 Laser Particle Matter PM2.5/10",
    model: "PMS5003",
    category: "gas",
    signalType: "Digital UART (9600 Baud, 32-byte binary frame)",
    voltage: "5.0V DC (I/O 3.3V compatible)",
    range: "0.3 to 10 µm (0 to 1000 µg/m³ PM1.0, PM2.5, PM10)",
    unit: "µg/m³",
    pins: ["VCC (+5V)","GND","TX (GPIO 16)","RX","RESET","SET"],
    serialSignature: /pms5003|pm2\.?5\s*[:=]\s*(\d+).*?pm10\s*[:=]\s*(\d+)/i,
    sampleOutput: "PMS5003: PM1.0=12ug/m3, PM2.5=24ug/m3, PM10=38ug/m3",
    analogOrDigital: "Digital",
    description: "Laser light scattering particle sensor measuring mass concentration of respirable smoke and smog particles."
  },
  {
    id: "zmpt101b",
    name: "ZMPT101B Active AC Voltage Transformer Module",
    model: "ZMPT101B",
    category: "power",
    signalType: "Analog AC Sinusoidal Voltage (Centered at VCC/2)",
    voltage: "5.0V DC supply, measures up to 250V AC RMS",
    range: "0 to 250V AC RMS (50Hz / 60Hz)",
    unit: "V AC RMS",
    pins: ["VCC (+5V)","GND","OUT (ADC Pin 35 / A2)","L (Line)","N (Neutral)"],
    serialSignature: /zmpt101b|vac\s*[:=]\s*(\d{2,3}(?:\.\d+)?)|grid_volt\s*[:=]\s*(\d{2,3})/i,
    sampleOutput: "{\"vac\": 238.4, \"freq\": 50.02, \"zmpt101b_adc\": 2180}",
    analogOrDigital: "Analog",
    description: "Micro-precision voltage transformer with onboard multi-turn potentiometer and op-amp amplifier."
  },
  {
    id: "acs712_20",
    name: "Allegro ACS712-20A Hall Effect Current Sensor",
    model: "ACS712ELCTR-20A-T",
    category: "power",
    signalType: "Analog Voltage (100mV / Amp centered at 2.5V)",
    voltage: "5.0V DC (VCC/2 zero-current quiescent output)",
    range: "-20A to +20A AC or DC",
    unit: "Amps RMS",
    pins: ["VCC (+5V)","GND","OUT (ADC Pin 34 / A1)","IP+ (AC Line In)","IP- (AC Load Out)"],
    serialSignature: /acs712|current\s*[:=]\s*(\d+(?:\.\d+)?)\s*(?:a)?/i,
    sampleOutput: "ACS712: Current = 1.42 A RMS (Vout = 2.642V)",
    analogOrDigital: "Analog",
    description: "Fully integrated Hall-effect current sensor IC with 2.1 kVRMS voltage isolation."
  },
  {
    id: "acs712_05",
    name: "Allegro ACS712-05A High Sensitivity Current",
    model: "ACS712-05A",
    category: "power",
    signalType: "Analog Voltage (185mV / Amp)",
    voltage: "5.0V DC",
    range: "-5A to +5A AC or DC",
    unit: "Amps RMS",
    pins: ["VCC","GND","OUT","IP+","IP-"],
    serialSignature: /acs712_?05|current_5a/i,
    sampleOutput: "ACS712-05A: Current = 0.45 A (Light bulb load)",
    analogOrDigital: "Analog",
    description: "Highest sensitivity ACS712 variant offering 185mV/A for micro-loads under 5 Amperes."
  },
  {
    id: "acs712_30",
    name: "Allegro ACS712-30A High Capacity Current Sensor",
    model: "ACS712-30A",
    category: "power",
    signalType: "Analog Voltage (66mV / Amp)",
    voltage: "5.0V DC",
    range: "-30A to +30A AC or DC",
    unit: "Amps RMS",
    pins: ["VCC","GND","OUT","IP+","IP-"],
    serialSignature: /acs712_?30|current_30a/i,
    sampleOutput: "ACS712-30A: Current = 12.8 A (Compressor Active)",
    analogOrDigital: "Analog",
    description: "High current rating module designed for air conditioner compressors and industrial heaters."
  },
  {
    id: "sct013_000",
    name: "YHDC SCT-013-000 Non-Invasive Split-Core CT",
    model: "SCT-013-000",
    category: "power",
    signalType: "Analog AC Current (0-50mA output / burden resistor needed)",
    voltage: "Passive induction (Requires bias divider and burden)",
    range: "0 to 100A AC",
    unit: "Amperes AC",
    pins: ["Tip (Signal)","Sleeve (Ground/Bias)","Ferrite Snap-Core"],
    serialSignature: /sct013|clamp_current/i,
    sampleOutput: "SCT013: Mains AC Current = 8.45 A RMS (Burden R=33 Ohm)",
    analogOrDigital: "Analog",
    description: "Snap-around clamp current transformer safely measuring mains lines without cutting live wires."
  },
  {
    id: "sct013_030",
    name: "YHDC SCT-013-030 Built-in Burden 30A/1V CT",
    model: "SCT-013-030",
    category: "power",
    signalType: "Analog AC Voltage (0-1V RMS at 30A)",
    voltage: "Passive internal resistor",
    range: "0 to 30A AC",
    unit: "Amperes AC",
    pins: ["Tip (0-1V RMS)","Sleeve (Reference)","Ferrite Snap-Core"],
    serialSignature: /sct013_?030/i,
    sampleOutput: "SCT-013-030: Current = 4.2 A RMS (Vout = 140 mV AC)",
    analogOrDigital: "Analog",
    description: "Internal burden resistor module outputting safe 0-1V AC directly readable via DC bias offset."
  },
  {
    id: "pzem004t",
    name: "Peacefair PZEM-004T v3.0 Multi-Function AC Meter",
    model: "PZEM-004T v3.0",
    category: "power",
    signalType: "Digital UART (Modbus-RTU 9600 Baud)",
    voltage: "80V – 260V AC Grid, 5V DC Opto Logic",
    range: "80-260V, 0-100A, 0-23kW, 0-9999kWh, PF 0-1.0",
    unit: "V, A, W, kWh, Hz, PF",
    pins: ["5V","RX","TX","GND","Live In","Neutral","CT Clamp"],
    serialSignature: /pzem004t|pzem\s*[:=]\s*(\d{2,3}(?:\.\d+)?)\s*v/i,
    sampleOutput: "PZEM004T: Volt=240.2V, Current=1.45A, Power=348.3W, Energy=12.45kWh, PF=0.98",
    analogOrDigital: "Digital",
    description: "High-voltage isolated energy meter computing active power, cumulative energy, and power factor."
  },
  {
    id: "pzem016",
    name: "Peacefair PZEM-016 Industrial RS485 Energy Meter",
    model: "PZEM-016",
    category: "power",
    signalType: "Digital RS485 Modbus RTU (Half Duplex)",
    voltage: "80V – 260V AC",
    range: "0-100A, 0-23kW, 45-65Hz, PF 0.00-1.00",
    unit: "V, A, W, kWh, PF",
    pins: ["A (RS485+)","B (RS485-)","L","N","CT1","CT2"],
    serialSignature: /pzem016|modbus_energy/i,
    sampleOutput: "PZEM016 [Addr 0x01]: V=239.5V, I=6.82A, P=1630W, Freq=50.0Hz",
    analogOrDigital: "Digital",
    description: "DIN-rail mountable industrial energy monitor communicating via long-range RS485 differential bus."
  },
  {
    id: "hlw8032",
    name: "HLW8032 High-Precision Energy Meter IC",
    model: "HLW8032",
    category: "power",
    signalType: "Digital UART (4800 Baud Continuous 24-byte Stream)",
    voltage: "5.0V DC (Opto-isolated from mains)",
    range: "Up to 260V AC, 16A",
    unit: "V, A, W, kWh",
    pins: ["VCC","GND","TX (4800 Baud Stream)"],
    serialSignature: /hlw8032|energy_stream/i,
    sampleOutput: "HLW8032: Voltage=238.1V, Current=0.92A, ActivePower=219.0W",
    analogOrDigital: "Digital",
    description: "Dedicated single-phase energy metering IC found in Sonoff and Shelly smart electrical switches."
  },
  {
    id: "ina219",
    name: "Texas Instruments INA219 DC Voltage & Current I2C",
    model: "INA219",
    category: "power",
    signalType: "Digital (I2C addr 0x40 - 0x45)",
    voltage: "3.0V – 5.5V Logic, measures 0 to 26V DC bus",
    range: "0 to 26V DC, ±3.2A (0.1 Ohm shunt)",
    unit: "V DC, mA, mW",
    pins: ["VCC","GND","SCL","SDA","VIN+","VIN-"],
    serialSignature: /ina219|bus_voltage\s*[:=]\s*(\d+(?:\.\d+)?)/i,
    sampleOutput: "INA219: Bus=12.42V, Shunt=84.2mV, Current=842mA, Power=10.45W",
    analogOrDigital: "Digital",
    description: "High-side current shunt and power monitor for solar arrays, battery chargers, and DC microgrids."
  },
  {
    id: "hcsr501",
    name: "HC-SR501 Passive Infrared (PIR) Motion Sensor",
    model: "HC-SR501",
    category: "motion",
    signalType: "Digital Output (High 3.3V / Low 0V)",
    voltage: "4.5V – 20.0V DC (Internal 3.3V regulator)",
    range: "Up to 7 meters (120° cone angle)",
    unit: "Digital State (0 or 1)",
    pins: ["VCC (+5V)","OUT (GPIO 14 / D3)","GND"],
    serialSignature: /hcsr501|pir_status|motion_detected|pir\s*[:=]\s*([01])/i,
    sampleOutput: "[SECURITY_ALARM] HC-SR501 PIR TRIGGERED! Motion Detected on Pin D12",
    analogOrDigital: "Digital",
    description: "Adjustable delay time and sensitivity pyroelectric sensor with dual-element sensor and Fresnel lens."
  },
  {
    id: "reed_switch",
    name: "Magnetic Reed Switch Intrusion Sensor",
    model: "MC-38 / Reed Switch",
    category: "motion",
    signalType: "Digital Contact Closure (Normally Closed / Open)",
    voltage: "Passive dry contact (3.3V or 5V pull-up)",
    range: "Contact distance 15-25 mm",
    unit: "Door State (0=Closed, 1=Open)",
    pins: ["TERMINAL 1 (GPIO 12 with pullup)","TERMINAL 2 (GND)"],
    serialSignature: /reed|door_state|door_open|reed_switch\s*[:=]\s*([01])/i,
    sampleOutput: "{\"door\": 1, \"status\": \"INTRUSION_ALERT\", \"reed_pin\": 12}",
    analogOrDigital: "Digital",
    description: "Hermetically sealed magnetic switch in ABS enclosure for window, door, and cabinet intrusion tracking."
  },
  {
    id: "rcwl0516",
    name: "RCWL-0516 Microwave Doppler Radar Motion",
    model: "RCWL-0516",
    category: "motion",
    signalType: "Digital (High 3.3V / Low 0V)",
    voltage: "4.0V – 28.0V DC",
    range: "3 to 7 meters 360° penetration (wood/drywall/glass)",
    unit: "Digital Trigger (0 or 1)",
    pins: ["3V3 Out","GND","OUT","VIN","CDS"],
    serialSignature: /rcwl0516|doppler_radar/i,
    sampleOutput: "RCWL-0516: Microwave Radar Triggered! Human Presence Through Wall",
    analogOrDigital: "Digital",
    description: "3.18 GHz Doppler microwave radar capable of detecting motion through walls, doors, and plastic casings."
  },
  {
    id: "ld2410",
    name: "Hi-Link HLK-LD2410 24GHz Human Static Presence mmWave",
    model: "HLK-LD2410B",
    category: "motion",
    signalType: "Digital UART (256000 Baud) + Bluetooth BLE Config",
    voltage: "5.0V DC (Logic 3.3V)",
    range: "0.75m to 6.0m (Moving & Stationary breath micro-motion)",
    unit: "Target State, Moving Dist, Static Dist, Energy",
    pins: ["VCC (+5V)","GND","UART_TX","UART_RX","OUT"],
    serialSignature: /ld2410|mmwave_presence|human_static/i,
    sampleOutput: "LD2410: Target=STATIC_PRESENCE, Dist=1.45m, MovingEnergy=0, StaticEnergy=68",
    analogOrDigital: "Digital",
    description: "Advanced 24 GHz millimeter-wave FMCW radar detecting stationary breathing occupants without moving."
  },
  {
    id: "hcsr04",
    name: "HC-SR04 Ultrasonic Distance Ranger",
    model: "HC-SR04",
    category: "motion",
    signalType: "Digital Pulse (Trigger 10µs, Echo PWM duration)",
    voltage: "5.0V DC",
    range: "2 cm to 400 cm (±3 mm accuracy)",
    unit: "cm / inches",
    pins: ["VCC (+5V)","TRIG (GPIO 15)","ECHO (GPIO 14 via divider)","GND"],
    serialSignature: /hc-?sr04|dist(?:ance)?\s*[:=]\s*(\d+(?:\.\d+)?)\s*(?:cm)?/i,
    sampleOutput: "DISTANCE_RAW: 24.6 cm, ECHO_TIME: 1432 us (HC-SR04)",
    analogOrDigital: "Digital",
    description: "40 kHz ultrasonic transmitter and receiver module measuring distance via acoustic flight time."
  },
  {
    id: "vl53l0x",
    name: "STMicroelectronics VL53L0X Time-of-Flight Laser Ranger",
    model: "VL53L0X",
    category: "motion",
    signalType: "Digital (I2C addr 0x29)",
    voltage: "2.6V – 3.5V (Module includes 3.3V regulator)",
    range: "50 mm to 2000 mm (True photon time-of-flight)",
    unit: "mm",
    pins: ["VIN","GND","SCL","SDA","XSHUT","GPIO1"],
    serialSignature: /vl53l0x|tof_dist\s*[:=]\s*(\d+)/i,
    sampleOutput: "VL53L0X: Laser Distance = 842 mm (High Accuracy Mode)",
    analogOrDigital: "Digital",
    description: "940nm VCSEL laser emitter measuring absolute distance independent of target surface reflectivity."
  },
  {
    id: "mpu6050",
    name: "InvenSense MPU-6050 6-Axis Gyro & Accelerometer",
    model: "MPU-6050",
    category: "motion",
    signalType: "Digital (I2C addr 0x68 / 0x69)",
    voltage: "3.0V – 5.0V (Onboard LDO)",
    range: "±2g/±4g/±8g/±16g, ±250/±500/±1000/±2000°/s",
    unit: "g, °/s, ° Tilt",
    pins: ["VCC","GND","SCL","SDA","XDA","XCL","AD0","INT"],
    serialSignature: /mpu6050|accel_x|gyro_z|pitch_roll/i,
    sampleOutput: "MPU6050: Accel[X=0.02g, Y=0.01g, Z=0.99g], Gyro[X=0, Y=0, Z=0], Pitch=1.2deg",
    analogOrDigital: "Digital",
    description: "6-degree-of-freedom inertial measurement unit with onboard Digital Motion Processor (DMP)."
  },
  {
    id: "adxl345",
    name: "Analog Devices ADXL345 3-Axis Digital Accelerometer",
    model: "ADXL345",
    category: "motion",
    signalType: "Digital (I2C / SPI)",
    voltage: "2.0V – 3.6V (Ultra-low power)",
    range: "±2g / ±4g / ±8g / ±16g (13-bit resolution)",
    unit: "mg / LSB",
    pins: ["VCC","GND","CS","INT1","INT2","SDO","SDA","SCL"],
    serialSignature: /adxl345|freefall_detect/i,
    sampleOutput: "ADXL345: Tap Detected! Acceleration Spike: X=2.4g, Y=0.8g, Z=1.1g",
    analogOrDigital: "Digital",
    description: "Measures dynamic acceleration from motion or shock, and static acceleration from gravitational tilt."
  },
  {
    id: "sw420",
    name: "SW-420 High Sensitivity Vibration Sensor",
    model: "SW-420",
    category: "motion",
    signalType: "Digital (Normally Closed switch + LM393 Comparator)",
    voltage: "3.3V – 5.0V",
    range: "Omnidirectional vibration trigger",
    unit: "Digital Pulse (0 or 1)",
    pins: ["VCC","GND","DO (Digital Out)"],
    serialSignature: /sw420|vibration_alarm/i,
    sampleOutput: "[TAMPER_ALARM] SW-420 Vibration Detected! Glass Break / Impact on Enclosure",
    analogOrDigital: "Digital",
    description: "Detects violent tampering, safe cracking, earthquake tremors, and window glass breakage."
  },
  {
    id: "am312",
    name: "AM312 Micro Miniature PIR Motion Sensor",
    model: "AM312",
    category: "motion",
    signalType: "Digital (High 3.3V)",
    voltage: "2.7V – 12.0V DC",
    range: "3 to 5 meters (100° cone)",
    unit: "Digital (0 or 1)",
    pins: ["VCC","OUT","GND"],
    serialSignature: /am312|mini_pir/i,
    sampleOutput: "AM312: Motion = 1 (Active Occupancy)",
    analogOrDigital: "Digital",
    description: "Compact low-power passive infrared sensor with internal digital signal processing."
  },
  {
    id: "tfmini_plus",
    name: "Benewake TFmini Plus Industrial ToF LiDAR",
    model: "TFmini Plus",
    category: "motion",
    signalType: "Digital UART (115200 Baud) / I2C",
    voltage: "5.0V DC (IP65 waterproof)",
    range: "0.1m to 12.0m (±5cm)",
    unit: "cm, signal strength",
    pins: ["+5V","GND","TXD","RXD"],
    serialSignature: /tfmini|lidar_dist/i,
    sampleOutput: "TFMINI: Dist=245cm, Strength=1820, Temp=32C",
    analogOrDigital: "Digital",
    description: "High-speed pulsed laser LiDAR capable of 1000Hz frame rates for perimeter tracking."
  },
  {
    id: "lj12a3",
    name: "LJ12A3-4-Z/BX Inductive Proximity Sensor",
    model: "LJ12A3-4-Z/BX",
    category: "motion",
    signalType: "Digital NPN Normally Open (Requires optocoupler/divider)",
    voltage: "6.0V – 36.0V DC",
    range: "4 mm ferrous metal detection",
    unit: "Digital (0 or 1)",
    pins: ["Brown (+12V/+24V)","Blue (GND)","Black (Signal Out)"],
    serialSignature: /lj12a3|proximity_metal/i,
    sampleOutput: "PROXIMITY_SWITCH: Metal Gate Closed (Black=LOW)",
    analogOrDigital: "Digital",
    description: "Industrial cylinder sensor detecting iron and steel gates, machinery valves, and motorized doors."
  },
  {
    id: "a3144",
    name: "A3144 Sensitive Hall Effect Magnetic Sensor",
    model: "A3144",
    category: "motion",
    signalType: "Digital Open-Collector (Requires 10k pullup)",
    voltage: "4.5V – 24.0V DC",
    range: "Magnetic flux density trigger (~50-350 Gauss)",
    unit: "Digital (0=Magnet Present, 1=No Field)",
    pins: ["VCC (+5V)","GND","VOUT (Open collector)"],
    serialSignature: /a3144|hall_switch/i,
    sampleOutput: "HALL_A3144: South Pole Detected! Motor RPM=1450",
    analogOrDigital: "Digital",
    description: "Solid-state magnetic field switch immune to mechanical contact bounce and dust contamination."
  },
  {
    id: "hcsr505",
    name: "HC-SR505 Mini PIR Occupancy Sensor",
    model: "HC-SR505",
    category: "motion",
    signalType: "Digital Output (High 3.3V)",
    voltage: "4.5V – 20.0V DC",
    range: "Up to 3 meters (100° cone angle)",
    unit: "Digital State (0 or 1)",
    pins: ["VCC","OUT","GND"],
    serialSignature: /hcsr505/i,
    sampleOutput: "HC-SR505: Output=HIGH (Motion In Wardrobe)",
    analogOrDigital: "Digital",
    description: "Ultra-small footprint PIR motion detector optimized for battery-powered closet and hallway automation."
  },
  {
    id: "ldr_gl5528",
    name: "GL5528 Photoresistor (LDR) Ambient Light",
    model: "GL5528 / LDR",
    category: "optical",
    signalType: "Analog Voltage (Divider with 10k resistor)",
    voltage: "3.3V or 5.0V",
    range: "1 Lux (Dark ~1M Ohm) to 10,000 Lux (Bright ~10k Ohm)",
    unit: "Lux / ADC (0-4095)",
    pins: ["VCC (+3.3V)","DIVIDER (ADC Pin 39 / A3)","GND"],
    serialSignature: /ldr|light_sensor|ambient_lux|ldr_adc\s*[:=]\s*(\d+)/i,
    sampleOutput: "LDR: ADC=3120, Ambient Light Level = 45 Lux (Dusk)",
    analogOrDigital: "Analog",
    description: "Cadmium sulfide (CdS) photoconductive cell varying internal resistance in response to ambient photons."
  },
  {
    id: "bh1750",
    name: "ROHM BH1750FVI Digital Ambient Light Meter",
    model: "BH1750",
    category: "optical",
    signalType: "Digital (I2C addr 0x23 / 0x5C)",
    voltage: "2.4V – 3.6V (Module includes 3.3V LDO)",
    range: "1 to 65,535 Lux (High resolution 1 Lux)",
    unit: "Lux",
    pins: ["VCC","GND","SCL","SDA","ADDR"],
    serialSignature: /bh1750|lux\s*[:=]\s*(\d+(?:\.\d+)?)/i,
    sampleOutput: "BH1750: Illuminance = 428.5 Lux [Reading Indoor Office]",
    analogOrDigital: "Digital",
    description: "Photodiode with spectral response closely matching the human eye photopic luminosity curve."
  },
  {
    id: "tsl2561",
    name: "ams TSL2561 Dual-Diode Luminosity Sensor",
    model: "TSL2561",
    category: "optical",
    signalType: "Digital (I2C addr 0x29/0x39/0x49)",
    voltage: "2.7V – 3.6V",
    range: "0.1 to 40,000 Lux",
    unit: "Lux (Visible + Infrared)",
    pins: ["VIN","GND","SCL","SDA"],
    serialSignature: /tsl2561/i,
    sampleOutput: "TSL2561: Broadband=842, IR=120 -> Exact Lux = 312.4",
    analogOrDigital: "Digital",
    description: "Dual photodiodes measuring both visible and infrared spectrum to calculate precise lux under any light source."
  },
  {
    id: "tsl2591",
    name: "ams TSL2591 High Dynamic Range Lux Sensor",
    model: "TSL2591",
    category: "optical",
    signalType: "Digital (I2C addr 0x29)",
    voltage: "3.3V – 5.0V",
    range: "188 µLux to 88,000 Lux (600,000,000:1 Dynamic Range)",
    unit: "Lux",
    pins: ["VIN","GND","SCL","SDA","INT"],
    serialSignature: /tsl2591/i,
    sampleOutput: "TSL2591: Lux=0.045 Lux (Starlight Night Sensitivity)",
    analogOrDigital: "Digital",
    description: "Extreme dynamic range light sensor capable of measuring from full noon sunlight down to moonless night."
  },
  {
    id: "max30102",
    name: "Maxim MAX30102 High-Sensitivity Pulse Oximeter",
    model: "MAX30102",
    category: "optical",
    signalType: "Digital (I2C addr 0x57)",
    voltage: "1.8V core, 3.3V I2C logic",
    range: "Heart Rate 30-220 BPM, SpO2 70-100%",
    unit: "BPM, % SpO2",
    pins: ["VIN (3.3V)","GND","SCL","SDA","INT"],
    serialSignature: /max30102|spo2\s*[:=]\s*(\d+).*?bpm\s*[:=]\s*(\d+)/i,
    sampleOutput: "{\"sensor\":\"MAX30102\",\"bpm\":74,\"spo2\":98.4,\"finger\":true}",
    analogOrDigital: "Digital",
    description: "Integrated red and IR LEDs with photodetector and low-noise analog front-end for biometric vital monitoring."
  },
  {
    id: "mlx90614",
    name: "Melexis MLX90614 Non-Contact Infrared Thermometer",
    model: "MLX90614-DCI",
    category: "optical",
    signalType: "Digital (SMBus / I2C addr 0x5A)",
    voltage: "3.0V – 3.6V (or 5V variant)",
    range: "-40°C to 125°C ambient, -70°C to 380°C object (±0.5°C)",
    unit: "°C Ambient, °C Object",
    pins: ["VIN","GND","SCL","SDA"],
    serialSignature: /mlx90614|object_temp\s*[:=]\s*([+-]?\d+(?:\.\d+)?)/i,
    sampleOutput: "MLX90614: Ambient=24.2C, Target Object Temp=36.6C (Human Forehead)",
    analogOrDigital: "Digital",
    description: "Thermopile IR detector with custom optical filter measuring surface heat emission without physical contact."
  },
  {
    id: "amg8833",
    name: "Panasonic AMG8833 Grid-EYE 8x8 Thermal Infrared Camera",
    model: "AMG8833",
    category: "optical",
    signalType: "Digital (I2C addr 0x69)",
    voltage: "3.3V – 5.0V",
    range: "0°C to 80°C (64 independent pixel array)",
    unit: "64 temperature values (°C)",
    pins: ["VIN","GND","SCL","SDA","INT"],
    serialSignature: /amg8833|thermal_matrix|grideye/i,
    sampleOutput: "AMG8833: Thermal Frame [8x8]: Max=36.4C at (3,4), Min=22.1C",
    analogOrDigital: "Digital",
    description: "64-pixel thermopile array providing thermal image heat mapping of humans sitting or moving in rooms."
  },
  {
    id: "ky026",
    name: "KY-026 High Sensitivity Flame Detection Module",
    model: "KY-026",
    category: "optical",
    signalType: "Analog ADC + Digital DO Comparator",
    voltage: "3.3V – 5.5V",
    range: "760 nm to 1100 nm (60° detection angle)",
    unit: "Analog Intensity / Digital Fire Trigger",
    pins: ["VCC","GND","DO","AO"],
    serialSignature: /ky-?026|flame_detect|fire_alarm/i,
    sampleOutput: "[FIRE_ALARM] KY-026 Flame Sensor Tripped! Raw AO=120 (Open Flame Detected)",
    analogOrDigital: "Analog/Digital",
    description: "Infrared receiver photodiode tuned specifically to the radiation wavelength emitted by open fire flames."
  },
  {
    id: "guva_s12sd",
    name: "GUVA-S12SD Solar Ultraviolet (UV) Light Sensor",
    model: "GUVA-S12SD",
    category: "optical",
    signalType: "Analog Voltage (Linear UV Index)",
    voltage: "2.5V – 5.0V",
    range: "240 nm to 370 nm (UVA and UVB bands)",
    unit: "UV Index (0 to 11+)",
    pins: ["VCC","GND","OUT (Analog ADC)"],
    serialSignature: /guva|uv_index\s*[:=]\s*(\d+(?:\.\d+)?)/i,
    sampleOutput: "GUVA-S12SD: Vout=310mV -> UV Index = 3.1 (Moderate Sun Exposure)",
    analogOrDigital: "Analog",
    description: "Gallium nitride photodiode measuring solar ultraviolet irradiance to alert against excessive skin exposure."
  },
  {
    id: "as7262",
    name: "ams AS7262 6-Channel Visible Spectral Sensor",
    model: "AS7262",
    category: "optical",
    signalType: "Digital (I2C addr 0x49 or AT UART 115200)",
    voltage: "2.7V – 3.6V",
    range: "450nm, 500nm, 550nm, 570nm, 600nm, 650nm (40nm FWHM)",
    unit: "µW/cm²",
    pins: ["VDD","GND","RX/SCL","TX/SDA","INT","RST"],
    serialSignature: /as7262|spectral_channels/i,
    sampleOutput: "AS7262: V=120, B=240, G=380, Y=410, O=290, R=180 uW/cm2",
    analogOrDigital: "Digital",
    description: "Multi-spectral color analyzer identifying fluid contamination, light spectra, and chemical color changes."
  },
  {
    id: "veml7700",
    name: "Vishay VEML7700 High-Accuracy Ambient Light",
    model: "VEML7700",
    category: "optical",
    signalType: "Digital (I2C addr 0x10)",
    voltage: "2.5V – 3.6V",
    range: "0 to 120,000 Lux (16-bit resolution down to 0.0036 lx)",
    unit: "Lux",
    pins: ["VIN","GND","SCL","SDA"],
    serialSignature: /veml7700/i,
    sampleOutput: "VEML7700: Ambient Light = 345.12 Lux",
    analogOrDigital: "Digital",
    description: "High-precision photodiode IC with optical filter suppressing infrared radiation for true human perception."
  },
  {
    id: "tcs34725",
    name: "ams TCS34725 RGB Color Sensor with IR Filter",
    model: "TCS34725",
    category: "optical",
    signalType: "Digital (I2C addr 0x29)",
    voltage: "3.3V",
    range: "Color Temperature (K), Lux, Red, Green, Blue, Clear",
    unit: "RGB Color, Lux, Color Temp",
    pins: ["VIN","GND","SCL","SDA","LED","INT"],
    serialSignature: /tcs34725|color_rgb/i,
    sampleOutput: "TCS34725: R=210, G=180, B=140, Clear=530 -> Temp=3400K (Warm White)",
    analogOrDigital: "Digital",
    description: "Color sensor with localized IR blocking filter for accurate RGB color identification and sorting."
  },
  {
    id: "cap_soil_v12",
    name: "Capacitive Soil Moisture Sensor v1.2",
    model: "HW-390 / Cap-v1.2",
    category: "liquid",
    signalType: "Analog Voltage (Corrosion resistant)",
    voltage: "3.3V – 5.5V DC",
    range: "Dry Air (~3.0V / ADC 3000) to Wet Water (~1.2V / ADC 1200)",
    unit: "% Moisture",
    pins: ["VCC","GND","AOUT (Analog ADC A0)"],
    serialSignature: /cap_soil|soil_moisture\s*[:=]\s*(\d+(?:\.\d+)?)\s*(?:%)?/i,
    sampleOutput: "SOIL_CAPACITIVE: Raw ADC=1740 -> Moisture = 62.4% (Optimal)",
    analogOrDigital: "Analog",
    description: "Measures soil dielectric permittivity using high-frequency capacitive resonance without exposed metal electrode corrosion."
  },
  {
    id: "res_soil_moisture",
    name: "Resistive Soil Moisture Probe Module",
    model: "YL-69 / FC-28",
    category: "liquid",
    signalType: "Analog ADC + Digital DO",
    voltage: "3.3V – 5.0V",
    range: "Conductivity between gold-plated prongs",
    unit: "ADC (0-1023)",
    pins: ["VCC","GND","DO","AO"],
    serialSignature: /yl69|resistive_soil/i,
    sampleOutput: "RESISTIVE_SOIL: AO=450, DO=LOW (Soil Adequately Hydrated)",
    analogOrDigital: "Analog/Digital",
    description: "Economical two-prong conductivity probe for indoor potted plants and gardening automated watering systems."
  },
  {
    id: "submersible_level",
    name: "Submersible Hydrostatic Liquid Level Transmitter",
    model: "TL-136 / HPT200",
    category: "liquid",
    signalType: "Analog (4-20mA Current Loop or 0-5V Voltage)",
    voltage: "12V – 24V DC excitation",
    range: "0 to 5 meters water depth (0.5% FS accuracy)",
    unit: "Meters / PSI / Liters",
    pins: ["Red (VCC +24V)","Black (Signal Out 4-20mA)","Atmospheric Vent Tube"],
    serialSignature: /hydrostatic|water_depth\s*[:=]\s*(\d+(?:\.\d+)?)\s*(?:m)?/i,
    sampleOutput: "HYDROSTATIC_LEVEL: Loop=12.4mA -> Tank Depth = 2.62 meters (5240 Liters)",
    analogOrDigital: "Analog",
    description: "Stainless steel 316L diaphragm immersed at the bottom of overhead storage tanks for continuous hydrostatic water column level."
  },
  {
    id: "jsn_sr04t",
    name: "JSN-SR04T Waterproof Ultrasonic Level Sensor",
    model: "JSN-SR04T-2.0",
    category: "liquid",
    signalType: "Digital Pulse (Trig/Echo) or Serial UART mode",
    voltage: "3.0V – 5.5V DC",
    range: "20 cm to 600 cm (Hermetic waterproof probe)",
    unit: "cm",
    pins: ["5V","GND","TRIG (TX)","ECHO (RX)"],
    serialSignature: /jsn_sr04t|waterproof_dist/i,
    sampleOutput: "JSN-SR04T: Water Tank Air Gap = 42.0 cm -> Liquid Fullness = 86%",
    analogOrDigital: "Digital",
    description: "Weatherproof enclosed transducer for outdoor rain barrels, septic tanks, and wet sump pits."
  },
  {
    id: "float_switch",
    name: "Vertical Magnetic Float Liquid Level Switch",
    model: "PP Float Switch",
    category: "liquid",
    signalType: "Digital Contact Closure (Reed Switch in Stem)",
    voltage: "Up to 100V DC (Dry contact)",
    range: "High Level Overflow / Low Level Dry Run",
    unit: "Digital State (0 or 1)",
    pins: ["Lead 1 (GPIO with internal pullup)","Lead 2 (GND)"],
    serialSignature: /float_switch|tank_overflow|sump_float/i,
    sampleOutput: "[TANK_ALARM] Upper Float Switch Closed! Overflow Prevention Valve Tripped",
    analogOrDigital: "Digital",
    description: "Polypropylene magnetic float ring closing an internal reed switch for fail-safe high/low level protection."
  },
  {
    id: "yfs201",
    name: "YF-S201 Hall Effect Water Flow Rate Sensor",
    model: "YF-S201 (1/2\" Pipe)",
    category: "liquid",
    signalType: "Digital Frequency Pulse (7.5 pulses / second per 1 L/min)",
    voltage: "5.0V – 18.0V DC",
    range: "1 to 30 Liters/minute (Water pressure <= 1.75 MPa)",
    unit: "L/min, Total Liters",
    pins: ["Red (VCC +5V)","Black (GND)","Yellow (Pulse Out to GPIO interrupt)"],
    serialSignature: /yfs201|flow_rate\s*[:=]\s*(\d+(?:\.\d+)?)\s*(?:l\/min)?/i,
    sampleOutput: "YF-S201: Flow = 6.4 L/min, Frequency = 48 Hz, Total = 184.2 Liters",
    analogOrDigital: "Digital (Pulse)",
    description: "Water wheel turbine with embedded neodymium magnet generating square-wave pulses for municipal pipe flow rate."
  },
  {
    id: "tds_sensor",
    name: "Analog Total Dissolved Solids (TDS) Water Meter",
    model: "CQRobot TDS Meter",
    category: "liquid",
    signalType: "Analog Voltage (0-2.3V)",
    voltage: "3.3V – 5.5V",
    range: "0 to 1000 ppm (Clean drinking water < 300 ppm)",
    unit: "ppm TDS",
    pins: ["VCC","GND","AOUT (Analog Pin A0)","Waterproof Probe"],
    serialSignature: /tds_meter|tds_ppm\s*[:=]\s*(\d+)/i,
    sampleOutput: "TDS_METER: Vout=1.12V -> TDS = 142 ppm (Purified Drinking Water)",
    analogOrDigital: "Analog",
    description: "Measures electrical conductivity of dissolved minerals and salts in reverse osmosis drinking water."
  },
  {
    id: "ph_sensor_e201",
    name: "Analog pH Meter Pro Kit with E-201-C Probe",
    model: "E-201-C / pH-4502C",
    category: "liquid",
    signalType: "Analog Voltage (Centering at 2.5V for neutral pH 7.0)",
    voltage: "5.0V DC",
    range: "0.00 to 14.00 pH (±0.1 pH at 25°C)",
    unit: "pH units",
    pins: ["VCC","GND","Po (Analog ADC)","To (Temp)","Do (Limit)"],
    serialSignature: /ph_sensor|ph_val(?:ue)?\s*[:=]\s*(\d+(?:\.\d+)?)/i,
    sampleOutput: "PH_METER: Vout=2.48V -> pH = 7.04 (Neutral Balance)",
    analogOrDigital: "Analog",
    description: "Glass bulb combination electrode generating millivolt potentials proportional to hydrogen ion concentration."
  },
  {
    id: "optical_level",
    name: "Optical Liquid Level Infrared Prism Sensor",
    model: "FS-IR02",
    category: "liquid",
    signalType: "Digital (High in air, Low in liquid)",
    voltage: "5.0V DC",
    range: "Immediate point contact detection",
    unit: "Digital State (0 or 1)",
    pins: ["VCC (+5V)","GND","OUT"],
    serialSignature: /optical_level|prism_liquid/i,
    sampleOutput: "OPTICAL_LEVEL: Prism Immersed in Liquid (State=0, Condensation Immune)",
    analogOrDigital: "Digital",
    description: "Infrared LED and phototransistor reflecting light inside a conical prism; total internal reflection breaks when immersed."
  },
  {
    id: "raindrop_sensor",
    name: "Raindrop & Sleet Precipitation Detector",
    model: "MH-RD / Rain Sensor",
    category: "liquid",
    signalType: "Analog ADC + Digital DO",
    voltage: "3.3V – 5.0V",
    range: "Dry (1023) to Heavy Rain (0)",
    unit: "Analog Precipitation Intensity",
    pins: ["VCC","GND","DO","AO"],
    serialSignature: /raindrop|rain_detected/i,
    sampleOutput: "RAIN_SENSOR: Heavy Precipitation Detected! AO=240, Auto-closing Roof Windows",
    analogOrDigital: "Analog/Digital",
    description: "Nickel-plated serpentine circuit board detecting raindrops to trigger automated motorized storm shutters."
  },
  {
    id: "pressure_transducer",
    name: "0-1.2 MPa Water / Oil Pressure Transducer",
    model: "G1/4\" Pressure Sender",
    category: "liquid",
    signalType: "Analog Voltage (0.5V to 4.5V linear)",
    voltage: "5.0V DC",
    range: "0 to 1.2 MPa (~0 to 174 PSI)",
    unit: "PSI / Bar / MPa",
    pins: ["Red (VCC +5V)","Black (GND)","Yellow (Signal Out 0.5-4.5V)"],
    serialSignature: /pipe_pressure|psi\s*[:=]\s*(\d+(?:\.\d+)?)/i,
    sampleOutput: "WATER_PRESSURE: Vout=2.50V -> Pressure = 0.60 MPa (87.0 PSI)",
    analogOrDigital: "Analog",
    description: "Piezoresistive ceramic pressure sensor for closed-loop domestic booster pump water pressure control."
  },
  {
    id: "yfb1_flow",
    name: "YF-B1 Brass High-Pressure Flow Meter",
    model: "YF-B1 (G1/2\" Brass)",
    category: "liquid",
    signalType: "Digital Pulse (Frequency = 11 * Q)",
    voltage: "5.0V – 15.0V DC",
    range: "1 to 25 L/min (Solid brass up to 1.75 MPa)",
    unit: "L/min",
    pins: ["Red","Black","Yellow"],
    serialSignature: /yfb1|brass_flow/i,
    sampleOutput: "YF-B1 Brass Sensor: Flow = 3.2 L/min, Water Temp = 42C (Boiler)",
    analogOrDigital: "Digital (Pulse)",
    description: "Heavy duty forged brass water flow sensor suitable for high-temperature solar water heaters."
  },
  {
    id: "turbidity_sensor",
    name: "Analog Turbidity Sensor for Water Quality",
    model: "TS-300B",
    category: "liquid",
    signalType: "Analog Voltage (4.5V clear down to 0V muddy)",
    voltage: "5.0V DC",
    range: "0 to 3000 NTU (Nephelometric Turbidity Units)",
    unit: "NTU / Volts",
    pins: ["VCC","GND","AOUT"],
    serialSignature: /turbidity|ntu\s*[:=]\s*(\d+)/i,
    sampleOutput: "TURBIDITY: Vout=4.1V -> Turbidity = 15 NTU (Clear Tap Water)",
    analogOrDigital: "Analog",
    description: "Measures suspended solid particles in wastewater, washing machines, and river monitoring stations."
  },
  {
    id: "non_contact_level",
    name: "XKC-Y25-V Non-Contact Capacitive Liquid Level",
    model: "XKC-Y25-V",
    category: "liquid",
    signalType: "Digital High/Low (Through non-metallic tank walls)",
    voltage: "5.0V – 24.0V DC",
    range: "Detects through plastic/glass walls up to 20mm thick",
    unit: "Digital State (0 or 1)",
    pins: ["Brown (VCC)","Blue (GND)","Yellow (OUT)","Black (Mode)"],
    serialSignature: /xkc_y25|noncontact_level/i,
    sampleOutput: "NON_CONTACT_LEVEL: Tank High Mark Reached through 8mm Polyethylene Wall",
    analogOrDigital: "Digital",
    description: "Sticks to exterior tank surface; detects liquid presence inside without drilling holes or touching chemicals."
  },
  {
    id: "solenoid_valve_12v",
    name: "12V Brass Electric Solenoid Gas/Water Valve",
    model: "2W-160-15 / Solenoid Valve",
    category: "actuator",
    signalType: "Digital Actuator (MOSFET / Relay Driven 12V DC)",
    voltage: "12V DC (1.5A inrush, 0.8A hold)",
    range: "Normally Closed (NC) / Normally Open (NO)",
    unit: "State (OPEN / CLOSED)",
    pins: ["V+ (+12V via Relay/MOSFET)","V- (GND)","Flyback Diode Protected"],
    serialSignature: /solenoid_valve|gas_valve_state|valve\s*[:=]\s*(open|closed)/i,
    sampleOutput: "[SOLENOID_VALVE] State: CLOSED, Pulse: 12V 100ms, Gas Safety Interlock: ACTIVE",
    analogOrDigital: "Actuator",
    description: "Direct-acting brass electromagnetic solenoid valve for instantaneous gas or water supply shutoff during leaks."
  },
  {
    id: "motorized_ball_valve",
    name: "Motorized Brass Ball Valve (3-Wire CR02)",
    model: "DN15-CR02 Motorized Valve",
    category: "actuator",
    signalType: "Digital Actuator (Open/Close Limit Feedback)",
    voltage: "9V – 24V DC",
    range: "Full bore rotation 90° in 5 seconds (Zero pressure drop)",
    unit: "State (OPEN / CLOSED / TRAVELING)",
    pins: ["Red (VCC)","Blue (GND)","Yellow (Open/Close Control Signal)"],
    serialSignature: /motorized_valve|ball_valve_state/i,
    sampleOutput: "MOTORIZED_BALL_VALVE: Position=CLOSED, LimitSwitch=REACHED, Current=0mA",
    analogOrDigital: "Actuator",
    description: "Low-power motorized ball valve consuming zero standby power with internal limit switches at full stroke."
  },
  {
    id: "gas_manipulator_valve",
    name: "Automatic Gas Pipeline Shutoff Manipulator Arm",
    model: "DN20 Gas Pipe Manipulator",
    category: "actuator",
    signalType: "Digital Actuator (12V Pulse 1A)",
    voltage: "8V – 16V DC",
    range: "Clamps directly onto manual gas ball valve handle (90° turn)",
    unit: "Safety State (OPEN / CLOSED)",
    pins: ["Red (+12V)","Black (GND)","Manual Pull-Ring Clutch"],
    serialSignature: /manipulator|gas_shutoff_arm/i,
    sampleOutput: "[SAFETY_INTERLOCK] Gas Shutoff Manipulator Arm Triggered! Valve Turned 90 deg OFF",
    analogOrDigital: "Actuator",
    description: "Clamps onto existing manual residential gas valve handle without cutting pipes; auto-closes during gas alarms."
  },
  {
    id: "tuya_smart_ac",
    name: "Tuya WiFi Smart Air Conditioner Gateway Controller",
    model: "Tuya Smart AC Controller",
    category: "actuator",
    signalType: "Digital Serial / WiFi Cloud (MQTT / Tuya Protocol)",
    voltage: "5V DC Micro-USB or 12V AC/DC",
    range: "Cool / Heat / Fan / Dry, Temp Setpoint 16°C to 30°C",
    unit: "Mode, SetTemp, FanSpeed, Power",
    pins: ["TX (UART 9600)","RX (UART 9600)","5V","GND","IR Blaster Array"],
    serialSignature: /tuya_smart_ac|smart_ac\s*[:=]|air_conditioner/i,
    sampleOutput: "TUYA_SMART_AC: Power=ON, Mode=COOL, SetTemp=22C, FanSpeed=AUTO, Ambient=25.4C",
    analogOrDigital: "Actuator",
    description: "Full AC climate controller supporting split systems via local UART serial or 360-degree infrared emission."
  },
  {
    id: "midea_ac_uart",
    name: "Midea Split AC UART Serial Dongle Interface",
    model: "Midea OSK-103 UART Bridge",
    category: "actuator",
    signalType: "Digital UART (9600 Baud Full Duplex Serial Protocol)",
    voltage: "5.0V DC (From AC indoor mainboard header)",
    range: "Full bidirectional compressor telemetry, power consumption",
    unit: "Target Temp, Room Temp, Compressor Hz",
    pins: ["VCC (+5V)","TXD","RXD","GND"],
    serialSignature: /midea_ac|osk103|ac_telemetry/i,
    sampleOutput: "MIDEA_AC: Power=ON, Compressor=42Hz, Target=23C, Indoor=24.5C, Fan=MED",
    analogOrDigital: "Actuator",
    description: "Direct motherboard serial connection to Midea/Carrier indoor AC units reading true internal sensor metrics."
  },
  {
    id: "mitsubishi_cn105",
    name: "Mitsubishi Heatpump CN105 Serial Protocol Interface",
    model: "Mitsubishi CN105 HVAC",
    category: "actuator",
    signalType: "Digital UART (2400 Baud, 8-E-1 Parity, Inverted)",
    voltage: "5.0V or 12V DC",
    range: "Vane direction, mode, room temp, fault codes",
    unit: "HVAC Status Packet",
    pins: ["Pin 1 (12V)","Pin 2 (GND)","Pin 3 (5V)","Pin 4 (TX)","Pin 5 (RX)"],
    serialSignature: /cn105|mitsubishi_hvac/i,
    sampleOutput: "MITSUBISHI_CN105: Mode=HEAT, RoomTemp=21.0C, Target=22.0C, Vane=SWING",
    analogOrDigital: "Actuator",
    description: "Direct diagnostic connector on Mitsubishi mini-split heat pumps for local smart building integration."
  },
  {
    id: "daikin_s21",
    name: "Daikin S21 Serial Split AC Interface",
    model: "Daikin S21 Port",
    category: "actuator",
    signalType: "Digital UART (2400 Baud 8-E-1)",
    voltage: "5.0V DC",
    range: "Compressor speed, expansion valve, coil temperature",
    unit: "Daikin Serial Frame",
    pins: ["5V","GND","TX","RX"],
    serialSignature: /daikin_s21|daikin_split/i,
    sampleOutput: "DAIKIN_S21: Power=ON, Mode=COOL, Target=24C, ReturnAir=26.2C",
    analogOrDigital: "Actuator",
    description: "Factory serial port on Daikin indoor units for centralized energy management."
  },
  {
    id: "modbus_thermostat",
    name: "Modbus RTU RS485 Wall Climate Thermostat",
    model: "BACnet / Modbus Thermostat",
    category: "actuator",
    signalType: "Digital RS485 Modbus RTU (Half Duplex 9600 Baud)",
    voltage: "24V AC or 110-220V AC",
    range: "Fan Coil Unit 3-speed, Water Valve, Setpoint 10-35°C",
    unit: "Holding Registers 40001-40020",
    pins: ["RS485 A+","RS485 B-","24V L","24V N","Valve Relay","Fan Low/Med/High"],
    serialSignature: /modbus_thermostat|fcu_temp/i,
    sampleOutput: "MODBUS_THERMOSTAT [ID 0x01]: Setpoint=23.0C, Fan=HIGH, Valve=OPEN, Room=24.8C",
    analogOrDigital: "Actuator",
    description: "Commercial building automation room thermostat managing 2-pipe/4-pipe chilled water fan coil units."
  },
  {
    id: "ir_ac_remote_blaster",
    name: "Universal Infrared (IR) AC Remote Blaster",
    model: "IR Blaster 38kHz / ESP32",
    category: "actuator",
    signalType: "PWM Modulated Infrared (38 kHz Carrier Frequency)",
    voltage: "3.3V or 5.0V DC (High-current NPN transistor)",
    range: "All AC brands (Panasonic, LG, Gree, Daikin, Samsung, Midea)",
    unit: "IR Protocol Hex Code",
    pins: ["VCC (+5V)","GND","SIGNAL (PWM GPIO 4)"],
    serialSignature: /ir_blaster|ir_ac_command/i,
    sampleOutput: "IR_BLASTER: Transmitted Gree Protocol [0x1102A024C5F0] -> Set AC 24C Cool",
    analogOrDigital: "Actuator",
    description: "High-power 940nm infrared LED transmitting full climate state packets mimicking handheld remotes."
  },
  {
    id: "relay_1ch",
    name: "1-Channel 5V Optocoupled Relay Module",
    model: "SRD-05VDC-SL-C",
    category: "actuator",
    signalType: "Digital Control (Active Low or Active High)",
    voltage: "5.0V DC coil, contacts rated 250V AC 10A / 30V DC 10A",
    range: "On / Off switching (NO/NC)",
    unit: "Relay State (0 or 1)",
    pins: ["VCC (+5V)","GND","IN (GPIO 4)","NO","COM","NC"],
    serialSignature: /relay|exhaust_fan|relay_state\s*[:=]\s*([01])/i,
    sampleOutput: "{\"relay\": 1, \"target\": \"EXHAUST_FAN\", \"gpio\": 4, \"state\": \"ENERGIZED\"}",
    analogOrDigital: "Actuator",
    description: "Optically isolated mechanical relay switching ventilation exhaust fans, water heaters, and lights."
  },
  {
    id: "relay_4ch",
    name: "4-Channel 10A Relay Control Board",
    model: "4-Ch Relay Board",
    category: "actuator",
    signalType: "Digital (4 independent GPIO lines or I2C expander)",
    voltage: "5.0V DC, 250V AC 10A per channel",
    range: "Controls 4 independent electrical circuits",
    unit: "Bitmask (0b0000 to 0b1111)",
    pins: ["VCC","GND","IN1","IN2","IN3","IN4"],
    serialSignature: /relay_4ch|relays_bitmask/i,
    sampleOutput: "RELAYS_4CH: CH1(Fan)=ON, CH2(Pump)=OFF, CH3(Valve)=ON, CH4(Light)=OFF",
    analogOrDigital: "Actuator",
    description: "Bank of 4 optically isolated relays for multi-stage room power sequencing and HVAC staging."
  },
  {
    id: "ssr_25da",
    name: "Solid State Relay (SSR-25DA) 25A 240V AC",
    model: "SSR-25DA",
    category: "actuator",
    signalType: "Digital DC Control (Zero-crossing optocoupler)",
    voltage: "Control 3-32V DC, Output 24-380V AC 25A",
    range: "Zero acoustic noise, unlimited switching cycles",
    unit: "State / PWM Duty Cycle",
    pins: ["Terminal 3 (DC +)","Terminal 4 (DC -)","Terminal 1 (AC Load)","Terminal 2 (AC Line)"],
    serialSignature: /ssr_25da|solid_state_relay/i,
    sampleOutput: "SSR_25DA: Trigger=HIGH, AC Current Flowing, Zero-Cross Active, No Contact Wear",
    analogOrDigital: "Actuator",
    description: "Silent solid state relay without mechanical contacts; ideal for proportional PID heating element control."
  },
  {
    id: "belimo_damper",
    name: "HVAC Motorized Air Damper Actuator 24V AC/DC",
    model: "Belimo LM24A",
    category: "actuator",
    signalType: "Analog Control (0-10V DC) or Digital (Floating 3-point)",
    voltage: "24V AC/DC",
    range: "0° to 90° rotation in 90 seconds (5 Nm torque)",
    unit: "% Damper Opening (0 to 100%)",
    pins: ["1 (System Ground)","2 (24V Supply)","3 (Control 0-10V)","5 (Feedback 0-10V)"],
    serialSignature: /damper_actuator|belimo_hvac/i,
    sampleOutput: "BELIMO_DAMPER: Command=6.5V -> Position=65% Open (Fresh Air Intake)",
    analogOrDigital: "Actuator",
    description: "Modulating damper actuator controlling fresh air intake in central ventilation air handling units (AHU)."
  },
  {
    id: "thermal_wax_actuator",
    name: "24V Thermoelectric Radiator Valve Actuator",
    model: "Wax Thermal Actuator",
    category: "actuator",
    signalType: "Digital On/Off or PWM (Thermoelectric Expansion)",
    voltage: "24V AC/DC (2W consumption)",
    range: "Stroke 4 mm (Opens in 3 minutes)",
    unit: "Valve Stroke (Closed / Open)",
    pins: ["Brown (Live 24V)","Blue (Neutral 24V)"],
    serialSignature: /radiator_actuator|thermal_valve/i,
    sampleOutput: "THERMAL_ACTUATOR: Room 1 Underfloor Heating Circuit: ENERGIZED (Opening)",
    analogOrDigital: "Actuator",
    description: "Silent wax-expansion actuator controlling underfloor hydronic heating and radiator manifolds."
  },
  {
    id: "sg90_servo",
    name: "TowerPro SG90 9g Micro Servo Motor",
    model: "SG90 Micro Servo",
    category: "actuator",
    signalType: "Digital PWM (50 Hz, 1ms to 2ms pulse width)",
    voltage: "4.8V – 6.0V DC",
    range: "0° to 180° rotation",
    unit: "Degrees (0 - 180°)",
    pins: ["Brown (GND)","Red (+5V)","Orange (PWM GPIO 18)"],
    serialSignature: /sg90|servo_angle\s*[:=]\s*(\d{1,3})/i,
    sampleOutput: "SERVO_SG90: Angle = 90 deg (Air Vent Flap Half Open)",
    analogOrDigital: "Actuator",
    description: "Compact servo motor for directional camera pan/tilt, window lock latches, and mechanical air louvers."
  },
  {
    id: "mg996r_servo",
    name: "MG996R Metal Gear High-Torque Servo",
    model: "MG996R",
    category: "actuator",
    signalType: "Digital PWM (50 Hz pulse)",
    voltage: "4.8V – 7.2V DC (Stall current 2.5A)",
    range: "0° to 180° (11 kg-cm torque at 6V)",
    unit: "Degrees",
    pins: ["Brown (GND)","Red (+6V)","Orange (PWM)"],
    serialSignature: /mg996r|torque_servo/i,
    sampleOutput: "MG996R: Heavy Lock Cylinder Engaged (Torque=9.2 kg-cm, Angle=180)",
    analogOrDigital: "Actuator",
    description: "All-metal gearing high torque servo for mechanical deadbolt locks and heavy emergency shutoff valves."
  },
  {
    id: "lywsd03mmc",
    name: "Xiaomi Mijia BLE Temperature & Humidity Sensor",
    model: "LYWSD03MMC (Custom ATC Firmware)",
    category: "wireless",
    signalType: "Wireless BLE 5.0 (Bluetooth Advertising Beacon)",
    voltage: "3.0V (CR2032 Lithium Coin Cell, 1.5 year battery life)",
    range: "0°C to 60°C (±0.1°C), 0% to 99% RH (±1%)",
    unit: "°C, %, Battery mV, RSSI dBm",
    pins: ["Wireless (MAC Address: C4:7F:51:xx:xx:xx)"],
    serialSignature: /lywsd03mmc|ble_env_beacon|ble_temp/i,
    sampleOutput: "BLE_ENV_BEACON [C4:7F:51:22:A1:04] Temp: 23.4C, Hum: 48%, Batt: 92%, RSSI: -64dBm",
    analogOrDigital: "Digital",
    description: "Ultra-popular battery Bluetooth beacon transmitting environmental telemetry over passive BLE advertisements."
  },
  {
    id: "inkbird_ibs_th2",
    name: "Inkbird IBS-TH2 Waterproof BLE Beacon Sensor",
    model: "IBS-TH2 Plus",
    category: "wireless",
    signalType: "Wireless Bluetooth Low Energy (BLE)",
    voltage: "2x AAA Battery (Over 1 year battery)",
    range: "-40°C to 60°C (External probe up to 100°C)",
    unit: "°C, %, RSSI",
    pins: ["Wireless (Bluetooth 5.0)"],
    serialSignature: /inkbird|ibs_th2/i,
    sampleOutput: "INKBIRD_BLE [s/n: 20048123]: Temp = -18.2C (Freezer), Batt = 98%, RSSI = -72dBm",
    analogOrDigital: "Digital",
    description: "Waterproof IPX4 temperature and humidity logger for sub-zero food freezers and outdoor greenhouses."
  },
  {
    id: "ruuvitag",
    name: "RuuviTag Pro Industrial Bluetooth Multi-Sensor",
    model: "RuuviTag B8",
    category: "wireless",
    signalType: "Wireless BLE Broadcast (Eddystone / Manufacturer Data)",
    voltage: "3.0V (CR2477T Wide-temp battery)",
    range: "-40°C to +85°C, 0-100% RH, 300-1100 hPa, 3-Axis Accel",
    unit: "°C, %, hPa, mg, mV",
    pins: ["Wireless Open-Source BLE Beacon"],
    serialSignature: /ruuvitag|ruuvi/i,
    sampleOutput: "RUUVITAG [Format 5]: Temp=22.84C, Hum=44.1%, Press=101325Pa, Accel[0,0,1004mg], Batt=3024mV",
    analogOrDigital: "Digital",
    description: "Finnish military-grade environmental beacon with integrated accelerometer for asset and building health."
  },
  {
    id: "switchbot_meter",
    name: "SwitchBot Meter Plus BLE Indoor Climate Sensor",
    model: "SwitchBot Meter Plus",
    category: "wireless",
    signalType: "Wireless BLE 5.0 Long Range",
    voltage: "2x AAA Batteries",
    range: "-20°C to 80°C, 0% to 99% RH",
    unit: "°C, %, Batt %",
    pins: ["Wireless Bluetooth Low Energy"],
    serialSignature: /switchbot|meter_plus/i,
    sampleOutput: "SWITCHBOT_METER [WoSensorTH]: Temp=24.2C, Humidity=58%, Battery=88%",
    analogOrDigital: "Digital",
    description: "High-contrast 3-inch electronic paper-like screen with long-range Bluetooth telemetry."
  },
  {
    id: "shelly_plus_ht",
    name: "Shelly Plus H&T WiFi Environmental Sensor",
    model: "Shelly Plus H&T",
    category: "wireless",
    signalType: "Wireless Wi-Fi 802.11 b/g/n + Bluetooth (HTTP / MQTT)",
    voltage: "4x AA 1.5V batteries or Type-C USB 5V",
    range: "0°C to 40°C, 30% to 70% RH (E-paper display)",
    unit: "°C, %, Battery %",
    pins: ["Wi-Fi / MQTT JSON Stream"],
    serialSignature: /shelly_plus_ht|shellyht/i,
    sampleOutput: "{\"shelly_ht\":{\"temp\":23.6,\"rh\":51.2,\"battery\":100,\"voltage\":6.02}}",
    analogOrDigital: "Digital",
    description: "Direct Wi-Fi connected smart home sensor publishing JSON telemetry over local MQTT without cloud hubs."
  },
  {
    id: "sonoff_snzb02",
    name: "Sonoff SNZB-02 Zigbee / WiFi Gateway Climate",
    model: "SNZB-02",
    category: "wireless",
    signalType: "Wireless Zigbee 3.0 (IEEE 802.15.4)",
    voltage: "3.0V (CR2450 Battery)",
    range: "-10°C to 40°C, 10% to 90% RH",
    unit: "°C, %, Link Quality (LQI)",
    pins: ["Zigbee Wireless Mesh"],
    serialSignature: /snzb_?02|zigbee2mqtt/i,
    sampleOutput: "ZIGBEE_NODE [0x00124b0021c4]: Temp=24.08C, Hum=55.4%, LinkQuality=112",
    analogOrDigital: "Digital",
    description: "Zigbee 3.0 low-power mesh node routing telemetry through home automation coordinators."
  },
  {
    id: "esp_now_node",
    name: "Espressif ESP-NOW Connectionless Mesh Node",
    model: "ESP-NOW Fast Protocol",
    category: "wireless",
    signalType: "Wireless 2.4 GHz Proprietary Connectionless Packet",
    voltage: "3.3V DC (ESP32 / ESP8266)",
    range: "Up to 220 meters line-of-sight (<1ms latency)",
    unit: "Binary / Struct Telemetry",
    pins: ["Internal RF Radio (Peer MAC: 24:6F:28:xx:xx:xx)"],
    serialSignature: /esp_now|peer_packet/i,
    sampleOutput: "ESP-NOW [MAC 24:6F:28:1A:02:44]: Telemetry [24.2C, 58%, 185ppm, 238V] in 1.4ms",
    analogOrDigital: "Digital",
    description: "Ultra-fast connectionless radio protocol transmitting telemetry packets without Wi-Fi router association."
  },
  {
    id: "hc05_bluetooth",
    name: "HC-05 Classic Bluetooth Serial SPP Module",
    model: "HC-05 (ZS-040)",
    category: "wireless",
    signalType: "Digital UART Serial Port Profile (SPP Bluetooth 2.0+EDR)",
    voltage: "3.6V – 6.0V DC (I/O 3.3V logic)",
    range: "Up to 10 meters wireless serial cable replacement",
    unit: "UART 9600 to 115200 Baud",
    pins: ["VCC (+5V)","GND","TXD (GPIO 16)","RXD (GPIO 17)","STATE","EN / KEY"],
    serialSignature: /hc-?05|bt_serial/i,
    sampleOutput: "HC-05: Connected to Android Phone (SPP UUID 00001101) -> Forwarding Telemetry",
    analogOrDigital: "Digital",
    description: "Standard transparent wireless serial bridge streaming telemetry directly to mobile apps and Sanctuary OS."
  },
  {
    id: "hm10_ble",
    name: "HM-10 BLE 4.0 / 4.2 UART Pass-Through Module",
    model: "HM-10 (CC2541)",
    category: "wireless",
    signalType: "Digital UART (BLE Peripheral / Central)",
    voltage: "3.3V (or 5V with baseboard)",
    range: "Up to 60 meters open air",
    unit: "AT Commands / Transparent UART",
    pins: ["VCC","GND","TXD","RXD","STATE","BRK"],
    serialSignature: /hm-?10|ble_transparent/i,
    sampleOutput: "HM-10: OK+CONN [Connected to BLE Central UUID:FFE0]",
    analogOrDigital: "Digital",
    description: "TI CC2541 Bluetooth Smart module providing transparent low-energy data transmission for iOS and Android."
  },
  {
    id: "sim800l_gprs",
    name: "SIMCom SIM800L 2G GPRS / GSM Cellular Module",
    model: "SIM800L Core",
    category: "wireless",
    signalType: "Digital UART (AT Commands 9600-115200 Baud)",
    voltage: "3.7V – 4.4V DC (Peak 2A transmission burst)",
    range: "Quad-band 850/900/1800/1900 MHz (SMS, Calls, HTTP POST)",
    unit: "AT+CSQ (Signal), SMS, TCP/IP Stream",
    pins: ["VCC (3.8V-4.2V LiPo)","GND","TXD","RXD","RST","NET","RING"],
    serialSignature: /sim800l?|at\+csq|gprs_modem/i,
    sampleOutput: "+CSQ: 24,0 -> SIM800L Connected. Dispatched Emergency SMS to Security Office",
    analogOrDigital: "Digital",
    description: "Cellular modem sending SMS intruder warnings and HTTP telemetry from sites lacking Wi-Fi or broadband."
  },
  {
    id: "sim7600e_4g",
    name: "SIMCom SIM7600E-H 4G LTE Cat-4 & GNSS Module",
    model: "SIM7600E-H",
    category: "wireless",
    signalType: "Digital UART / USB (AT Commands + GPS NMEA)",
    voltage: "5.0V – 12.0V DC (Module input)",
    range: "LTE-FDD/TDD Cat-4 up to 150 Mbps downlink, GPS/GLONASS",
    unit: "4G Data, Lat/Long Coordinates",
    pins: ["VCC","GND","TXD","RXD","DTR","RI","MAIN_ANT","GPS_ANT"],
    serialSignature: /sim7600|lte_4g|gps_nmea/i,
    sampleOutput: "SIM7600 4G: LTE Network Attached (IP: 10.42.18.91), Lat=37.7749, Lon=-122.4194",
    analogOrDigital: "Digital",
    description: "High-speed 4G LTE cellular module uploading full camera video frames and GPS asset telemetry."
  },
  {
    id: "lora_sx1278",
    name: "Semtech SX1278 LoRa Long-Range Transceiver",
    model: "Ra-02 / SX1278 (433 MHz)",
    category: "wireless",
    signalType: "Digital SPI (Spread Spectrum Modulation)",
    voltage: "2.5V – 3.7V (3.3V nominal)",
    range: "Up to 10 kilometers rural line-of-sight (-148 dBm sensitivity)",
    unit: "LoRa Packet, RSSI, SNR",
    pins: ["3V3","GND","MISO","MOSI","SCK","NSS","DIO0","RST"],
    serialSignature: /sx1278|lora_packet|lora_rssi/i,
    sampleOutput: "LORA [433MHz]: Packet Received! RSSI = -118 dBm, SNR = +7.2 dB [Payload: 28 bytes]",
    analogOrDigital: "Digital",
    description: "Chirp spread spectrum transceiver achieving multi-kilometer telemetry transmission through dense concrete buildings."
  },
  {
    id: "esp32cam",
    name: "AI-Thinker ESP32-CAM (OV2640 2MP Camera Node)",
    model: "ESP32-CAM AI-Thinker",
    category: "mcu",
    signalType: "Digital UART (115200 Baud) + Wi-Fi 802.11 b/g/n",
    voltage: "5.0V DC (At least 2A recommended)",
    range: "UXGA (1600x1200) to QQVGA (160x120) JPEG Stream",
    unit: "JPEG Frames & Serial Telemetry",
    pins: ["5V","GND","U0TX (GPIO 1)","U0RX (GPIO 3)","GPIO 4 (Flash LED)","GPIO 0 (Boot)"],
    serialSignature: /esp32-?cam|ov2640|camera_ready|camera_fb/i,
    sampleOutput: "[ESP32-CAM] OV2640 initialized. Streaming 1600x1200 JPEG to Sanctuary OS...",
    analogOrDigital: "Digital",
    description: "Integrated dual-core ESP32 microcontroller with OV2640 camera, MicroSD card slot, and high-brightness flash LED."
  },
  {
    id: "spark_core",
    name: "Spark Core (Particle STM32F103CB + CC3000 Wi-Fi)",
    model: "Spark Core v1.0",
    category: "mcu",
    signalType: "Digital UART (115200) + Particle Cloud REST API",
    voltage: "3.6V – 6.0V DC (VIN / USB 5V), 3.3V Logic",
    range: "ARM Cortex-M3 72MHz, 128KB Flash, 20KB RAM, 12-bit ADCs",
    unit: "Digital & 12-bit Analog (0-4095)",
    pins: ["VIN","GND","TX (Serial1)","RX (Serial1)","A0-A7","D0-D7","RGB LED"],
    serialSignature: /spark_core|particle_core|54ff74066678574924331067|spark_cloud/i,
    sampleOutput: "{\"board\":\"Spark Core\",\"chip\":\"STM32F103CB\",\"cloud\":\"ONLINE\",\"adc_12bit\":[2180,840,495,1740]}",
    analogOrDigital: "Digital/Analog",
    description: "Original Particle IoT platform running STM32 ARM Cortex-M3 with hardware UART bridge to ESP32-CAM."
  },
  {
    id: "particle_photon",
    name: "Particle Photon (STM32F205 + Cypress BCM43362)",
    model: "Particle Photon",
    category: "mcu",
    signalType: "Digital UART + Particle Cloud / WebSockets",
    voltage: "3.3V – 5.5V DC",
    range: "ARM Cortex-M3 120MHz, 1MB Flash, 128KB RAM",
    unit: "Serial JSON / Cloud Events",
    pins: ["VIN","GND","TX","RX","A0-A5","D0-D7","SETUP"],
    serialSignature: /particle_photon|photon_cloud/i,
    sampleOutput: "PHOTON: Connected to Particle Cloud. Event published: \"kyu_telemetry\"",
    analogOrDigital: "Digital",
    description: "Next-gen Particle controller with enhanced memory and Broadcom Wi-Fi for industrial IoT cloud syncing."
  },
  {
    id: "arduino_uno",
    name: "Arduino Uno R3 (ATmega328P 16MHz Microcontroller)",
    model: "ATmega328P Uno R3",
    category: "mcu",
    signalType: "Digital UART (115200 / 9600 Baud) + 10-bit ADC",
    voltage: "5.0V Operating (7-12V Input)",
    range: "14 Digital I/O, 6 Analog Inputs (10-bit resolution 0-1023)",
    unit: "Serial Text / CSV / JSON",
    pins: ["5V","3.3V","GND","A0-A5","D0 (RX)","D1 (TX)","D2-D13"],
    serialSignature: /arduino_uno|atmega328p/i,
    sampleOutput: "ARDUINO_UNO: Online. Sampling analog channels A0-A5 at 5.0V reference",
    analogOrDigital: "Digital/Analog",
    description: "World-standard 8-bit open hardware platform running 5V logic with extensive shield ecosystem."
  },
  {
    id: "arduino_mega",
    name: "Arduino Mega 2560 R3 (ATmega2560 Multi-UART)",
    model: "Arduino Mega 2560",
    category: "mcu",
    signalType: "Digital (4 Hardware UARTs + 16 Analog Inputs)",
    voltage: "5.0V Operating (7-12V Input)",
    range: "54 Digital Pins, 16 Analog Inputs, 256KB Flash",
    unit: "Multi-port serial streams",
    pins: ["5V","GND","A0-A15","RX0-RX3","TX0-TX3","D2-D53"],
    serialSignature: /arduino_mega|atmega2560/i,
    sampleOutput: "MEGA2560: 4 Serial Ports Active: Port1=ESP32-CAM, Port2=PZEM, Port3=MH-Z19B",
    analogOrDigital: "Digital/Analog",
    description: "Heavyweight MCU board featuring 4 distinct hardware serial ports for aggregating multiple UART devices."
  },
  {
    id: "stm32_bluepill",
    name: "STM32F103C8T6 Blue Pill ARM Cortex-M3 Board",
    model: "STM32F103C8T6 (Blue Pill)",
    category: "mcu",
    signalType: "Digital UART / USB Virtual COM Port (115200 Baud)",
    voltage: "3.3V Logic (5V tolerant GPIOs)",
    range: "72MHz 32-bit ARM Cortex-M3, 64KB/128KB Flash, 2x 12-bit ADCs",
    unit: "High-speed Telemetry",
    pins: ["3.3V","GND","PA9 (TX1)","PA10 (RX1)","PB10 (TX3)","PB11 (RX3)","PA0-PA7 (12-bit ADC)"],
    serialSignature: /stm32f103|blue_pill|arm_cortex_m3/i,
    sampleOutput: "STM32_BLUEPILL: System Core Clock 72MHz. DMA-assisted ADC 12-bit buffer filled",
    analogOrDigital: "Digital/Analog",
    description: "Ultra-low cost high-performance ARM 32-bit controller supporting dual 12-bit multichannel ADCs."
  },
  {
    id: "rpi_pico_w",
    name: "Raspberry Pi Pico W (RP2040 Dual ARM Cortex-M0+)",
    model: "RP2040 Pico W",
    category: "mcu",
    signalType: "Digital UART / Wi-Fi 802.11n / BLE (MicroPython / C++)",
    voltage: "1.8V – 5.5V Input (3.3V Logic)",
    range: "Dual-core 133MHz, 264KB SRAM, Programmable I/O (PIO)",
    unit: "MicroPython WebREPL / Serial Stream",
    pins: ["3V3","GND","GP0 (TX0)","GP1 (RX0)","GP4 (SDA)","GP5 (SCL)","ADC0-ADC2"],
    serialSignature: /rp2040|pico_w|micropython/i,
    sampleOutput: "PICO_W: MicroPython v1.20 on RP2040 with CYW43439 Wi-Fi/BLE",
    analogOrDigital: "Digital",
    description: "Raspberry Pi silicon featuring versatile Programmable I/O (PIO) state machines for custom protocols."
  },
  {
    id: "esp32_s3",
    name: "Espressif ESP32-S3 (AI Vector & Neural Processing)",
    model: "ESP32-S3-WROOM-1",
    category: "mcu",
    signalType: "Digital High-Speed USB / UART / Wi-Fi & BLE 5.0 Mesh",
    voltage: "3.3V DC (500mA)",
    range: "Dual-core 240MHz Xtensa LX7 with vector instructions for AI",
    unit: "Serial AI Classification Streams",
    pins: ["3V3","GND","GPIO 43 (U0TXD)","GPIO 44 (U0RXD)","D+ (USB)","D- (USB)"],
    serialSignature: /esp32-?s3|vector_ai/i,
    sampleOutput: "ESP32-S3: Edge AI Inference complete (Human Detected: 98.4%, Latency: 22ms)",
    analogOrDigital: "Digital",
    description: "Next-generation flagship processor with vector acceleration for TinyML audio recognition and computer vision."
  },
  {
    id: "esp8266_nodemcu",
    name: "NodeMCU ESP8266 Wi-Fi Development Board",
    model: "ESP8266 NodeMCU v2 / v3",
    category: "mcu",
    signalType: "Digital UART (115200) + 2.4 GHz Wi-Fi 802.11 b/g/n",
    voltage: "5.0V USB (3.3V Internal Regulator)",
    range: "80MHz / 160MHz 32-bit Tensilica L106, Single 10-bit ADC (0-1V / 0-3.3V)",
    unit: "Serial JSON / HTTP POST / WebSockets",
    pins: ["3V3","GND","D1 (SCL)","D2 (SDA)","D4 (TX1)","RX","TX","A0"],
    serialSignature: /esp8266|nodemcu/i,
    sampleOutput: "NODEMCU_ESP8266: IP=192.168.1.145, FreeHeap=42890, Streaming to Web UI",
    analogOrDigital: "Digital",
    description: "Classic low-cost Wi-Fi enabled micro-controller that revolutionized open-source IoT sensors."
  },
  {
    id: "teensy_41",
    name: "PJRC Teensy 4.1 (ARM Cortex-M7 at 600 MHz)",
    model: "Teensy 4.1",
    category: "mcu",
    signalType: "Digital High-Speed USB 480Mbps + 8 Serial UARTs",
    voltage: "3.3V Logic (5V USB)",
    range: "600MHz NXP i.MXRT1062, 10/100 Mbit Native Ethernet",
    unit: "High-frequency Oscilloscope & Telemetry",
    pins: ["VIN","GND","0 (RX1)","1 (TX1)","7 (RX2)","8 (TX2)","A0-A17"],
    serialSignature: /teensy_?41|cortex_m7/i,
    sampleOutput: "TEENSY_4.1: High-Speed 600MHz Sampling Engine Active. 8 Hardware UARTs Synchronized",
    analogOrDigital: "Digital/Analog",
    description: "Fastest microcontroller board in existence, capable of continuous multi-channel DSP and FFT analysis."
  },
  {
    id: "seeed_xiao_esp32c3",
    name: "Seeed Studio XIAO ESP32-C3 RISC-V Micro-Node",
    model: "XIAO ESP32-C3",
    category: "mcu",
    signalType: "Digital USB-C / UART / Wi-Fi & BLE 5.0",
    voltage: "3.3V (Thumb-sized footprint 21x17.5mm)",
    range: "Single-core 160MHz 32-bit RISC-V, 400KB SRAM",
    unit: "Serial JSON",
    pins: ["3V3","GND","D0-D10","A0-A3","Charge Controller"],
    serialSignature: /xiao_esp32c3|riscv_iot/i,
    sampleOutput: "XIAO_ESP32C3: RISC-V Core Online. Battery Voltage = 4.12V (Li-Po Powered)",
    analogOrDigital: "Digital",
    description: "Thumb-sized module with onboard battery charging management for discreet wearable or hidden sensor pods."
  },
  {
    id: "nordic_nrf52840",
    name: "Nordic Semiconductor nRF52840 Multiprotocol SoC",
    model: "nRF52840 Dongle / Feather",
    category: "mcu",
    signalType: "Digital USB / BLE 5.3 / Thread / Zigbee",
    voltage: "1.7V – 5.5V DC",
    range: "64MHz ARM Cortex-M4 with FPU, 1MB Flash, 256KB RAM",
    unit: "BLE Advertisements / Serial VCP",
    pins: ["VDD","GND","P0.06 (TX)","P0.08 (RX)","P0.02 (AIN0)"],
    serialSignature: /nrf52840|nordic_semi/i,
    sampleOutput: "NRF52840: Bluetooth 5 Long Range (Coded PHY) active. Mesh Relay operational",
    analogOrDigital: "Digital",
    description: "Premier multiprotocol radio SoC supporting concurrent Bluetooth Low Energy, Zigbee, Thread, and Matter."
  }
];

/**
 * Universal Serial Output Classifier & Device Signature Matcher
 * Parses raw serial streams (JSON, CSV, delimited key-value, raw ADC, NMEA, AT),
 * extracts telemetry tokens, and correlates matches across 120+ hardware templates.
 */
export class SerialOutputExaminer {
  constructor(templatesList = SENSOR_TEMPLATES) {
    this.templates = templatesList;
  }

  examine(rawSerialText) {
    if (!rawSerialText || typeof rawSerialText !== 'string') {
      return {
        raw: '',
        formatDetected: 'Unknown / Empty',
        extractedFields: {},
        matchCount: 0,
        matches: []
      };
    }

    const trimmed = rawSerialText.trim();
    let formatDetected = 'Raw Text / Delimited';
    let extractedFields = {};

    // 1. Check for JSON Stream format
    if ((trimmed.startsWith('{') && trimmed.endsWith('}')) || (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
      try {
        const parsed = JSON.parse(trimmed);
        formatDetected = 'JSON Object';
        if (typeof parsed === 'object' && parsed !== null) {
          extractedFields = parsed;
        }
      } catch (e) {
        formatDetected = 'Malformed JSON';
      }
    }

    // 2. Check for Key-Value delimited pairs (e.g. TEMP:24.2, HUM:58.4 or PZEM: V=240, I=1.2)
    if (formatDetected !== 'JSON Object' && (trimmed.includes(':') || trimmed.includes('='))) {
      formatDetected = 'Key-Value Delimited';
      const tokens = trimmed.split(/[,;	|]+/);
      tokens.forEach(tok => {
        const parts = tok.split(/[:=]/);
        if (parts.length >= 2) {
          const key = parts[0].trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
          const val = parts.slice(1).join(':').trim();
          if (key && val) {
            extractedFields[key] = val;
          }
        }
      });
    }

    // 3. Check for NMEA / AT Command signatures
    if (trimmed.startsWith('$GP') || trimmed.startsWith('$GN')) {
      formatDetected = 'NMEA GPS Sentence';
    } else if (trimmed.startsWith('AT+') || trimmed.startsWith('+CSQ:') || trimmed.startsWith('+CMTI:')) {
      formatDetected = 'Cellular AT Command';
    }

    // 4. Match against 120+ sensor templates using Heuristic Pattern Scoring
    const matches = [];
    const lowerRaw = trimmed.toLowerCase();

    for (const t of this.templates) {
      let score = 0;
      let matchedKeys = [];

      // A. Regex Serial Signature Test (High Confidence: +70)
      if (t.serialSignature && t.serialSignature.test(trimmed)) {
        score += 70;
        matchedKeys.push('serialSignature');
      }

      // B. Exact Model name match (High Confidence: +40)
      const modelClean = t.model.toLowerCase().replace(/[^a-z0-9]/g, '');
      const rawClean = lowerRaw.replace(/[^a-z0-9]/g, '');
      if (modelClean.length > 2 && rawClean.includes(modelClean)) {
        score += 40;
        matchedKeys.push('modelName');
      }

      // C. Key match in extracted fields
      const idKey = t.id.toLowerCase();
      if (extractedFields[idKey] !== undefined) {
        score += 35;
        matchedKeys.push('field:' + idKey);
      }

      // Specific sensor category keywords
      if (t.category === 'climate') {
        if (extractedFields.temp !== undefined || extractedFields.temperature !== undefined || lowerRaw.includes('temp')) {
          score += 15;
          matchedKeys.push('temp');
        }
        if (extractedFields.hum !== undefined || extractedFields.humidity !== undefined || lowerRaw.includes('hum')) {
          score += 15;
          matchedKeys.push('hum');
        }
        if (extractedFields.press !== undefined || lowerRaw.includes('hpa')) {
          score += 20;
          matchedKeys.push('press');
        }
      } else if (t.category === 'gas') {
        if (extractedFields.gas !== undefined || extractedFields.smoke !== undefined || lowerRaw.includes('ppm') || lowerRaw.includes('gas')) {
          score += 20;
          matchedKeys.push('gas_ppm');
        }
      } else if (t.category === 'power') {
        if (extractedFields.vac !== undefined || extractedFields.volt !== undefined || lowerRaw.includes('vac') || lowerRaw.includes('volt')) {
          score += 20;
          matchedKeys.push('ac_voltage');
        }
        if (extractedFields.current !== undefined || lowerRaw.includes('amps') || lowerRaw.includes('pzem')) {
          score += 20;
          matchedKeys.push('ac_current');
        }
      } else if (t.category === 'motion') {
        if (extractedFields.pir !== undefined || extractedFields.motion !== undefined || lowerRaw.includes('motion') || lowerRaw.includes('dist')) {
          score += 20;
          matchedKeys.push('motion');
        }
      } else if (t.category === 'actuator') {
        if (lowerRaw.includes('valve') || lowerRaw.includes('relay') || lowerRaw.includes('solenoid') || lowerRaw.includes('tuya') || lowerRaw.includes('cool')) {
          score += 30;
          matchedKeys.push('actuator_state');
        }
      } else if (t.category === 'wireless') {
        if (lowerRaw.includes('ble') || lowerRaw.includes('rssi') || lowerRaw.includes('beacon') || lowerRaw.includes('mac')) {
          score += 30;
          matchedKeys.push('wireless_beacon');
        }
      }

      if (score > 20) {
        matches.push({
          template: t,
          confidence: Math.min(score, 99),
          matchedKeys,
          signalType: t.signalType,
          analogOrDigital: t.analogOrDigital,
          voltage: t.voltage,
          pins: t.pins
        });
      }
    }

    // Sort matches by highest confidence descending
    matches.sort((a, b) => b.confidence - a.confidence);

    return {
      raw: trimmed,
      formatDetected,
      extractedFields,
      matchCount: matches.length,
      matches
    };
  }

  generateFirmware(templateIds = ['dht22', 'mq2', 'zmpt101b', 'acs712_20', 'reed_switch', 'hcsr501', 'relay_1ch'], board = 'esp32cam', baud = '115200') {
    const selected = this.templates.filter(t => templateIds.includes(t.id));
    
    let code = '// =========================================================================\n';
    code += '// SANCTUARY UNIVERSAL MULTI-SENSOR SERIAL FIRMWARE\n';
    code += '// Target Hardware Architecture: ' + board.toUpperCase() + ' @ ' + baud + ' Baud\n';
    code += '// Selected Models: ' + selected.map(s => s.model).join(', ') + '\n';
    code += '// Supports: ESP32-CAM, Spark Core (Particle STM32), Arduino Uno & Sanctuary OS\n';
    code += '// =========================================================================\n\n';

    code += '#include <Arduino.h>\n';
    if (board === 'sparkcore') {
      code += '#include "application.h"\n';
    }
    if (selected.some(s => s.id.includes('dht'))) {
      code += '#include "DHT.h"\n#define DHTPIN 13\n#define DHTTYPE DHT22\nDHT dht(DHTPIN, DHTTYPE);\n';
    }

    code += '\n// Hardware Pin Assignment Mapping\n';
    selected.forEach((s) => {
      code += '// ' + s.name + ' [' + s.analogOrDigital + ' | ' + s.voltage + ']: ' + s.pins.join(', ') + '\n';
    });

    code += '\nvoid setup() {\n';
    code += '  Serial.begin(' + baud + ');\n';
    code += '  while(!Serial && millis() < 3000);\n';
    code += '  Serial.println("[Universal Node] System Initialized. Serial 115200 online.");\n';
    code += '}\n\n';

    code += 'void loop() {\n';
    code += '  // Assemble Universal JSON Telemetry Frame\n';
    code += '  Serial.print("{");\n';
    selected.forEach((s, idx) => {
      const isLast = idx === selected.length - 1;
      const comma = isLast ? '' : ', ';
      if (s.category === 'climate') {
        code += '  Serial.print("\"temp\": 24.2, \"hum\": 58.4' + comma + '");\n';
      } else if (s.category === 'gas') {
        code += '  Serial.print("\"gas\": " + String(analogRead(36)/4) + "' + comma + '");\n';
      } else if (s.category === 'power') {
        code += '  Serial.print("\"vac\": 238.4, \"current\": 0.85' + comma + '");\n';
      } else if (s.category === 'motion') {
        code += '  Serial.print("\"door\": 0, \"pir\": 0, \"dist\": 24.5' + comma + '");\n';
      } else if (s.category === 'actuator') {
        code += '  Serial.print("\"valve\": \"OPEN\", \"relay\": 0' + comma + '");\n';
      } else if (s.category === 'wireless') {
        code += '  Serial.print("\"ble_rssi\": -65, \"batt\": 94' + comma + '");\n';
      } else {
        code += '  Serial.print("\"' + s.id + '_val\": 1' + comma + '");\n';
      }
    });
    code += '  Serial.println("}");\n';
    code += '  delay(1500);\n';
    code += '}\n';

    return code;
  }
}

const serialOutputExaminer = new SerialOutputExaminer();

if (typeof window !== 'undefined') {
  window.SENSOR_CATEGORIES = SENSOR_CATEGORIES;
  window.SENSOR_TEMPLATES = SENSOR_TEMPLATES;
  window.SerialOutputExaminer = SerialOutputExaminer;
  window.serialOutputExaminer = serialOutputExaminer;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { SENSOR_CATEGORIES, SENSOR_TEMPLATES, SerialOutputExaminer, serialOutputExaminer };
}

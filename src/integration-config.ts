export const TTN_PROFILES = [
  'json',
  'debug',
  'sensebox/home',
  'lora-serialization',
  'cayenne-lpp',
] as const;

export type TtnProfile = (typeof TTN_PROFILES)[number];

/**
 * The Things Stack derives Cayenne LPP decoded payload keys from these
 * lowercase sensor constants and appends the channel (for example,
 * `barometric_pressure_0`).
 */
export const CAYENNE_LPP_DECODERS = [
  'digital_in',
  'digital_out',
  'analog_in',
  'analog_out',
  'luminosity',
  'presence',
  'temperature',
  'relative_humidity',
  'accelerometer',
  'barometric_pressure',
  'gyrometer',
  'gps',
] as const;

export type CayenneLppDecoder = (typeof CAYENNE_LPP_DECODERS)[number];

export const SENSEBOX_HOME_DECODERS = [
  'temperature',
  'humidity',
  'pressure',
  'lightintensity',
  'uvlight',
  'pm10',
  'pm25',
  'soiltemperature',
  'soilmoisture',
  'soundlevel',
  'bmetemperature',
  'bmehumidity',
  'bmepressure',
  'bmevoc',
  'windspeed',
  'co2',
] as const;

export const LORA_SERIALIZATION_DECODERS = [
  'uint8',
  'uint16',
  'temperature',
  'humidity',
  'latLng',
  'unixtime',
] as const;

export const LORA_SERIALIZATION_METADATA_DECODERS = [
  'latLng',
  'unixtime',
] as const;

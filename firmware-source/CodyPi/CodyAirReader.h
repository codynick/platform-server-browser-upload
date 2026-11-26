#ifndef CODYNICK_SAFE_AIR_READER_H
#define CODYNICK_SAFE_AIR_READER_H
// Same I2C address, byte order and tenths scale as I2A_Air_TH_v1_0.h.
// Avoid its uninitialized locals; validate the complete shared reading.
static bool readAirTH(float &temperature, float &humidity) {
  static unsigned long lastAttempt = 0;
  static bool attempted = false, valid = false;
  static float cachedT = 0, cachedH = 0;
  const unsigned long now = millis();
  if (!attempted || (unsigned long)(now - lastAttempt) >= 1000UL) {
    attempted = true; lastAttempt = now; valid = false;
#if defined(WIRE_HAS_TIMEOUT)
    Wire.clearWireTimeoutFlag();
    Wire.setWireTimeout(25000UL, true);
#endif
    const uint8_t count = Wire.requestFrom((uint8_t)98, (uint8_t)4);
    if (count == 4 && Wire.available() >= 4) {
      const uint8_t h0 = Wire.read(), h1 = Wire.read(), t0 = Wire.read(), t1 = Wire.read();
      const uint16_t humidityRaw = ((uint16_t)h0 << 8) | h1;
      const int16_t temperatureRaw = (int16_t)(((uint16_t)t0 << 8) | t1);
      cachedH = humidityRaw / 10.0f; cachedT = temperatureRaw / 10.0f;
      valid = cachedH >= 0 && cachedH <= 100 && cachedT >= -55 && cachedT <= 125;
    }
    while (Wire.available()) Wire.read();
#if defined(WIRE_HAS_TIMEOUT)
    if (Wire.getWireTimeoutFlag()) {valid = false; Wire.clearWireTimeoutFlag();}
#endif
  }
  if (!valid) return false;
  temperature = cachedT; humidity = cachedH; return true;
}
#endif

#ifndef I2A_Air_TH_v1_0
#define I2A_Air_TH_v1_0

#include <Arduino.h>
#include <Wire.h>
#include <avr/wdt.h>

#ifndef WIRE_BEGIN_DEFINED
#define WIRE_BEGIN_DEFINED
void Wire_Begin() {
  Wire.begin();
}
#endif

float get_Humidity_Temperature_Value(uint8_t HTtype) {
  uint64_t prv_read;
  float RH_Temp;
  int int_value;

  if (millis() - prv_read > 1000) {
    wdt_enable(WDTO_2S);
    prv_read = millis();
    Wire.requestFrom(98, 4);
    while (Wire.available()) {
      uint8_t i2c_data[4];
      Wire.readBytes(i2c_data, 4);

      if (HTtype == 0) { //Temperature
        int_value = i2c_data[2];
        int_value = int_value << 8;
        int_value += i2c_data[3];

      } else if (HTtype == 1) { //Humidity
        int_value = i2c_data[0];
        int_value = int_value << 8;
        int_value += i2c_data[1];
      }
      RH_Temp = int_value;
      RH_Temp = RH_Temp / 10;
    }
    wdt_disable();
  }
  return RH_Temp;
}
#endif

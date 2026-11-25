#ifndef I2A_Light_Sensor_v1_h
#define I2A_Light_Sensor_v1_h

#define ADC_PORT_Light_Sensor 17  //PA3

#include <Arduino.h>
#include <Wire.h>
#include <avr/wdt.h>

//++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
void init_Light_Sensor(char e) {
  if ((e == 0)) {
    pinMode(ADC_PORT_Light_Sensor, INPUT);
  }
  if ((e == 1)) {
    Wire.begin();
  }
}
//++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
float get_Light_Sensor_value(uint8_t add) {
  static uint64_t prv_read = 0;
  static float f_ret = 0.0;
  uint16_t ADC_value = 1023;
  uint8_t i2cdata[3];

  if ((add == 0)) {
    ADC_value = analogRead(ADC_PORT_Light_Sensor);
    f_ret = 1023.0 - ADC_value;
    f_ret = f_ret / 1.023;
    f_ret = round(f_ret) / 10.0;
  }
  if ((add == 1)) {
    if (millis() - prv_read > 1000) {
      prv_read = millis();
      wdt_enable(WDTO_2S);

      Wire.requestFrom(103, 2);
      while (Wire.available() < 2) {
        if (millis() - prv_read > 500) {
          while (Wire.available()) Wire.read();
          wdt_disable();
          f_ret = -1.0;
          return (f_ret);
        }

        wdt_reset();
        delay(100);
      }

      Wire.readBytes(i2cdata, 2);
      while (Wire.available()) Wire.read();
      wdt_disable();

      ADC_value = i2cdata[0];
      ADC_value = ADC_value << 8;
      ADC_value += i2cdata[1];

      f_ret = 1023.0 - ADC_value;
      f_ret /= 1.023;
      f_ret = round(f_ret) / 10.0;
    }
  }
  return f_ret;
}

#endif

#include <stdint.h>
#ifndef Talking_Display_h
#define Talking_Display_h

//when playing busy pin goes low
#define BUSY_PORT PA5
//#define BUSY_PORT PB5

#include <DFRobotDFPlayerMini.h>

extern DFRobotDFPlayerMini myDFPlayer;

// Timeouts (ms)
constexpr uint16_t DF_START_TIMEOUT = 1200;    // منتظر شروع پخش
constexpr uint16_t DF_POST_PLAY_GAP = 350;    // فاصله بعد از پخش / بین کلمات
constexpr uint16_t DF_IDLE_DEBOUNCE = 400;    // debounce خاموش شدن isPlaying
constexpr uint16_t DF_NUM_START_WAIT = 2000;  // منتظر شروع در play_num (اختصاصی)

//vocabulary
#define WORD_ZERO 128

#define WORD_HUNDREDS 100
#define WORD_TOUSEND 110
#define WORD_MILLION 120
#define WORD_BILLION 130
#define WORD_WEEKDAY 300
#define WORD_MONTH 310
#define WORD_DAY 330

#define WORD_IT_IS 201
#define WORD_CLOCK 202
#define WORD_IS 203
#define WORD_SECOND 204
#define WORD_DOT 205
#define WORD_TEMPERATURE 206
#define WORD_OUTSIDE_TEMPERATURE 207
#define WORD_DEGREE 208
#define WORD_HUMIDITY 209
#define WORD_PERCENT 210
#define WORD_MINUS 211
#define WORD_AND 212
#define WORD_CELSIUS 213
#define WORD_AIR_PRESSURE 214
#define WORD_HECTOPASCAL 215
#define WORD_FAHRENHEIT 216
#define WORD_MINUTES 217
#define WORD_HOURS 218
#define WORD_BRILLIANCE 219
#define WORD_LUX 220
#define WORD_AM 221
#define WORD_PM 222

#define DF_PLAYING LOW
#define DF_IDLE HIGH

void yieldFor(unsigned long ms);

void say(uint8_t folder, uint16_t track) {
  myDFPlayer.playFolder(folder, track);
}

bool sayUntilDone(uint8_t folder, uint16_t track, uint16_t timeout_ms = 8000) {
  constexpr uint8_t Wait_Time = 10;
  unsigned long start = millis();

  while (digitalRead(BUSY_PORT) == DF_PLAYING && millis() - start < DF_START_TIMEOUT)
    yieldFor(Wait_Time);

  say(folder, track);

  while (digitalRead(BUSY_PORT) == DF_PLAYING && millis() - start < timeout_ms)
    yieldFor(Wait_Time);

  yieldFor(DF_POST_PLAY_GAP);

  //return (digitalRead(BUSY_PORT) == DF_IDLE);
  return (true);
}

bool saySmart(uint8_t folder, uint16_t track, uint16_t minGap = 300) {

  uint16_t maxWait;

  switch (folder) {
    case 2:
    case 3:
    case 4:
    case 5:
    case 6:
    case 7:
    case 8: // FARSI
    case 12: maxWait = 4500; break;
    case 9: // ARABIC
    case 13: maxWait = 7000; break;
    case 10: // ENGLISH
    case 14: maxWait = 4500; break;
    case 11:
    case 15: // DEUTSCH
      maxWait = 6500;
      minGap = 380;
      break;
    case 17:
    case 18: // FRENCH
      maxWait = 8000;
      minGap = 1000;
      // while (myDFPlayer.available()) {
      //   myDFPlayer.readType();
      //   myDFPlayer.read();
      // }
      // myDFPlayer.stop();
      // yieldFor(50);
      break;

    default: maxWait = 4500; break;
  }

  unsigned long start = millis();
  say(folder, track);

  // Wait until playback *starts*
  while (digitalRead(BUSY_PORT) == DF_IDLE && millis() - start < 1000)
    yieldFor(10);

  // Wait until playback *finishes*
  while (digitalRead(BUSY_PORT) == DF_PLAYING && millis() - start < maxWait)
    yieldFor(10);

  yieldFor(100);
  if (digitalRead(BUSY_PORT) == DF_PLAYING) {
    while (digitalRead(BUSY_PORT) == DF_PLAYING && (millis() - start) < maxWait + 2000)
      yieldFor(10);
  }

  // Extra safety gap between words
  yieldFor(minGap);

  //return (digitalRead(BUSY_PORT) == DF_IDLE);
  return (true);
}

//speaks three digit numbers
void sayHundreds(uint8_t folder, uint16_t number) {
  uint16_t h = number / 100;
  uint16_t e = number % 100;
  if (h > 0) saySmart(folder, WORD_HUNDREDS + h);
  if (e > 0) saySmart(folder, e);
}

//speaks any 32 bit integer
void sayInt(uint8_t folder, int32_t number) {
  if (number == 0) {
    saySmart(folder, WORD_ZERO);
  } else {
    bool minus = (number < 0);
    if (minus) number *= -1;
    uint16_t einer = number % 1000;
    number /= 1000;
    uint16_t tausender = number % 1000;
    number /= 1000;
    uint16_t millionen = number % 1000;
    number /= 1000;
    uint16_t milliarden = number % 1000;
    if (minus) saySmart(folder, WORD_MINUS);
    if (milliarden > 0) {
      if (milliarden == 1) {
        saySmart(folder, WORD_BILLION + 1);
      } else {
        sayHundreds(folder, milliarden);
        saySmart(folder, WORD_BILLION);
      }
    }
    if (millionen > 0) {
      if (millionen == 1) {
        saySmart(folder, WORD_MILLION + 1);
      } else {
        sayHundreds(folder, millionen);
        saySmart(folder, WORD_MILLION);
      }
    }
    if (tausender > 0) {
      if (tausender == 1) {
        saySmart(folder, WORD_TOUSEND + 1);
      } else {
        sayHundreds(folder, tausender);
        saySmart(folder, WORD_TOUSEND);
      }
    }
    sayHundreds(folder, einer);
  }
}

// speaks a float number with up to 2 decimals, but using only integer math
void sayFloat(uint8_t folder, int32_t number, uint8_t decimals = 2) {
  // number is passed in as "value * 100" if you want 2 decimals
  // Example: 1234 means 12.34

  bool minus = false;
  if (number < 0) {
    minus = true;
    number = -number;
  }

  // Split integer and fractional parts
  int32_t intPart = number;
  int32_t fracPart = 0;

  if (decimals == 1) {
    intPart = number / 10;
    fracPart = number % 10;
  } else if (decimals == 2) {
    intPart = number / 100;
    fracPart = number % 100;
  }

  if (minus) saySmart(folder, WORD_MINUS);

  // Speak integer part
  sayInt(folder, intPart);

  // Speak decimal point and fractional part if needed
  if (decimals > 0 && fracPart > 0) {
    saySmart(folder, WORD_DOT);
    if (decimals == 1) {
      saySmart(folder, fracPart);
    } else if (decimals == 2) {
      if (fracPart < 10) {
        // e.g. 12.03 → speak "zero three"
        saySmart(folder, WORD_ZERO);
        saySmart(folder, fracPart);
      } else {
        saySmart(folder, fracPart);
      }
    }
  }
}

#endif

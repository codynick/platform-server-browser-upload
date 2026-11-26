
#ifndef I2A_Sound_Player_v1_0_h
#define I2A_Sound_Player_v1_0_h

#include <Arduino.h>
#include <Wire.h>

constexpr uint8_t DF_CMD_FUNCTION = 0x47;
constexpr uint8_t DF_I2C_ADDR = 16;
constexpr uint16_t BUSY_POLL_INTERVAL = 60;
constexpr uint16_t BUSY_CONFIRM_DELAY = 150;
constexpr uint16_t GRACE_DELAY = 300;

constexpr uint16_t WAIT_IDLE_AFTER_PLAY = 600;
constexpr uint16_t WAIT_IDLE_AFTER_NUM = 800;
constexpr uint16_t WAIT_IDLE_BEFORE_CMD = 2000;

#ifndef WIRE_BEGIN_DEFINED
#define WIRE_BEGIN_DEFINED
void Wire_Begin() {
  Wire.begin();
#if defined(WIRE_HAS_TIMEOUT)
  Wire.setWireTimeout(2000, true);
#endif
}
#endif

// ---------- کمک‌های مشترک (حجم را کم می‌کنند) ----------
static void i2cSend(const uint8_t *data, uint8_t len) {
  Wire.beginTransmission(DF_I2C_ADDR);
  Wire.write(data, len);
  Wire.endTransmission();
}

bool Read_Busy() {
  static uint32_t last_poll = 0;
  static bool cached = false;
  if (millis() - last_poll >= BUSY_POLL_INTERVAL) {
    last_poll = millis();
    Wire.requestFrom(DF_I2C_ADDR, (uint8_t)1);
    if (Wire.available())
      cached = (Wire.read() == 0xFF);
  }
  return cached;
}

static void waitIdle(uint16_t maxMs = WAIT_IDLE_AFTER_PLAY) {
  uint32_t t0 = millis();
  while (Read_Busy() && (millis() - t0 < maxMs))
    delay(BUSY_POLL_INTERVAL);
  delay(100);
}

static void waitUntilIdleConfirmed(uint16_t maxMs = WAIT_IDLE_BEFORE_CMD) {
  uint32_t t0 = millis();
  while (millis() - t0 < maxMs) {
    if (!Read_Busy()) {
      delay(BUSY_POLL_INTERVAL);
      if (!Read_Busy()) break;
    }
    delay(BUSY_POLL_INTERVAL);
  }
  delay(100);
}

bool DF_Wait_UntilDone(uint16_t timeout_ms = 0) {
  uint32_t start = millis();
  bool started = false;

  // Step 1: wait until playback starts (BUSY true)
  while (millis() - start < 2000) {  //max(800UL, min(2500UL, timeout_ms))) {
    if (Read_Busy()) {
      // confirm at least one more poll cycle
      delay(BUSY_CONFIRM_DELAY);
      if (Read_Busy()) {
        started = true;
        break;
      }
    }
    delay(1);  //yield();
  }
  if (!started) return false;

  // Step 2: wait until playback finishes (BUSY false)
  while (timeout_ms == 0 || millis() - start < timeout_ms) {
    if (!Read_Busy()) {
      delay(BUSY_CONFIRM_DELAY);
      if (!Read_Busy()) {
        delay(60);
        return true;
      }
    }
    delay(1);  //yield();
  }
  return false;
}

// ---------- API ----------
void Set_Volume(uint8_t vol) {
  if (vol > 100) vol = 100;
  uint8_t b = (uint8_t)(((uint16_t)vol * 3) / 10 + 0xA0);  // 0..100 → 0..30 + 0xA0
  i2cSend(&b, 1);
  delay(25);
}

void Set_Function(uint8_t func) {
  if (func == 5 || func == 6) {  // Next / Previous
    waitIdle(WAIT_IDLE_BEFORE_CMD);
    delay(80);
  }
  uint8_t buf[4] = { DF_CMD_FUNCTION, func, 0, 0 };
  i2cSend(buf, 4);
  delay(30);
}

void Play_Big_Folder_Track(uint8_t folder, uint16_t track) {
  uint8_t buf[3] = { folder, (uint8_t)(track & 0xFF), (uint8_t)(track >> 8) };
  i2cSend(buf, 3);
}

bool Play_Big_Folder_Track_UntilDone(uint8_t folder, uint16_t track, uint16_t timeout = 12000) {
  waitUntilIdleConfirmed(WAIT_IDLE_BEFORE_CMD);
  Play_Big_Folder_Track(folder, track);
  delay(GRACE_DELAY);
  bool ok = DF_Wait_UntilDone(timeout);
  waitIdle(WAIT_IDLE_AFTER_PLAY);
  return ok;
}

void Play_Folder_Track(uint8_t folder, uint8_t track) {
  uint8_t buf[2] = { folder, track };
  i2cSend(buf, 2);
}

bool Play_Folder_Track_UntilDone(uint8_t folder, uint8_t track, uint16_t timeout = 10000) {
  waitUntilIdleConfirmed(WAIT_IDLE_BEFORE_CMD);
  Play_Folder_Track(folder, track);
  delay(GRACE_DELAY);
  bool ok = DF_Wait_UntilDone(timeout);
  waitIdle(WAIT_IDLE_AFTER_PLAY);
  return ok;
}

void Play_Number(float fval, uint8_t lang) {
  if (fval > 0x02000000) fval = 0x02000000;
  if (fval < -0x02000000) fval = -0x02000000;
  int32_t ival = (int32_t)round(fval * 100.0f);
  uint8_t buf[5] = {
    lang,
    (uint8_t)(ival >> 24),
    (uint8_t)(ival >> 16),
    (uint8_t)(ival >> 8),
    (uint8_t)(ival)
  };
  i2cSend(buf, 5);
}

bool Play_Number_UntilDone(float fval, uint8_t lang, uint16_t timeout = 18000) {
  waitUntilIdleConfirmed(WAIT_IDLE_BEFORE_CMD);
  Play_Number(fval, lang);
  delay(GRACE_DELAY);
  bool ok = DF_Wait_UntilDone(timeout);
  waitIdle(WAIT_IDLE_AFTER_NUM);
  return ok;
}

#endif
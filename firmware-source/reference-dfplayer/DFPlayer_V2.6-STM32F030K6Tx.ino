/***************************************************
  DFPlayer - A Mini MP3 Player For Arduino
  <https://www.dfrobot.com/product-1121.html>

  ***************************************************
  This example shows the all the function of library for DFPlayer.

  Created 2016-12-07
  By [Angelo qiao](Angelo.qiao@dfrobot.com)

  GNU Lesser General Public License.
  See <http://www.gnu.org/licenses/> for details.
  All above must be included in any redistribution
  ****************************************************/

/***********Notice and Trouble shooting***************
  1.Connection and Diagram can be found here
  <https://www.dfrobot.com/wiki/index.php/DFPlayer_Mini_SKU:DFR0299#Connection_Diagram>
  2.This code is tested on Arduino Uno, Leonardo, Mega boards.
  ****************************************************/

#define LED_PORT PA4

#include "myTD.h"
//#include <SoftwareSerial.h>
#include <DFRobotDFPlayerMini.h>
#include <Wire.h>

//SoftwareSerial mySerial(PA2, PA3);  // Tx, RX
//HardwareSerial mySerial(PA2, PA3);
//HardwareSerial mySerial(PB6, PB7);

Uart mySerial(PA2, PA3);
//Uart mySerial(PB6, PB7);

//#define _myDebug
#ifdef _myDebug
#define Log Serial
#endif

DFRobotDFPlayerMini myDFPlayer;

volatile uint8_t rd_data[5] = { 0 };

volatile bool change_volume_req = false;
volatile bool play_func_req = false;
volatile bool play_large_req = false;
volatile bool play_song_req = false;
volatile bool play_num_req = false;
volatile bool isPlaying = false;

// void printDetail(uint8_t type, int value);
//uint16_t df_delay[] = { 0, 0, 680, 570, 590, 860, 730, 770, 790, 690 };

inline void yieldFor(unsigned long ms) {
  delay(ms);
  // unsigned long start = millis();
  // while (millis() - start < ms) {
  //   yield();  // let background tasks run
  // }
}

#define APPLICATION_ADDRESS (uint32_t)0x08000800
#define VECTOR_TABLE_ENTRIES 48

void Remap_Table(void) {

  __disable_irq();  // Disable all interrupts

  volatile uint32_t *VectorTable = (volatile uint32_t *)0x20000000;
  for (uint8_t i = 0; i < VECTOR_TABLE_ENTRIES; i++) {
    VectorTable[i] = *(volatile uintptr_t *)(APPLICATION_ADDRESS + (i << 2));
  }
  //  __HAL_RCC_APB2_FORCE_RESET();
  __HAL_SYSCFG_REMAPMEMORY_SRAM();

  __enable_irq();  // Re-enable interrupts
}

void setup() {
  Remap_Table();
  mySerial.begin(9600);

  pinMode(BUSY_PORT, INPUT_PULLUP);
  pinMode(LED_PORT, OUTPUT);
  digitalWrite(LED_PORT, HIGH);

#ifdef _myDebug
  Log.begin(9600);
  Log.println();
  Log.println(F("DFRobot DFPlayer Mini Demo"));
  Log.println(F("Initializing DFPlayer ... (May take 3~5 seconds)"));
#endif
  while (!myDFPlayer.begin(mySerial, true, true)) {  //Use softwareSerial to communicate with mp3.
    delay(1000);
#ifdef _myDebug
    Log.println(F("Unable to begin:"));
    Log.println(F("1.Please recheck the connection!"));
    Log.println(F("2.Please insert the SD card!"));
#endif
  }
#ifdef _myDebug
  Log.println(F("DFPlayer Mini online."));
#endif

  myDFPlayer.setTimeOut(1000);  //Set serial communictaion time out 1000ms

  //----Set volume----
  myDFPlayer.volume(20);  //Set volume value (0~30).
  //  myDFPlayer.volumeUp(); //Volume Up
  //  myDFPlayer.volumeDown(); //Volume Down

  //----Set different EQ----
  // myDFPlayer.EQ(DFPLAYER_EQ_NORMAL);
  //  myDFPlayer.EQ(DFPLAYER_EQ_POP);
  //  myDFPlayer.EQ(DFPLAYER_EQ_ROCK);
  //  myDFPlayer.EQ(DFPLAYER_EQ_JAZZ);
  //  myDFPlayer.EQ(DFPLAYER_EQ_CLASSIC);
  //  myDFPlayer.EQ(DFPLAYER_EQ_BASS);

  //----Set device we use SD as default----
  //  myDFPlayer.outputDevice(DFPLAYER_DEVICE_U_DISK);
  myDFPlayer.outputDevice(DFPLAYER_DEVICE_SD);
  //  myDFPlayer.outputDevice(DFPLAYER_DEVICE_AUX);
  //  myDFPlayer.outputDevice(DFPLAYER_DEVICE_SLEEP);
  //  myDFPlayer.outputDevice(DFPLAYER_DEVICE_FLASH);

  //----Mp3 control----
  //  myDFPlayer.sleep();     //sleep
  //  myDFPlayer.reset();     //Reset the module
  //  myDFPlayer.enableDAC();  //Enable On-chip DAC
  //  myDFPlayer.disableDAC();  //Disable On-chip DAC
  myDFPlayer.outputSetting(true, 15);  //output setting, enable the output and set the gain to 15

  //----Mp3 play----
  //  myDFPlayer.next();  //Play next mp3
  //  delay(1000);
  //  myDFPlayer.previous();  //Play previous mp3
  //  (1000);
  //  myDFPlayer.play(1);  //Play the first mp3
  //  delay(1000);
  //  myDFPlayer.loop(1);  //Loop the first mp3
  //  delay(1000);
  //  myDFPlayer.pause();  //pause the mp3
  //  delay(1000);
  //  myDFPlayer.start();  //start the mp3 from the pause
  //  delay(1000);
  //  myDFPlayer.playFolder(folder_number, file_number);  //play specific mp3 in SD:/15/004.mp3; Folder Name(1~99); File Name(1~255)
  //  delay(1000);
  //  myDFPlayer.enableLoopAll(); //loop all mp3 files.
  //  delay(1000);
  //  myDFPlayer.disableLoopAll(); //stop loop all mp3 files.
  //  delay(1000);
  //  myDFPlayer.playMp3Folder(3); //play specific mp3 in SD:/MP3/0004.mp3; File Name(0~65535)
  //  delay(1000);
  //  myDFPlayer.advertise(3); //advertise specific mp3 in SD:/ADVERT/0003.mp3; File Name(0~65535)
  //  delay(1000);
  //  myDFPlayer.stopAdvertise(); //stop advertise
  //  delay(1000);
  //  myDFPlayer.playLargeFolder(1, 1); //play specific mp3 in SD:/02/004.mp3; Folder Name(1~10); File Name(1~1000)
  //  delay(1000);
  //  myDFPlayer.loopFolder(5); //loop all mp3 files in folder SD:/05.
  //  delay(1000);
  //  myDFPlayer.randomAll(); //Random play all the mp3.
  //  delay(1000);
  //  myDFPlayer.enableLoop(); //enable loop.
  //  delay(1000);
  //  myDFPlayer.disableLoop(); //disable loop.
  //  delay(1000);

//----Read imformation----
#ifdef _myDebug
  Log.print("Firmware Version: ");
  Log.println(myDFPlayer.readType());
  Log.println(myDFPlayer.readState());                //read mp3 state
  Log.println(myDFPlayer.readVolume());               //read current volume
  Log.println(myDFPlayer.readEQ());                   //read EQ setting
  Log.println(myDFPlayer.readFileCounts());           //read all file counts in SD card
  Log.println(myDFPlayer.readCurrentFileNumber());    //read current play file number
  Log.println(myDFPlayer.readFileCountsInFolder(3));  //read file counts in folder SD:/03
#endif
  for (int i = 0; i < 5; i++) {
    digitalWrite(LED_PORT, LOW);
    yieldFor(100);
    digitalWrite(LED_PORT, HIGH);
    yieldFor(100);
  }
  digitalWrite(LED_PORT, LOW);

  Wire.begin(16);
  Wire.onReceive(receiveEvent);
  Wire.onRequest(requestEvent);
}

void loop() {
  // static unsigned long timer = millis();

  // if (millis() - timer > 50000) {
  //   timer = millis();
  //   myDFPlayer.next();  //Play next mp3 every 5 second.
  // }

  if (change_volume_req) {
    const uint8_t vol = rd_data[0];
    change_volume_req = false;
    myDFPlayer.volume(vol);
    yieldFor(DF_POST_PLAY_GAP);
  }

  if (play_num_req) {
    const uint8_t folder_number = rd_data[0];
    const int32_t ext_number = (int32_t)(((uint32_t)rd_data[1] << 24) | ((uint32_t)rd_data[2] << 16) | ((uint32_t)rd_data[3] << 8) | (uint32_t)rd_data[4]);

    play_num_req = false;
    isPlaying = true;
    digitalWrite(LED_PORT, isPlaying);

    if ((ext_number % 100) == 0)
      sayInt(folder_number, ext_number / 100);
    else
      sayFloat(folder_number, ext_number, 2);

    uint32_t t = millis();
    while (digitalRead(BUSY_PORT) == DF_PLAYING && (millis() - t < DF_NUM_START_WAIT))
      yieldFor(10);
    yieldFor(DF_POST_PLAY_GAP);
  }

  if (play_func_req) {
    const uint8_t cmd = rd_data[0];
    const uint8_t func = rd_data[1];
    play_func_req = false;
    if (cmd == 0x47) {
      switch (func) {
        case 0:
          myDFPlayer.disableDAC();
          break;
        case 1:
          myDFPlayer.enableDAC();
          break;
        case 2:
          myDFPlayer.volumeUp();
          break;
        case 3:
          myDFPlayer.volumeDown();
          break;
        case 4:
          myDFPlayer.stop();
          break;
        case 5:
          myDFPlayer.next();
          break;
        case 6:
          myDFPlayer.previous();
          break;
        case 7:
          myDFPlayer.pause();
          break;
        case 8:
          myDFPlayer.start();
          break;
        case 9:
          myDFPlayer.enableLoop();
          break;
        case 10:
          myDFPlayer.disableLoop();
          break;
        case 11:
          myDFPlayer.enableLoopAll();
          break;
        case 12:
          myDFPlayer.disableLoopAll();
          break;
        case 13:
          myDFPlayer.randomAll();
          break;
        default:
          break;
      }
    }
  }

  if (play_large_req) {
    const uint8_t folder_number = rd_data[0];
    const uint16_t file_number = (uint16_t)rd_data[1] | ((uint16_t)rd_data[2] << 8);

    play_large_req = false;
    isPlaying = true;
    digitalWrite(LED_PORT, isPlaying);

    myDFPlayer.playLargeFolder(folder_number, file_number);

    uint32_t t = millis();
    while (digitalRead(BUSY_PORT) == DF_IDLE && (millis() - t < DF_START_TIMEOUT))
      yieldFor(10);
  }

  if (play_song_req) {
    const uint8_t folder_number = rd_data[0];
    uint8_t file_number = rd_data[1];

    play_song_req = false;
    isPlaying = true;
    digitalWrite(LED_PORT, isPlaying);

    if (folder_number == 5) {
      if (file_number > 100)
        file_number = file_number % 100;
      if ((file_number <= 20) || (file_number % 10 == 0))
        saySmart(5, file_number);
      else {
        // myDFPlayer.playFolder(6, ((int)file_number/10)*10);
        // delay(df_delay[(int)file_number/10])  ;
        saySmart(6, ((int)file_number / 10) * 10);
        saySmart(5, file_number % 10);
      }
    } else {

      while (myDFPlayer.available()) {
        myDFPlayer.readType();
        myDFPlayer.read();
      }
      myDFPlayer.stop();
      yieldFor(DF_POST_PLAY_GAP);

      if (folder_number == 17 || folder_number == 18)
        yieldFor(300);

      say(folder_number, file_number);
      //saySmart(folder_number, file_number);

      uint32_t t = millis();
      while (digitalRead(BUSY_PORT) == DF_IDLE && (millis() - t < DF_START_TIMEOUT))
        yieldFor(10);
    }
  }

  static uint32_t idleSince = 0;
  if (digitalRead(BUSY_PORT) == DF_PLAYING) {  // LOW = Playing
    isPlaying = true;
    idleSince = 0;
  } else {  // HIGH = Idle
    if (idleSince == 0) {
      idleSince = millis();
    } else if (millis() - idleSince >= DF_IDLE_DEBOUNCE) {
      isPlaying = false;
    }
  }

  digitalWrite(LED_PORT, isPlaying);

#ifdef _myDebug
  if (myDFPlayer.available()) {
    printDetail(myDFPlayer.readType(), myDFPlayer.read());  //Print the detail message from DFPlayer to handle different errors and states.
  }
#endif
}

#ifdef _myDebug
void printDetail(uint8_t type, int value) {
  switch (type) {
    case TimeOut:
      Log.println(F("Time Out!"));
      break;
    case WrongStack:
      Log.println(F("Stack Wrong!"));
      break;
    case DFPlayerCardInserted:
      Log.println(F("Card Inserted!"));
      break;
    case DFPlayerCardRemoved:
      Log.println(F("Card Removed!"));
      break;
    case DFPlayerCardOnline:
      Log.println(F("Card Online!"));
      break;
    case DFPlayerUSBInserted:
      Log.println("USB Inserted!");
      break;
    case DFPlayerUSBRemoved:
      Log.println("USB Removed!");
      break;
    case DFPlayerPlayFinished:
      Log.print(F("Number:"));
      Log.print(value);
      Log.println(F(" Play Finished!"));
      break;
    case DFPlayerError:
      Log.print(F("DFPlayerError:"));
      switch (value) {
        case Busy:
          Log.println(F("Card not found"));
          break;
        case Sleeping:
          Log.println(F("Sleeping"));
          break;
        case SerialWrongStack:
          Log.println(F("Get Wrong Stack"));
          break;
        case CheckSumNotMatch:
          Log.println(F("Check Sum Not Match"));
          break;
        case FileIndexOut:
          Log.println(F("File Index Out of Bound"));
          break;
        case FileMismatch:
          Log.println(F("Cannot Find File"));
          break;
        case Advertise:
          Log.println(F("In Advertise"));
          break;
        default:
          break;
      }
      break;
    default:
      break;
  }
}
#endif

void requestEvent() {
  uint8_t i2c_wr_data[1] = { (uint8_t)(isPlaying ? 0xFF : 0x00) };
  Wire.write(i2c_wr_data, 1);  // respond with message of 1 bytes
#ifdef _myDebug
  Log.print("Sent playback status: ");
  Log.println(i2c_wr_data[0], HEX);
#endif
}

void receiveEvent(int howMany) {
  if (howMany <= 0 || Wire.available() < howMany) return;  // Safety check

#ifdef _myDebug
  Log.print("Received ");
  Log.print(howMany);
  Log.println(" byte(s)");
#endif

  for (int i = 0; i < howMany && i < 5; i++)
    rd_data[i] = Wire.read();

  if (howMany == 5) {
    //if (!play_num_req)
    {
      play_num_req = true;
    }
  } else if (howMany == 4) {
    //if (!play_func_req)
    {
      play_func_req = true;
    }
  } else if (howMany == 3) {
    //if (!play_large_req)
    {
      play_large_req = true;
    }
  } else if (howMany == 2) {
    //if (!play_song_req)
    {
      play_song_req = true;
    }
  } else if (howMany == 1) {
    if ((rd_data[0] & 0xE0) == 0xA0) {
      rd_data[0] = rd_data[0] & 0x1F;
      change_volume_req = true;
    } else {  // Clear any leftover bytes
      while (Wire.available() > 0)
        Wire.read();
    }
  } else {  // Clear any leftover bytes
    while (Wire.available() > 0)
      Wire.read();
  }
}

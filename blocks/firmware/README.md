# CJP firmware releases

Every CJP uses an Arduino Uno / ATmega328P with the standard Uno Optiboot bootloader, at 115200 baud. The editor checks the deployed manifest on each connection. Matching versions connect without writing; older or unidentified firmware requires confirmation. Declining leaves simulation available. Newer versions are blocked without downgrading.

## Publishing a new release

1. Build CodyPi for Arduino Uno. Change its reported firmware version for every release.
2. Run `python blocks/firmware/update.py "PATH_TO_CodyPi.ino.hex" 1.19.7` from the repository root, using the actual new version.
3. Run `node blocks/tests/firmware.cjs` and commit the new HEX and manifest together, then deploy the complete release normally.

HEX filenames contain their SHA-256 hash. The editor rejects corrupt downloads and invalid HEX records before resetting or writing the board. This checksum detects corruption/mismatched deployments; it is not a digital signature.

The uploader checks the bootloader-reported ATmega328P signature before writing. This identifies the MCU, not the CJP product: selecting another Uno can replace its sketch after confirmation. Each 128-byte page is read back before continuing; the editor then restarts and requires the expected CJP identity/version. EEPROM and the bootloader are not deliberately written. A connection failure requires clicking Connect again and confirming another attempt; a partially programmed sketch is recoverable through the bootloader.

## Physical acceptance checks (required before release)

Test desktop Chrome Web Serial and Android Chrome CH340 WebUSB separately:

- Matching 1.19.6 connects without prompting or uploading.
- Older firmware offers update; declining prevents hardware use but permits simulation.
- A different sketch / no identity offers installation and subsequently identifies 1.19.6.
- Wrong port, denied permission, unsupported MCU, and occupied port produce actionable errors.
- Unplug during upload/readback, reconnect, and retry successfully.
- Confirm USB upload, full readback, post-reset identity, and normal gadget operation on both transports.
- Newer firmware never triggers a downgrade; failed downloads never write flash.

Software tests use a simulated bootloader. Physical USB timing, reset behavior, and recovery still require real CJP testing.

Protocol references: https://github.com/Optiboot/optiboot/wiki/HowOptibootWorks and https://github.com/arduino/ArduinoCore-avr/blob/master/bootloaders/optiboot/stk500.h

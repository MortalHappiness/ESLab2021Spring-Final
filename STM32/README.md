## STM32

### Dependency

1. mbed-os version `6.10`
2. BSP_B-L475E-IOT01
3. wifi-ism43362

### Build

1. Create `mbed_app.json` from `example_mbed_app.json`
2. Edit wifi ssid and password to yours in `mbed_app.json`
3. Edit `IP_ADDR` and `PORT_NUM` macros in `Wifi.h`
4. You may change the `SAMPLE_RATE` in `Sensor.h`

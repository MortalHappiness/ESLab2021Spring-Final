/* WiFi Example
 * Copyright (c) 2016 ARM Limited
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
// #include <cstdint>
// #include <string>

#include "BUILD/DISCO_L475VG_IOT01A/ARMC6/mbed_config.h"
#include "Callback.h"
// #include "NetworkInterface.h"
#include "PinNames.h"
// #include "WiFiInterface.h"
// #include "ISM43362Interface.h"
// #include "SocketAddress.h"
// #include "TCPSocket.h"
// #include "mbed.h"
// #include "stm32l475e_iot01_accelero.h"
// #include "stm32l475e_iot01_gyro.h"
// #include "stm32l475e_iot01_hsensor.h"
// #include "stm32l475e_iot01_psensor.h"
// #include "stm32l475e_iot01_magneto.h"

#include "Wifi.h"

// #if (defined(TARGET_DISCO_L475VG_IOT01A) || defined(TARGET_DISCO_F413ZH))
// #include "ISM43362Interface.h"
ISM43362Interface wifig(MBED_CONF_APP_WIFI_SPI_MOSI,
                        MBED_CONF_APP_WIFI_SPI_MISO,
                        MBED_CONF_APP_WIFI_SPI_SCLK, MBED_CONF_APP_WIFI_SPI_NSS,
                        MBED_CONF_APP_WIFI_RESET, MBED_CONF_APP_WIFI_DATAREADY,
                        MBED_CONF_APP_WIFI_WAKEUP, false);
;




InterruptIn button(BUTTON1);


#define SEND_INT 1

#define PLAYER 1

Thread button_thread;
Thread velocity_thread;
EventQueue button_event_queue(16 * EVENTS_EVENT_SIZE);
EventQueue velocity_event_queue(16 * EVENTS_EVENT_SIZE);
EventQueue event_queue(16 * EVENTS_EVENT_SIZE);

Sensor sensor(event_queue);
Wifi wifi(&sensor, velocity_event_queue, &wifig);

void button_change() {
    // event_queue.call(callback(&sensor, &Sensor::calibrate));
    // event_queue.call(callback(&wifi, &Wifi::connect));
    button_event_queue.call(callback(&wifi, &Wifi::button_send_data));
    // event_queue.call(printf, "button change\n");
}

int main() {
    // pc.baud(115200);
    printf("============================\n");
    printf(" fruit killer wifi web game \n");
    printf("============================\n");

#ifdef MBED_MAJOR_VERSION
    printf("Mbed OS version %d.%d.%d\n\n", MBED_MAJOR_VERSION,
           MBED_MINOR_VERSION, MBED_PATCH_VERSION);
#endif
    button_thread.start(
        callback(&button_event_queue, &EventQueue::dispatch_forever));
    velocity_thread.start(
        callback(&velocity_event_queue, &EventQueue::dispatch_forever));
    /* enable in-game reconnecting and recalibrating */
    button.fall(&button_change);
    button.rise(&button_change);

    // button_event_queue.call(printf, "button button change\n");
    // button_event_queue.dispatch_forever();
    // event_queue.call(printf, "event button change\n");
    event_queue.dispatch_forever();
    printf("\nDone\n");
}
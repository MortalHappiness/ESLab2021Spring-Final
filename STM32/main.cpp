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

#include <string>
#include "mbed.h"
#include "stm32l475e_iot01_accelero.h"
#include "stm32l475e_iot01_gyro.h"

Serial pc(USBTX, USBRX);
InterruptIn button(USER_BUTTON);

#define IP_ADDR "172.20.10.6"
#define PORT_NUM 6688
#define SEND_INT 1
#define SAMPLE_RATE 2
#define PLAYER 1
// #define DRUNK
// #define USE_ANGLE

static events::EventQueue event_queue(/* event count */ 16 * EVENTS_EVENT_SIZE);

class Sensor
{
#define SCALE_MULTIPLIER 0.045
#define TIMESTEP (float)SAMPLE_RATE / 1000
public:
    Sensor(events::EventQueue &event_queue) : _event_queue(event_queue)
    {
        BSP_ACCELERO_Init();
        BSP_GYRO_Init();
        calibrate();
        _event_queue.call_every(SAMPLE_RATE, this, &Sensor::update);
    }

    void calculate(float *pGyroDataXYZ, int16_t *pAccDataXYZ)
    {
        for (int i = 0; i < 3; ++i)
        {
#ifndef DRUNK
            if (_k[i] > 0)
            {
                _velocity[i] *= 0.3;
                --_k[i];
                continue;
            }
#endif // DRUNK
#ifdef USE_ANGLE
            if (abs(pGyroDataXYZ[i]) > 15)
                _angle[i] += (pGyroDataXYZ[i] + _GyroAccumulate[i]) / 2 * TIMESTEP * SCALE_MULTIPLIER;
#endif // USE_ANGLE

            float v = _velocity[i];
            if (abs(pAccDataXYZ[i]) > 3 /*&& pAccDataXYZ[i] * _velocity[i] >= 0*/)
                _velocity[i] += (pAccDataXYZ[i] + _AccAccumulate[i]) / 2 * TIMESTEP;
            else
            {
                _velocity[i] *= 0.5;
                if (abs(v) > 1)
                    _k[i] = 25;
            }

            if (v * _velocity[i] < 0)
                _velocity[i] = 0;
        }
        if (abs(pAccDataXYZ[2]) > 10)
            _velocity[0] = _velocity[1] = 0;

        for (int i = 0; i < 3; ++i)
        {
            _GyroAccumulate[i] = pGyroDataXYZ[i];
            _AccAccumulate[i] = pAccDataXYZ[i];
        }
    }

    void calibrate()
    {
        pc.printf("Calibrating...\n");
        int num = 0;

        for (int i = 0; i < 3; ++i)
            _GyroOffset[i] = _AccOffset[i] = 0;

        while (num < 2000)
        {
            num++;
            BSP_GYRO_GetXYZ(_pGyroDataXYZ);
            BSP_ACCELERO_AccGetXYZ(_pAccDataXYZ);
            for (int i = 0; i < 3; ++i)
            {
                _GyroOffset[i] += _pGyroDataXYZ[i];
                _AccOffset[i] += _pAccDataXYZ[i];
            }
            wait(TIMESTEP);
        }

        for (int i = 0; i < 3; ++i)
        {
            _GyroOffset[i] /= num;
            _AccOffset[i] /= num;

            _angle[i] = _velocity[i] = _pAccDataXYZ[i] = _pGyroDataXYZ[i] = 0;
        }

        for (int i = 0; i < 3; ++i)
            pc.printf("%d ", _AccOffset[i]);
        pc.printf("\n");

        pc.printf("Done calibration\n");
    }

    void update()
    {
        ++_sample_num;

        BSP_GYRO_GetXYZ(_pGyroDataXYZ);
        BSP_ACCELERO_AccGetXYZ(_pAccDataXYZ);
        for (int i = 0; i < 3; ++i)
        {
            _pGyroDataXYZ[i] = (_pGyroDataXYZ[i] - _GyroOffset[i]) * SCALE_MULTIPLIER;
            _pAccDataXYZ[i] = _pAccDataXYZ[i] - _AccOffset[i];
        }

        wait(TIMESTEP);

        calculate(_pGyroDataXYZ, _pAccDataXYZ);
    }

    void getDirection(uint8_t &right, uint8_t &up)
    {
        /* up or down */
        if (abs(_velocity[0]) > 1)
        {
            if (_velocity[0] < 0)
            {
                pc.printf("%5s ", "down");
                up = 2;
            }
            else
            {
                pc.printf("%5s ", "up");
                up = 1;
            }
        }
        else
        {
            pc.printf("still ");
            up = 0;
        }

        /* right or left */
        if (abs(_velocity[1]) > 1)
        {
            if (_velocity[1] > 0)
            {
                pc.printf("%5s\n", "right");
                right = 1;
            }
            else
            {
                pc.printf("%5s\n", "left");
                right = 2;
            }
        }
        else
        {
            pc.printf("still\n");
            right = 0;
        }

        pc.printf("\n");

        up = (uint8_t)(_velocity[0]);
        right = (uint8_t)(_velocity[1]);

        pc.printf("send: %d %d\n", up, right);
    }

    // returns angle / 2 due to 8 bit
    void getAngle(uint8_t &angle)
    {
        angle = int(_angle[2]) / 2;
    }

private:
    float _angle[3] = {};
    float _velocity[3] = {};
    int _k[3] = {};

    float _GyroAccumulate[3] = {};
    float _AccAccumulate[3] = {};

    int _sample_num = 0;
    int16_t _pAccDataXYZ[3] = {0};
    float _pGyroDataXYZ[3] = {0};

    int _AccOffset[3] = {};
    float _GyroOffset[3] = {};

    events::EventQueue &_event_queue;
};

class Wifi
{
public:
    Wifi(Sensor *sensor, events::EventQueue &event_queue) : _sensor(sensor), _event_queue(event_queue), _led1(LED1, 1)
    {
        connect();
    }

    void connect()
    {
        _wifi = WiFiInterface::get_default_instance();
        if (!_wifi)
        {
            pc.printf("ERROR: No WiFiInterface found.\n");
            return;
        }

        pc.printf("\nConnecting to %s...\n", MBED_CONF_APP_WIFI_SSID);
        int ret = _wifi->connect(MBED_CONF_APP_WIFI_SSID, MBED_CONF_APP_WIFI_PASSWORD, NSAPI_SECURITY_WPA_WPA2);
        if (ret != 0)
        {
            pc.printf("\nConnection error: %d\n", ret);
            return;
        }

        pc.printf("Success\n\n");
        pc.printf("MAC: %s\n", _wifi->get_mac_address());
        pc.printf("IP: %s\n", _wifi->get_ip_address());
        pc.printf("Netmask: %s\n", _wifi->get_netmask());
        pc.printf("Gateway: %s\n", _wifi->get_gateway());
        pc.printf("RSSI: %d\n\n", _wifi->get_rssi());

        int result = _socket.open(_wifi);

        if (result != 0)
        {
            printf("Error! socket.open() returned: %d\n", result);
            _socket.close();
            return;
        }

        result = _socket.connect(IP_ADDR); //, PORT_NUM);
        if (result != 0)
        {
            printf("Error! socket.connect() returned: %d\n", result);
            // Close the socket to return its memory and bring down the network interface
            _socket.close();
            return;
        }

        pc.printf("Connected to IP: %s, Port: %d", IP_ADDR, PORT_NUM);

        _event_queue.call_every(SEND_INT, this, &Wifi::send_data);
        _event_queue.call_every(500, this, &Wifi::blink);
    }

    void blink()
    {
        _led1 = !_led1;
    }

    ~Wifi()
    {
        _socket.close();
        _wifi->disconnect();
    }

    void send_data()
    {
        uint8_t right = 0, up = 0, angle = 0;
        _sensor->getDirection(right, up);
#ifdef USE_ANGLE
        _sensor->getAngle(angle);
#endif // USE_ANGLE
        char cbuffer[1024];
        int len = sprintf(cbuffer, "{\'dx\':" + to_string(right) + ",\'dy\':" + to_string(up) + "}");
        // string sbuffer = "{\'dx\':" + to_string(right) + ",\'dy\':" + to_string(up) + "}";
        // const char *cbuffer = sbuffer.c_str();
        int ret = _socket.sendto(IP_ADDR, PORT_NUM, cbuffer, len);
    }

private:
    WiFiInterface *_wifi;
    UDPSocket _socket;
    Sensor *_sensor;
    DigitalOut _led1;
    events::EventQueue &_event_queue;
};

Sensor sensor(event_queue);
Wifi wifi(&sensor, event_queue);

void reset()
{
    event_queue.call(callback(&sensor, &Sensor::calibrate));
    event_queue.call(callback(&wifi, &Wifi::connect));
}

int main()
{
    pc.baud(115200);
    pc.printf("============================\n");
    pc.printf(" fruit killer wifi web game \n");
    pc.printf("============================\n");

#ifdef MBED_MAJOR_VERSION
    pc.printf("Mbed OS version %d.%d.%d\n\n", MBED_MAJOR_VERSION, MBED_MINOR_VERSION, MBED_PATCH_VERSION);
#endif

    /* enable in-game reconnecting and recalibrating */
    button.fall(&reset);

    event_queue.dispatch_forever();

    pc.printf("\nDone\n");
}
#include "stm32l475e_iot01_accelero.h"
#include "stm32l475e_iot01_gyro.h"
#include <cstdint>
#include "mbed.h"
#define SAMPLE_RATE 10
class Sensor {
#define SCALE_MULTIPLIER 0.045
#define TIMESTEP (float)SAMPLE_RATE / 1000 /3
  public:
    Sensor(events::EventQueue &event_queue) : _event_queue(event_queue) {
        BSP_ACCELERO_Init();
        BSP_GYRO_Init();
        calibrate();
        _event_queue.call_every(SAMPLE_RATE, this, &Sensor::update);
        _event_queue.call_every(SAMPLE_RATE * 2, this,
                                &Sensor::update_position);
    }

    void calculate(float *pGyroDataXYZ, int16_t *pAccDataXYZ) {
        for (int i = 0; i < 3; ++i) {
            float v = _velocity[i];
            if (abs(pAccDataXYZ[i]) > 3) {
                // if(_velocity[i] >  -pAccDataXYZ[i]/50 ||_velocity[i] <
                // -pAccDataXYZ[i]/50){
                //     _velocity[i] *= 0.5;
                // }
                _velocity[i] += pAccDataXYZ[i] * TIMESTEP;
                // }
                // _velocity[i] +=(pAccDataXYZ[i] + pAccDataXYZ[i]) / 2 *
                // TIMESTEP;
            }

            // else if (abs(pAccDataXYZ[i]) > 4) {
            //     _velocity[i] += (pAccDataXYZ[i]) * TIMESTEP;
            // }
            //  else{
            //     _velocity[i] += (pAccDataXYZ[i]) * TIMESTEP;
            // }
            else {
                // if (abs(_velocity[i]) < 5)
                //     _velocity[i] = 0;
                // else (abs(_velocity[i]) < 10){
                //     _velocity[i] *= 0.5;
                // }
                // else{
                // _velocity[i] += (pAccDataXYZ[i]) * TIMESTEP;
                // if (_velocity[i] < 5){
                _velocity[i] *= 0.5;
                // }
                // }
            }
            if (v * _velocity[i] < 0) {
                _velocity[i] = 0;
            } else if (_velocity[i] > 20) {
                _velocity[i] = 20;
            } else if (_velocity[i] < -20) {
                _velocity[i] = -20;
            }
        }
        float total = _velocity[1] *_velocity[1] + _velocity[0] * _velocity[0];
        if(total > 400){
            
            _velocity[1] = _velocity[1] / (total ) * 400;
            _velocity[0] = _velocity[0] / (total ) * 400;
        }
        // if (abs(pAccDataXYZ[2]) > 10)
        //     _velocity[0] = _velocity[1] = 0;
        // printf("a: %d %d\n", _pAccDataXYZ[0], _pAccDataXYZ[1]);
        // printf("v: %3f %3f\n", _velocity[0], _velocity[1]);
        // printf("p: %3f %3f\n", _position[0], _position[1]);
        for (int i = 0; i < 2; ++i) {
            _GyroAccumulate[i] = pGyroDataXYZ[i];
            _AccAccumulate[i] = pAccDataXYZ[i];
        }
    }

    void update_position() {
        for (int i = 0; i < 3; ++i) {
            _position[i] += _velocity[i];
        }
    }

    void calibrate() {
        printf("Calibrating...\n");
        int num = 0;

        for (int i = 0; i < 3; ++i)
            _GyroOffset[i] = _AccOffset[i] = 0;

        while (num < 2000) {
            num++;
            BSP_GYRO_GetXYZ(_pGyroDataXYZ);
            BSP_ACCELERO_AccGetXYZ(_pAccDataXYZ);
            for (int i = 0; i < 3; ++i) {
                _GyroOffset[i] += _pGyroDataXYZ[i];
                _AccOffset[i] += _pAccDataXYZ[i];
            }
            ThisThread::sleep_for(TIMESTEP);
        }

        for (int i = 0; i < 3; ++i) {
            _GyroOffset[i] /= num;
            _AccOffset[i] /= num;

            // _angle[i] = _velocity[i] = _pAccDataXYZ[i] = _pGyroDataXYZ[i] = 0;
        }

        for (int i = 0; i < 3; ++i)
            printf("%d ", _AccOffset[i]);
        printf("\n");
        for (int i = 0; i < 3; ++i)
            printf("%6f ", (_GyroOffset[i]));
        printf("\n");

        printf("Done calibration\n");
    }

    void update() {
        ++_sample_num;

        BSP_GYRO_GetXYZ(_pGyroDataXYZ);
        BSP_ACCELERO_AccGetXYZ(_pAccDataXYZ);

        for (int i = 0; i < 3; ++i) {
            _pGyroDataXYZ[i] =
                (_pGyroDataXYZ[i] - _GyroOffset[i]) * SCALE_MULTIPLIER;
            _pAccDataXYZ[i] = (_pAccDataXYZ[i] - _AccOffset[i]);
        }
        // printf("%d %d %d\n", _pAccDataXYZ[0], _pAccDataXYZ[1],
        // _pAccDataXYZ[2]);
        calculate(_pGyroDataXYZ, _pAccDataXYZ);
    }

    void getDirection(int16_t &right, int16_t &up) {
        up = (int16_t)(_velocity[0]);
        right = (int16_t)(_velocity[1]);
        // printf("send: %d %d\n", up, right);
    }

    void getVelocity(float &right, float &up) {
        up = -(_velocity[0]);
        right = -(_velocity[1]);
    }

    // returns angle / 2 due to 8 bit
    void getAngle(uint8_t &angle) { angle = int(_angle[2]) / 2; }

  private:
    float _angle[3] = {};
    float _velocity[3] = {};
    int _k[3] = {};

    float _GyroAccumulate[3] = {};
    float _AccAccumulate[3] = {};

    int _sample_num = 0;
    int16_t _pAccDataXYZ[3] = {0, 0, 0};
    float _pGyroDataXYZ[3] = {0, 0, 0};

    int _AccOffset[3] = {};
    float _GyroOffset[3] = {};

    float _position[3] = {0, 0, 0};

    events::EventQueue &_event_queue;
};
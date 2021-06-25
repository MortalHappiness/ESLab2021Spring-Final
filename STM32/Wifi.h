#include "WiFiInterface.h"
#include "ISM43362Interface.h"
#include "SocketAddress.h"
#include "TCPSocket.h"
#include "Sensor.h"
#include <string>
#define IP_ADDR "172.20.10.7"
// "192.168.43.180" "172.20.10.7" "34.80.242.27"
#define PORT_NUM 8001
const char *sec2str(nsapi_security_t sec) {
    switch (sec) {
    case NSAPI_SECURITY_NONE:
        return "None";
    case NSAPI_SECURITY_WEP:
        return "WEP";
    case NSAPI_SECURITY_WPA:
        return "WPA";
    case NSAPI_SECURITY_WPA2:
        return "WPA2";
    case NSAPI_SECURITY_WPA_WPA2:
        return "WPA/WPA2";
    case NSAPI_SECURITY_UNKNOWN:
    default:
        return "Unknown";
    }
}
class Wifi {
  public:
    Wifi(Sensor *sensor, events::EventQueue &event_queue,
         ISM43362Interface *wifi)
        : _sensor(sensor), _event_queue(event_queue), _wifi(wifi),
          _led1(LED1, 1) {
        // _wifi();
        down = 0;
        // scan_demo();
        connect();
    }

    void scan_demo() {
        WiFiAccessPoint *ap;

        printf("Scan:\n");

        // int count = _wifi->scan(NULL, 0);
        // printf("%d networks available.\n", count);

        /* Limit number of network arbitrary to 15 */
        int count = 10;
        count = count < 15 ? count : 15;

        ap = new WiFiAccessPoint[count];
        count = _wifi->scan(ap, count);
        for (int i = 0; i < count; i++) {
            printf("Network: %s secured: %s BSSID: "
                   "%hhX:%hhX:%hhX:%hhx:%hhx:%hhx RSSI: %hhd Ch: %hhd\r\n",
                   ap[i].get_ssid(), sec2str(ap[i].get_security()),
                   ap[i].get_bssid()[0], ap[i].get_bssid()[1],
                   ap[i].get_bssid()[2], ap[i].get_bssid()[3],
                   ap[i].get_bssid()[4], ap[i].get_bssid()[5], ap[i].get_rssi(),
                   ap[i].get_channel());
        }
        printf("%d networks available.\r\n", count);
        delete[] ap;
    }

    void connect() {

        if (!_wifi) {
            printf("ERROR: No WiFiInterface found.\n");
            return;
        }
        // #ifdef CONNECT
        printf("\nConnecting to %s...\n", MBED_CONF_APP_WIFI_SSID);
        int ret =
            _wifi->connect(MBED_CONF_APP_WIFI_SSID, MBED_CONF_APP_WIFI_PASSWORD,
                           NSAPI_SECURITY_WPA_WPA2);
        if (ret != 0) {
            printf("\nConnection error: %d\n", ret);
            return;
        }

        nsapi_error_t result;
        // TCPSocket _socket;
        SocketAddress a;
        _wifi->get_ip_address(&a);
        printf("IP: %s\n", a.get_ip_address() ? a.get_ip_address() : "None");
        result = _socket.open(_wifi);
        if (result != 0) {
            printf("Error! socket.open() returned: %d\n", result);
            _socket.close();
            return;
        }
        _a.set_ip_address(IP_ADDR);
        _a.set_port(PORT_NUM);
        result = _socket.connect(_a);

        if (result != 0) {
            printf("Error! socket.connect() returned: %d\n", result);
            // Close the socket to return its memory and bring down the network
            // interface
            _socket.close();
            return;
        }

        printf("\nSuccess\n");
        printf("MAC: %s\n", _wifi->get_mac_address());
        _wifi->get_ip_address(&a);
        printf("IP: %s\n", a.get_ip_address());
        _wifi->get_netmask(&a);
        printf("Netmask: %s\n", a.get_ip_address());
        _wifi->get_gateway(&a);
        printf("Gateway: %s\n", a.get_ip_address());
        printf("RSSI: %d\n\n", _wifi->get_rssi());
        printf("Connected to IP: %s, Port: %d\n", IP_ADDR, PORT_NUM);
        // #endif
        _event_queue.call_every(50ms, this, &Wifi::send_data);
        _event_queue.call_every(500ms, this, &Wifi::blink);
    }

    void blink() { _led1 = !_led1; }

    void button_send_data() {
        // printf("send mouse\n");
        down = !down;
        string sbuffer;
        if (down) {
            sbuffer = "{\"mouse\":\"down\"}";
        } else {
            sbuffer = "{\"mouse\":\"up\"}";
        }

        const char *cbuffer = sbuffer.c_str();
        int ret = _socket.sendto(_a, cbuffer, strlen(cbuffer)); // IP_ADDR,
        // PORT_NUM,
    }

    ~Wifi() {
        _socket.close();
        _wifi->disconnect();
    }

    void send_data() {
        float right = 0, up = 0;
        // int16_t right = 0, up = 0;
        uint8_t angle = 0;
        // _sensor->getDirection(right, up);
        _sensor->getVelocity(right, up);
#ifdef USE_ANGLE
        _sensor->getAngle(angle);
#endif // USE_ANGLE
       // printf("send: %d %d\n", up, right);
        SocketAddress a;
        a.set_ip_address(IP_ADDR);
        a.set_port(PORT_NUM);
        char buffer[1024];
        // int len = sprintf(buffer, "{\'dx\': %f,\'dy\':%f}", (right, up));
        string sbuffer =
            "{\"dx\":" + to_string(right) + ",\"dy\":" + to_string(up) + "}";
        const char *cbuffer = sbuffer.c_str();
        int ret = _socket.sendto(_a, cbuffer, strlen(cbuffer)); // IP_ADDR,
        // PORT_NUM,
    }

  private:
    WiFiInterface *_wifi;
    TCPSocket _socket;
    Sensor *_sensor;
    DigitalOut _led1;
    SocketAddress _a;
    events::EventQueue &_event_queue;
    int down;
};
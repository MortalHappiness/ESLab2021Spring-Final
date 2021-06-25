# ESLab2021Spring-Final

嵌入式實驗 Final Project - Mbed Fruit Ninga (搖桿切西瓜遊戲)

## Team Member

* B07901069 劉奇聖
* B07901052 劉展碩

## 動機

看到前人的作品 AirHockey 使用 STM32 當作搖桿來玩遊戲，我們覺得很有趣，且聽助教說這個 AirHockey 的搖桿移動速度不算快，可以做一些比較快速移動的遊戲來改善，因此我們想到了切西瓜這個需要快速移動刀子來切水果的遊戲。

## 程式執行

### Build Frontend

```
cd frontend
npm install

# development
npm start

# production
npm run build
```

### Start Server

```
cd server
npm install

# development
npm start

# production
npm run production
```

### Build STM32

See the [README.md](./STM32/README.md) inside `STM32` folder.

## 作法

### STM32

#### 功能

1. Get accerlerate data and compute velocity
2. Send velocity data to server periodically
3. Send signal immediately when user presses or releases the button

以上三個功能分別用三個不同的 thread 處理

#### 程式架構
1. `Sensor.h`
    定義一個 class Sensor，contructor 傳入 event_queue，專門計算 velocity 的 event_queue，這個 class 有些公用變數，重要的如下：
    ```
     float _velocity[3] # 紀錄當前速度
     int _AccOffset[3] # 儲存加速度儀的偏差
     int16_t _pAccDataXYZ[3] # 讀取加速度儀的值
     events::EventQueue &event_queue # 計算 velocity 的 event_queue
    ```
    以下是 class 內的函式：
    1. `calibrate()`
        將三個加速度儀的偏差值算出來，藉由取2000次的平均
    2. `calculate(float *pGyroDataXYZ, int16_t *pAccDataXYZ)`
        傳入新的加速度值，根據一些演算法(下一部分再詳細介紹)計算出新的 velocity
    3. `update()`
        取加速度儀的值，去除偏差後，交由 caculate() 來計算 velocity
    4. `getVelocity()`
        讓外部程式能夠讀取當前速度
2. `Wifi.h`
    定義一個 class Wifi，contructor 傳入 event_queue 和 Sensor object，event_queue 專門處理 send velocity data，Sensor object 讀取 velocity，這個 class 有些公用變數，重要的如下：
    ```
    WiFiInterface *_wifi # 連接 wifi 的 interface
    TCPSocket _socket # 連接 server 的 socket
    Sensor *_sensor # Sensor 讀取 velocity
    SocketAddress _a # socket 的 address
    events::EventQueue &_event_queue # 專門處理 send velocity data
    int down # 紀錄現在 button 狀態
    ```
    以下是 class 內的函式：
    1. `connect()`
       連接 wifi 以及連接 server socket，並且使  event_queue periodically call `send_data()` 
    2. `button_send_data()`
        送 button up, down 的資料
    3. `send_data()`
        送 velocity data 給 server
3. `main.c`
    1. 創三個 event queue，以及兩條額外的 thread
    2. Include `Wifi.h` and `Sensor.h` 建立這兩個 file 的 class object，sensor 和 wifi 分別傳入不同的 event queue
    3. `button_change()`
        將`wifi::button_send_data`加入最後一個event queue
    4. `main()`
        
        ```
        #button thread dispath button event queue
        button_thread.start(
        callback(&button_event_queue, &EventQueue::dispatch_forever))
        
       # velocity thread dispatch velocity event queue
       velocity_thread.start(callback(&velocity_event_queue, &EventQueue::dispatch_forever))
        
        # 設定 button rise fall event
        button.fall(&button_change) 
        button.rise(&button_change) 
        
        # main thread dispatch main event queue
        event_queue.dispatch_forever()
        ```
    
    

#### Optimization and Algorithm


#### Some problem we solve

1. Wifi SSID name
    When there is a space in wifi SSID，there may be some unexpected SSID name that wifi scanner read. Therefore, change wifi SSID to no space and no chinese word.
2. Mbed OS version 6.10. 
   There are many version issues when upgrade OS version to 6.10. We find the answer on the Internet, read the document example and keep try and error to solve the problem.

### Server 及遊戲網頁前端

使用 Node.js 作為 server 的開發語言，享有方便處理 asynchrous I/O 的優勢，讓 server 可以在收到資料時才做對應的動作，其他時候可以做別的事，如此一來玩遊戲時就不容易卡住。

Server 使用一個 port 當作 TCP socket server 負責接收來自 STM32 的資料，然後使用另一個 port 當作 web server 及 web socket server，負責將遊戲的網頁送給前端，在收到來自 STM32 的資料後會更新座標並把資料用 web socket 傳給前端，前端便可以即時更新刀的位置。

網頁遊戲前端修改自參考資料 2 的切西瓜網頁前端遊戲，將滑鼠控制改成接收來自 Server 的座標控制。使用 PixiJS 這個套件，藉由 WebGL 或 Canvas 在 HTML 5 裡面顯示動畫。

## 成果

部屬的遊戲網址：http://34.80.242.27:3000

Demo 影片：https://www.youtube.com/watch?v=G5BrsayyrR8

## 參考資料

- 2019 AirHockey project (STM32)
https://github.com/NTUEE-ESLab/2019-AirHockey/blob/master/STM32L475VG/wifi/main.cpp
- FruitNinja (Web Frontend)
  https://github.com/Arnarkari93/FruitNinja

import json
import urllib.request
import socket
import tkinter as tk


with open("../constants.json") as fin:
    constants = json.load(fin)

HOST = "localhost"
SERVER_PORT = 8000
SOCKET_PORT = 8001
WIDTH = constants["WIDTH"]
HEIGHT = constants["HEIGHT"]
SCALE = 2


class CanvasSocketWidget:
    def __enter__(self):
        self.s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        self.s.connect((HOST, SOCKET_PORT))
        with urllib.request.urlopen(f"http://localhost:{SERVER_PORT}/state") as res:
            state = json.loads(res.read())
        self.prev_pos = (state["x"], state["y"])
        return self

    def __exit__(self, exc_type, exc_value, traceback):
        self.s.close()

    def motion(self, event):
        prev_x, prev_y = self.prev_pos
        x = event.x * SCALE
        y = event.y * SCALE
        dx = (x - prev_x)
        dy = (y - prev_y)
        data = json.dumps({"dx": dx, "dy": dy}).encode()
        self.prev_pos = (x, y)
        self.s.sendall(data)

    def button_1(self, event):
        data = json.dumps({"mouse": "down"}).encode()
        self.s.sendall(data)

    def button_release_1(self, event):
        data = json.dumps({"mouse": "up"}).encode()
        self.s.sendall(data)


with CanvasSocketWidget() as w:
    root = tk.Tk()
    widget = tk.Canvas(root, bg="#66ff99",
                       width=WIDTH//SCALE, height=HEIGHT//SCALE)
    widget.bind("<Motion>", w.motion)
    widget.bind("<Button-1>", w.button_1)
    widget.bind("<ButtonRelease-1>", w.button_release_1)
    widget.pack()
    tk.mainloop()

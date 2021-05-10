import json
import socket
import tkinter as tk

HOST = "localhost"
PORT = 8001
WIDTH = 500
HEIGHT = 500


class CanvasSocketWidget:
    def __enter__(self):
        self.s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        self.s.connect((HOST, PORT))
        self.prev_pos = (WIDTH >> 1, HEIGHT >> 1)
        return self

    def __exit__(self, exc_type, exc_value, traceback):
        self.s.close()

    def motion(self, event):
        prev_x, prev_y = self.prev_pos
        dx = (event.x - prev_x) / (WIDTH >> 1)
        dy = (event.y - prev_y) / (HEIGHT >> 1)
        data = json.dumps({"dx": dx, "dy": dy}).encode()
        self.prev_pos = (event.x, event.y)
        self.s.sendall(data)

    def button_1(self, event):
        data = json.dumps({"mouse": "down"}).encode()
        self.s.sendall(data)

    def button_release_1(self, event):
        data = json.dumps({"mouse": "up"}).encode()
        self.s.sendall(data)


with CanvasSocketWidget() as w:
    root = tk.Tk()
    widget = tk.Canvas(root, bg="#66ff99", width=WIDTH, height=HEIGHT)
    widget.bind("<Motion>", w.motion)
    widget.bind("<Button-1>", w.button_1)
    widget.bind("<ButtonRelease-1>", w.button_release_1)
    widget.pack()
    tk.mainloop()

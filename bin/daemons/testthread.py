#!/usr/bin/env python
import threading
import time
import sys

class MyThread(threading.Thread):
    def __init__(self, cb):
        threading.Thread.__init__(self)
        self.callback = cb

    def run(self):
        for i in range(10):
            self.callback(i)
            time.sleep(1)


# test


def count(x):
    print x
    sys.stdout.flush()

t = MyThread(count)
t.start()

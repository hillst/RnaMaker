#!/usr/bin/python
import socket
import sys

HOST, PORT = "24.21.106.140", 8080 

# Create a socket (SOCK_STREAM means a TCP socket)
sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)

try:
    # Connect to server and send data
    print "Connected to ", HOST, ":", PORT, "\n","Awaiting input\n"
    data = sys.stdin.readline()
    sock.connect((HOST, PORT))
    print "Connected to ", HOST, ":", PORT, "\n","Awaiting input\n"
    exit = False
    while exit != True:
        sock.sendall(data + "\n")
        if data.strip() == 'bye':
            exit = True
        received = sock.recv(1024)
        print "Sent:     " , data
        print "Received: " , received
        data = sys.stdin.readline()
    # Receive data from the server and shut down
    
finally:
    sock.close()


#!/usr/bin/python
import SocketServer
import threading
import sys
import time
from pipeline_mod.pipeline import SingleSettingRunner

class manager(SocketServer.BaseRequestHandler):
    """
    The RequestHandler class for our server.

    It is instantiated once per connection to the server, and must
    override the handle() method to implement communication to the
    client.
            
    Ultimately, this method will handle an incoming request to some system program. The response will be a json object. This object will instruct
    the daemon which job to run and what parameters to pass it. The functions which can be called should be based on the system permissions. (something like date is okay, adduser is not)
    When the process finishes, the daemon will write the result to a file based on some uniqid, then return the name of this file to the php client.
    """ 
    def handle(self):
        # self.request is the TCP socket connected to the client
        # 1024 is the blocksize, make this a constant
        
        #give each handle their own queue which will contain the result, add a job to the queue and also to the mas
        print "recieved connection"
        self.data = self.request.recv(1024) # recieve request, blocks and attempts to read up to n-bytes
        print self.client_address[0], " wrote: "
        print self.data
        runner = SingleSettingRunner(self.data)
        response_code =  runner.startProcess()
        out_filename = runner.getOutputFilename()
        #push job onto a queue and monitor for completion
        self.request.sendall(str(response_code) + "," + out_filename)
        def finish(self):
            print "Shutting down..\n"
            
if __name__ == "__main__":
    HOST, PORT = "localhost", 1234

    # Create the server, binding to localhost on port 9999
    try:
        server = SocketServer.ThreadingTCPServer((HOST, PORT), manager)
        print "Listening on ", PORT
        # Activate the server; this will keep running until you
        # interrupt the program with Ctrl-C
        server.serve_forever()
        server.shutdown()
    except Exception as e:
        print >> sys.stderr, "exception caught, exiting"
        print e
        sys.exit()

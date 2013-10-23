#!/usr/bin/env python
'''
SandboxedDaemon.py -- Daemon responsible for running various scripts. Opens a passed port and listens for some request from a webserver, executing the passed command and then returning the result.
Expects a json request as from PipelineProcess, the program explicitly checks the name of the command, if it is not in our preapproved list the system logs and returns forbidden.

@author:     Steven Hill
            
@copyright:  2013 Donald Danforth Plant Science Center. All rights reserved.
            

@contact:    shill@danforthcenter.org
'''

import sys
import os
from subprocess import *
import SocketServer
import threading
import time
from pipeline_mod.pipeline import SingleSettingRunner


from optparse import OptionParser

__all__ = []
__version__ = 0.1
__date__ = '2013-08-22'
__updated__ = '2013-08-22'


def main(argv=None):
    '''Command line options.'''
    
    program_name = os.path.basename(sys.argv[0])
    program_version = "v0.1"
    program_build_date = "%s" % __updated__
 
    program_version_string = '%%prog %s (%s)' % (program_version, program_build_date)
    program_longdesc = '''''' # optional - give further explanation about what the program does
    program_license = "Copyright 2013 Steven Hill (Donald Danforth Plant Science Center)                                            \
                Licensed under the Apache License 2.0\nhttp://www.apache.org/licenses/LICENSE-2.0"
 
    if argv is None:
        argv = sys.argv[1:]
        # setup option parser
    parser = OptionParser(version=program_version_string, epilog=program_longdesc, description=program_license)
    parser.add_option("-s", "--host", dest="host", help="Host that the daemon will be listening on (0.0.0.0) default")
    parser.add_option("-p", "--port", dest="port", help="Port that the daemon will be listening on (1234) default")
    host, port = "0.0.0.0", 1234
    # process options
    (opts, args) = parser.parse_args(argv)
    if opts.host:
        host = opts.host
    if opts.port:
        port = int(opts.port)
    # MAIN BODY #
    StartServer(host, port)

class Manager(SocketServer.BaseRequestHandler):
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
        #force only programs in the runnable folder to be runnable
        runner.setPath("runnable/"+runner.getPath())
        response_code =  runner.startProcess()
        out_filename = runner.getOutputFilename()
        #out_filename expects a preceeding "/", as there should be a results folder. Strip this off before returning (the client knows about it!)
        out_filename = out_filename.split("/")[1]
        self.request.sendall(str(response_code) + "," + out_filename)
        def finish(self):
            print "Shutting down..\n"
          
def StartServer(HOST, PORT):
    try:
        server = SocketServer.ThreadingTCPServer((HOST, PORT), Manager)
        print "Listening on ", PORT
        # Activate the server; this will keep running until you
        # interrupt the program with Ctrl-C
        server.serve_forever()
        server.shutdown()
    except Exception as e:
        print >> sys.stderr, "exception caught, exiting"
        print e
        sys.exit()
if __name__ == "__main__":
        main()

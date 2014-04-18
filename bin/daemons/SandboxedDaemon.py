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
import re

from optparse import OptionParser

__all__ = []
__version__ = 0.1
__date__ = '2013-10-14'
__updated__ = '2013-10-14'


def main(argv=None):
    '''Command line options.'''
    
    program_name = os.path.basename(sys.argv[0])
    program_version = "v0.1"
    program_build_date = "%s" % __updated__
    program_longdesc = "" 
    program_version_string = '%%prog %s (%s)' % (program_version, program_build_date)
    program_license = "Copyright 2013 Steven Hill (Donald Danforth Plant Science Center)                                            \
                Licensed under the Apache License 2.0\nhttp://www.apache.org/licenses/LICENSE-2.0"
 
    if argv is None:
        argv = sys.argv[1:]
    parser = OptionParser(version=program_version_string, epilog=program_longdesc, description=program_license)
    parser.add_option("-s", "--host", dest="host", help="Host that the daemon will be listening on (0.0.0.0) default")
    parser.add_option("-p", "--port", dest="port", help="Port that the daemon will be listening on (1234) default")
    host, port = "0.0.0.0", 1234
    (opts, args) = parser.parse_args(argv)
    if opts.host:
        host = opts.host
    if opts.port:
        port = int(opts.port)
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
    def lols():
        print >>sys.stderr, "lols"
    def handle(self):
        # self.request is the TCP socket connected to the client
        # 1024 is the blocksize, make this a constant
        
        #give each handle their own queue which will contain the result, add a job to the queue and also to the mas
        print "recieved connection"
        self.request.setblocking(0)
        chunk = self.request.recv(1024)
        self.data = ""
        while chunk != "":
            try:
                self.data += chunk
                chunk = self.request.recv(1024)
            except:
                break
        print self.client_address[0], " wrote: "
        print self.data
        error = "errors/errorlog"
        runner = SingleSettingRunner(self.data, error)
        #push result up the stack, handle it here

        #make sure nothing malicious is going on; match non-alphanumeric characters, if exist exit.
        pattern ='[^0-9a-zA-Z_/\\-\\.]'
        if len(re.findall(pattern, runner.getPath())) > 0:
            print "match in path"
            return
        basepath = "/shares/jcarrington_share/www/psams/bin/"
        runner.setPath(basepath+runner.getPath())
        runner.setDefaultOutput() 
        #push output to another layer
        response_code = runner.startProcess()
        results = runner.getAllResults() #returns list
        self.request.sendall("\n".join(results))
        self.request.close()
        #close request
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

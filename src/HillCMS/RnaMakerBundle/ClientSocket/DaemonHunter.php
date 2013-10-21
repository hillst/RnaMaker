<?php
namespace HillCMS\RnaMakerBundle\ClientSocket;

Class DaemonHunter{
	private $address;
	private $serviceport;
	private $socket;
	/**
	 * Builds a socket using the address and serverport configured in daemon-settings.conf. That settings file should be in the same folder as this one.
	 * 
	 * The file should be formatted as:
	 * ADDRESS
	 * SERVICEPORT
	 * 
	 * Example:
	 * 127.0.0.1
	 * 1234
	 */
	function __construct() {
	//build socket info from file
		$fd = fopen(__DIR__ . "/daemon-settings.conf", "r");
		$this->address = trim(fgets($fd));
		$this->serviceport = trim(fgets($fd));
		$this->connectSocket();
	}
	/**
	 * Creates a socket with the initialized address and serviceport. Initializes the variable socket.
	 */
	private function connectSocket(){
		/* Create a TCP/IP socket. */
		$this->socket = socket_create(AF_INET, SOCK_STREAM, SOL_TCP);
		if ($this->socket === false) {
			//echo "[CLIENT] socket_create() failed: reason: " . socket_strerror(socket_last_error()) . "\n";
			return;
		}
		$result = socket_connect($this->socket, $this->address, $this->serviceport);
		if ($result === false) {
			return;
		} else {
			return;
		}
		
	}
	/** 
	 * Sends the socket our json object, and returns the output. The json file should look like this:
	 * {
	 * 		"job-name" : {
	 * 			"path": "path/to/executable"
	 * 			"output": "name_of_output"
	 * 			"arguments": [
	 * 				"arg1", "arg2",
	 * 				"-flag", "flag-arg"
	 * 			]
	 * 		}
	 * }
	 * 
	 * The expected output is status-code,written_file
	 * ex: 0,output.txt
	 * 
	 * @param json $json
	 * @return string
	 */
	function socketSend($json){
		socket_write($this->socket, $json, strlen($json));
		$continue = true;
		$response = "";
		while ($out = socket_read($this->socket, 2048)) {
			//echo "[SERVER]: " . $out ."\n";
			$response .= $out;
		}
		socket_close($this->socket);
		return $response;
	}
	
	function jsonBuilder($procname, $procpath, $output, $arguments){
		$json = '{ "'. $procname .'":{ "path":"'.$procpath.'","output":"'.$output.'","arguments": [';
		foreach ($arguments as $argument){
			$json .= '"' .$argument. '",';
		}
		$json = rtrim($json, ',');
		$json .= ']}}';
		return $json;
	}
}
?>
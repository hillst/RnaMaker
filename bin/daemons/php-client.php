<?php
error_reporting(E_ALL);


$service_port = 49152;
$address = "10.5.1.48";

/* Create a TCP/IP socket. */
$socket = socket_create(AF_INET, SOCK_STREAM, SOL_TCP);
if ($socket === false) {
    echo "[CLIENT] socket_create() failed: reason: " . socket_strerror(socket_last_error()) . "\n";
} 

echo "[CLIENT] Attempting to connect to '$address' on port '$service_port'...";
$result = socket_connect($socket, $address, $service_port);
if ($result === false) {
    echo "socket_connect() failed.\nReason: ($result) " . socket_strerror(socket_last_error($socket)) . "\n";
} else {
    echo "OK.\n";
}
$json = '
{
    "date": {
        "path": "date",
        "output": "testout.out",
        "arguments": [
        ]
    }
}';
//$in = "{'date':{'output':'client.output','path': 'date', 'arguments':[]}}";
$in = $json;
socket_write($socket, $in, strlen($in));
$continue = true;
    echo "[CLIENT] Reading response:\n\n";
    while ($out = socket_read($socket, 2048)) {
        echo "[SERVER]: " . $out ."\n";
    }
    echo "[CLIENT] No more messages. Reading input:\n";
echo "[CLIENT] Closing socket...";
socket_close($socket);
echo "OK.\n\n";
?>

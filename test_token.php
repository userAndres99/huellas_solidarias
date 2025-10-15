<?php
//datos del cliente que se encuentra en la web de nyckel
$clientId = '027ibebmh0bhanpj8zcouvkn6zd9w3uj';
$clientSecret = 'hssshfq1tm4kanu3bo2gkwe4hkcc12qe5r0ivx1s8av8q0ci59y71dzkdnax3e0q';


$ch = curl_init();


curl_setopt($ch, CURLOPT_URL, 'https://www.nyckel.com/connect/token');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
curl_setopt($ch, CURLOPT_POST, 1);
curl_setopt($ch, CURLOPT_POSTFIELDS, 'grant_type=client_credentials&client_id=' . $clientId . '&client_secret=' . $clientSecret);


$headers = array();
$headers[] = 'Content-Type: application/x-www-form-urlencoded';
curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);


$result = curl_exec($ch);
curl_close($ch);


echo $result;
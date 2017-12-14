var crypto = require('crypto');
var result;
var thrift = require('thrift'),
  HBase = require('./gen-nodejs/HBase.js'),
  HBaseTypes = require('./gen-nodejs/HBase_types.js'),
  connection = thrift.createConnection('192.168.10.210', 7788, {
    transport: thrift.TBufferedTransport,
    protocol: thrift.TBinaryProtocol
  });

  connection.on('connect', function() {
    var client = thrift.createClient(HBase,connection);


     client.scannerOpen('Kafka_message','0',['Kafka_data:정보통신_9'],null,function (err, scannerId) {

      if (err) {
        console.log(err);
        return;
      }
      console.log('scanner id : ' + scannerId + 'start!!');

      client.scannerGetList(scannerId, 100, function (serr, data) {
            if (serr) {
              console.log(serr);
              return;
              }
            for (var i=0;i<data.length;i++){
              //if (data[i].columns['Kafka_data:강남_3'].value.match('강남')=='강남'){
                result += '==============='+data[i].row+'=================\r\n';
                result += data[i].columns['Kafka_data:정보통신_9'].value + '\r\n';
                result += '==================================================\r\n';
              //}
            }

      });

      client.scannerClose(scannerId, function (err) {
        if (err) {
          console.log(err);
        }
      });
      connection.end();
    });

  });

  var http = require('http');

  var server = http.createServer(function (req, res) {
    console.log('Server start!!');
    res.writeHead(200, { 'Content-Type' : 'text/plain; charset=utf-8'});
    res.charset = 'utf-8';

    res.end(result);
  });

  server.listen(9000);

  connection.on('error', function(err){
    console.log('on error:', err);
  });

import { Component, DebugElement, SystemJsNgModuleLoader } from '@angular/core';
import { DeviceMotion, DeviceMotionAccelerationData, DeviceMotionAccelerometerOptions } from '@ionic-native/device-motion/ngx';
import { IonTextarea } from '@ionic/angular';
import { Time } from '@angular/common';
// import { File } from '@ionic-native/file/ngx';  // No need if we don't write data to the file system.
import { HTTP } from '@ionic-native/http/ngx';
import CBuffer from 'cbuffer' // A package for circular buffer. To install it, simply use 'npm install CBuffer --save'

// To send data to influxDB cloud, we need to know the token (for authorization), url of the server (depends on the location of the server and if
// belongs to AWS of Google Cloud Platform), org and bucket ID. Token is sent in the header while others are sent with the requested URL. Their values
// are as follow in this case :
// token_js = 'AML0PF2bP6vI49uSsEPA01cj7QEsA5D2M2WHB_sW9iRyVENNqwjquofPeqHcjLJLHusYABT43TldbTW1ecc68g=='
// url of the serer: 'https://eu-central-1-1.aws.cloud2.influxdata.com'
// bucketID = 'Rocla'
// const org= '1d952de0da8a8fe4'
const headers = {'Authorization':'Token AML0PF2bP6vI49uSsEPA01cj7QEsA5D2M2WHB_sW9iRyVENNqwjquofPeqHcjLJLHusYABT43TldbTW1ecc68g=='};
const url ='https://eu-central-1-1.aws.cloud2.influxdata.com/api/v2/write?org=1d952de0da8a8fe4&bucket=Rocla&precision=ms';


@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage {

  x: string;
  y: string;
  z: string;
  id: any;
  timestamp: number;
  outputMeasurement: string;
  flag: boolean;
  measurement: string;
  log_to_write: string;
  outputData: string;
  gra_x: number;
  gra_y: number;
  gra_z: number;
  alpha: number;
  startingIndex: number;
  issaveData: boolean;
  listeningFlag: boolean;
  selfDefinedThreshold: number; 
  startingTime: number;
  selfDefinedInterval: number;

  constructor(public deviceMotion: DeviceMotion, private http: HTTP) {
    this.x = "0";
    this.y = "0";
    this.z = "0";
    this.flag = false;
    this.outputData = '';
    this.alpha = 0.8;
    this.gra_x = 0;
    this.gra_y = 0;
    this.gra_z = 0;
    this.issaveData = false;
    this.listeningFlag = false;
  }

  async startListening() {
    // There is a bug when pressing the startListening button twice.
    // So we use variable listeningFlag to know if startListening is pressed before.
    // If so, we exit the function otherwise we proceed.
    if(this.listeningFlag == true)
    {
      return;
    }
    this.listeningFlag = true;
    console.log("-----------BEGIN LISTENING-----------");
    var option: DeviceMotionAccelerometerOptions =
    {
      //This is the polling frequency. It is measured in ms.
      //However, the data is not polling exactly in the defined frequency.
      //The actual sampling frequency will be lower than the defined frequency due to the delay.
      frequency: 50
    };

    // Use user-defined name of the measurement if it is provided otherwise name the file by "acceleration"
    // Measurement is an important concept in InfluxDB. It can be considered as the table name.
    // this.flag == false means the measurement name is not set.
    if(this.flag==false && this.issaveData == true)
    {
      if(this.outputMeasurement){
          this.measurement = this.outputMeasurement;
      }
      else{
        this.measurement = 'acceleration';
      }
      // Measurement name is set.
      this.flag=true;
      console.log('Measurement: ' + this.measurement)
    }

    this.startingIndex = 0;
    this.startingTime = Date.now(); // Record the starting time here because we will discard the samples collected in the first 3 seconds.
    // console.log('Starting index: '+this.startingIndex)
    // console.log('StartingTime: '+this.startingTime);

    // Interval is an important metrics for detecting the collision. If the accleration goes beyond the threshold for a while, namely for this interval,
    // we suspect it is a collision. Since we are sampling the data in a period of 50 ms. Interval = window * 0.05, unit is second. 
    if(this.selfDefinedInterval){
      var window = Math.floor(this.selfDefinedInterval / 0.05);
    }
    else{
      var window = 6;
    }
    var x_Buffer = new CBuffer(window);
    var y_Buffer = new CBuffer(window);
    var z_Buffer = new CBuffer(window);
    if(this.selfDefinedThreshold){
      var threshold = this.selfDefinedThreshold;
    }
    else{
      var threshold = 10.0;
    }

    this.id = this.deviceMotion.watchAcceleration(option).subscribe((acceleration: DeviceMotionAccelerationData) => {

      // Use low pass filter to get the value of gravity in 3 axises and remove them from the value.
      // This method is recommended of Google Official Document: https://developer.android.com/reference/android/hardware/SensorEvent.html
      this.gra_x = this.alpha * this.gra_x + (1-this.alpha) * acceleration.x;
      this.gra_y = this.alpha * this.gra_y + (1-this.alpha) * acceleration.y;
      this.gra_z = this.alpha * this.gra_z + (1-this.alpha) * acceleration.z;
      // console.log('gravity: '+this.gra_x +' '+this.gra_y+' '+this.gra_z );

      this.x = "" + (acceleration.x - this.gra_x).toFixed(4);
      this.y = "" + (acceleration.y - this.gra_y).toFixed(4);
      this.z = "" + (acceleration.z - this.gra_z).toFixed(4);
      this.timestamp = acceleration.timestamp.toFixed(0);

      // Filling the circular buffer (first-in-first-out)
      x_Buffer.push(Math.abs(parseFloat(this.x)));
      y_Buffer.push(Math.abs(parseFloat(this.y)));
      z_Buffer.push(Math.abs(parseFloat(this.z)));
      
      if(Math.min.apply(Math, x_Buffer.toArray())>threshold || Math.min.apply(Math, y_Buffer.toArray())>threshold || Math.min.apply(Math, z_Buffer.toArray())>threshold){
        console.log('Collision detected! Threshold: '+threshold+' Acceleration: '+'x='+this.x+',y='+this.y+',z='+this.z+' '+this.timestamp+'\n');      
      }
      // console.log('Min: '+x_Buffer.toArray());
      // console.log('Threshold: '+threshold+ ' Interval: '+window);
      


      // One sample of the acceleration data to be sent to the influxdb. It follows the InfluxDB line protocol syntax:
      // https://docs.influxdata.com/influxdb/v1.7/write_protocols/line_protocol_tutorial/
      this.log_to_write = String(this.measurement+',device=Android '+'x='+this.x+',y='+this.y+',z='+this.z+' '+this.timestamp+'\n'); // Line protocol string
      // Here we use variable outputData as a buffer to store the samples which will be sent to influxdb in the future.
      // In this way, we can achieve batch update and it can reduce the pressure brought by frequent http requests

      // We discard the data collected in the first 3 seconds because the low pass filter has not converged before that.
      if((this.timestamp - this.startingTime)> 3000){
      this.outputData += this.log_to_write;

      // We are counting the index of the samples, when it reachs a limit, the samples will be sent to the influxdb cloud in a batch.
      this.startingIndex += 1;
      }

      // Write the data to the influxDB in a batch style with 100 records. We can also set the limit higher such as 200 or more.
      // If the sampling period is 50ms, we send the data to influxdb every 5 second.
      // issaveData is a flag to indicate if we want to send the data to influxDB or now.
      if(this.startingIndex >= 100 && this.issaveData == true)
      {
            // We need send the data in plain text .
            this.http.setHeader('*','Content-Type','plain/text');
            this.http.setDataSerializer('utf8');

            console.log('Sending data: '+Date.now());
            // console.log('test');
            this.http.post(url, this.outputData, headers )
            .then(() => {
              console.log('Finish sending data: '+Date.now())
            })
            .catch(error => {
              console.log(error)
            })
            // Reset the index and buffer.
            this.startingIndex = 0
            this.outputData="";
      }

    }
    );
  }

  // To retrive the value of button "Send data" in the html page
  saveData(){
    this.issaveData = true;
  }

  // To decide if the "Send data" button will be disabled or not.
  // We disable the button if user presses the "Send data" buttion.
  checkIsEnabled() {
         return this.issaveData;
     }

  stopListening() {
    this.id.unsubscribe();
    this.listeningFlag = false; // We can now release the button "Start Listening" to be pressed again.
    console.log("-----------STOP LISTENING-----------");
    // If users presses the 'Stop Listening' button, we stop listening and flush the data from the buffer to influxdb.
    if( this.issaveData == true && this.outputData)
    {
      this.http.setHeader('*','Content-Type','plain/text');
      this.http.setDataSerializer('utf8');
      console.log('Sending data: '+Date.now());
      this.http.post(url, this.outputData, headers )
      .then(() => {
        console.log('Finish sending data: '+Date.now())
        this.startingIndex = 0;
        this.outputData ='';
      })
      .catch(error => {
        console.log(error)
      })
    }
  }

  resetCurrentData() {
    this.id.unsubscribe();
    this.listeningFlag = false; // We can now release the button "Start Listening" to be pressed again.
    console.log("-----------Reset Data-----------");
    // If users presses the 'Reset Current Data' button, we reset everything and flush the data from the buffer to influxdb.
    if( this.issaveData == true && this.outputData)
    {
      this.http.setHeader('*','Content-Type','plain/text');
      this.http.setDataSerializer('utf8');
      console.log('Sending data: '+Date.now());
      this.http.post(url, this.outputData, headers )
      .then(() => {
        console.log('Finish sending data: '+Date.now())
      })
      .catch(error => {
        console.log(error)
      })
    }
    this.startingIndex = 0;
    this.outputData ='';
    this.x = "0";
    this.y = "0";
    this.z = "0";
    this.outputMeasurement = "";
    this.flag = false;
    this.issaveData = false;
    this.selfDefinedThreshold = 10.0; // Reset the values to default values.
    this.selfDefinedInterval = 0.3; // // Reset the values to default values.
}
}

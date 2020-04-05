import { Component, DebugElement, SystemJsNgModuleLoader } from '@angular/core';
import { DeviceMotion, DeviceMotionAccelerationData, DeviceMotionAccelerometerOptions } from '@ionic-native/device-motion/ngx';
import { IonTextarea } from '@ionic/angular';
import { Time } from '@angular/common';
import { File } from '@ionic-native/file/ngx';
import { HTTP } from '@ionic-native/http/ngx';
import {InfluxDB, Point, WriteApi} from '@influxdata/influxdb-client';
// const enum WritePrecision {
//   /** nanosecond */
//   ns = 'ns',
//   /* microsecond */
//   us = 'us',
//   /** millisecond */
//   ms = 'ms',
//   /* second */
//   s = 's',
// }
// You can generate a Token from the "Tokens Tab" in the UI
// const token_js = 'AML0PF2bP6vI49uSsEPA01cj7QEsA5D2M2WHB_sW9iRyVENNqwjquofPeqHcjLJLHusYABT43TldbTW1ecc68g=='
// const client = new InfluxDB({url: 'https://eu-central-1-1.aws.cloud2.influxdata.com', token: token_js})
// const bucketID = 'Rocla'
// const writeApi = client.getWriteApi('1d952de0da8a8fe4', bucketID)
// const url= 'https://eu-central-1-1.aws.cloud2.influxdata.com'
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
  // textbox: IonTextarea;
  timestamp: number;
  outputPath: string;
  flag: boolean;
  filename: string;
  log_to_write: string;
  // file_path: string;
  outputData: string;
  gra_x: number;
  gra_y: number;
  gra_z: number;
  alpha: number;
  startingTime: number;
  issaveData: boolean;
  client:WriteApi;

  constructor(public deviceMotion: DeviceMotion, public file: File, private http: HTTP) {
    this.x = "-";
    this.y = "-";
    this.z = "-";
    this.flag = false;
    this.outputData = '';
    this.alpha = 0.8;
    this.gra_x = 0;
    this.gra_y = 0;
    this.gra_z = 0;
    this.issaveData = false;
    // this.buttonDisabled = false;
    // this.client = new InfluxDB({url: 'https://eu-central-1-1.aws.cloud2.influxdata.com', token: token_js}).getWriteApi('1d952de0da8a8fe4', bucketID);
  }

  async startListening() {
    console.log("-----------BEGIN LISTENING-----------");
    // this.file_path = this.file.externalRootDirectory;
    var option: DeviceMotionAccelerometerOptions =
    {
      //This is the polling frequency. It is measured in ms.
      //However, the data is not polling exactly in the defined frequency.
      //The actual sampling frequency will be lower than the defined frequency due to the delay.
      frequency: 50
    };

    // Use user-defined filename if it is provided otherwise name the file by timestam+_Acceleration.csv
    if(this.flag==false && this.issaveData == true)
    {
      if(this.outputPath){
          this.filename = this.outputPath;
      }
      else{
        this.filename = 'acceleration';
      }
    //   await this.file.createFile(this.file.externalRootDirectory, this.filename, true);
      this.flag=true;
      console.log('Measurement: ' + this.filename)
    //   // The directory is actually the root path of Android's internal storage
    //   console.log('Path: '+this.file.externalRootDirectory)
    //   await this.file.writeFile(this.file.externalRootDirectory, this.filename, 'Timestamp,X,Y,Z \n', {replace: false, append: true})
    //   .then(() => {
    //       // console.log('Write successfully');
    //   })
    //   .catch((err) => {
    //       console.log('Write failed! Err: ');
    //       console.log(err)
    //   });
    }

    this.startingTime = 0;
    console.log('Starting time: '+this.startingTime)
    this.id = this.deviceMotion.watchAcceleration(option).subscribe((acceleration: DeviceMotionAccelerationData) => {

      this.gra_x = this.alpha * this.gra_x + (1-this.alpha) * acceleration.x;
      this.gra_y = this.alpha * this.gra_y + (1-this.alpha) * acceleration.y;
      this.gra_z = this.alpha * this.gra_z + (1-this.alpha) * acceleration.z;
      // console.log('gravity: '+this.gra_x +' '+this.gra_y+' '+this.gra_z );

      this.x = "" + (acceleration.x - this.gra_x).toFixed(4);
      this.y = "" + (acceleration.y - this.gra_y).toFixed(4);
      this.z = "" + (acceleration.z - this.gra_z).toFixed(4);
      this.timestamp = acceleration.timestamp;
      // this.log_to_write = this.timestamp + ',' +this.x+','+this.y+','+this.z+'\n'

      this.log_to_write = String(this.filename+',device=Android '+'x='+this.x+',y='+this.y+',z='+this.z+' '+this.timestamp+'\n'); // Line protocol string
      this.outputData += this.log_to_write;
      this.startingTime += 1;
      // const params = {"data":String('acceleration,device=Android '+'x='+this.x+',y='+this.y+',z='+this.z+' '+this.timestamp)};
      //
      // console.log(params);
      // console.log(JSON.stringify(params));

      // this.client.writeRecord(data);
      // writeApi.writeRecord(data)
      // Write the data to the influxDB in a batch style with 100 records.
      if(this.startingTime >= 100 && this.issaveData == true)
      {
      //   console.log('Start Writing. Time: '+Date.now());
      //   // this.client.flush()
      //   writeApi.flush()
      //   .catch(e => {
      //       console.error(e)
      //       console.log('\nFlush ERROR')
      //   });
      // //   this.writeToFile();
      //   console.log('Clear FIFO. Time: '+Date.now());
      // //
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
            this.startingTime = 0
            this.outputData="";
      }

    }
    );
  }

  // //Functions for writing to file
  // writeToFile() {
  //   return new Promise((resolve, reject) => {
  //     this.file.writeFile(this.file_path, this.filename, this.outputData, {replace: false, append: true})
  //     .then(() => {
  //         // console.log('Writing done! Time: '+ Date.now());
  //         resolve('Write successfully!')
  //     })
  //     .catch((err) => {
  //       reject(err);
  //       // console.log(err)
  //     });
  //   });
  // }

  saveData(){
    this.issaveData = true;
    // this.buttonDisabled = true;
  }

  checkIsEnabled() {
         return this.issaveData;
     }

  stopListening() {
    //window.alert("Stopped Listening");
    this.id.unsubscribe();
    console.log("-----------STOP LISTENING-----------");
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
    this.issaveData = false;
    this.startingTime = 0;
    this.outputData ='';


  }

  resetCurrentData() {
    this.id.unsubscribe();
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
    // if(this.issaveData == true){
    // // this.client.flush()
    // writeApi.flush()
    //     .then(() => {
    //         console.log('FINISHED')
    //     })
    //     .catch(e => {
    //         console.error(e)
    //         console.log('\nFinished ERROR')
    //     })
    //   }
    this.startingTime = 0;
    this.x = "0";
    this.y = "0";
    this.z = "0";
    this.outputPath = "";
    this.flag = false;
    this.outputData ='';
    this.issaveData = false;
    // this.buttonDisabled = false;
}
}

import { Component, DebugElement, SystemJsNgModuleLoader } from '@angular/core';
import { DeviceMotion, DeviceMotionAccelerationData, DeviceMotionAccelerometerOptions } from '@ionic-native/device-motion/ngx';
import { IonTextarea } from '@ionic/angular';
import { Time } from '@angular/common';
import { File } from '@ionic-native/file/ngx';

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
  file_path: string;
  outputData: string;
  gra_x: number;
  gra_y: number;
  gra_z: number;
  alpha: number;
  startingTime: number;

  constructor(public deviceMotion: DeviceMotion, public file: File) {
    this.x = "-";
    this.y = "-";
    this.z = "-";
    this.flag = false;
    this.outputData = '';
    this.alpha = 0.8;
    this.gra_x = 0;
    this.gra_y = 0;
    this.gra_z = 0;
  }

  async startListening() {
    console.log("-----------BEGIN LISTENING-----------");
    this.file_path = this.file.externalRootDirectory;
    var option: DeviceMotionAccelerometerOptions =
    {
      //This is the polling frequency. It is measured in ms.
      //However, the data is not polling exactly in the defined frequency.
      //The actual sampling frequency will be lower than the defined frequency due to the delay.
      frequency: 50
    };

    // Use user-defined filename if it is provided otherwise name the file by timestam+_Acceleration.csv
    if(this.flag==false)
    {
      if(this.outputPath){
          this.filename = this.outputPath;
      }
      else{
        this.filename = Date.now()+ '_Acceleration.csv';
      }
      await this.file.createFile(this.file.externalRootDirectory, this.filename, true);
      this.flag=true;
      console.log('Creating file: ' + this.filename)
      // The directory is actually the root path of Android's internal storage
      console.log('Path: '+this.file.externalRootDirectory)
      await this.file.writeFile(this.file.externalRootDirectory, this.filename, 'Timestamp,X,Y,Z \n', {replace: false, append: true})
      .then(() => {
          // console.log('Write successfully');
      })
      .catch((err) => {
          console.log('Write failed! Err: ');
          console.log(err)
      });
    }
    this.startingTime = Date.now();
    console.log('Starting time: '+this.startingTime)
    this.id = this.deviceMotion.watchAcceleration(option).subscribe((acceleration: DeviceMotionAccelerationData) => {

      // console.log('Getting Acceleration. ACC Time: '+acceleration.timestamp);
      // console.log(acceleration)
      // console.log('Getting Acceleration. Time: '+Date.now());
      // console.log('Timestamp 1: '+acceleration.timestamp)
      this.gra_x = this.alpha * this.gra_x + (1-this.alpha) * acceleration.x;
      this.gra_y = this.alpha * this.gra_y + (1-this.alpha) * acceleration.y;
      this.gra_z = this.alpha * this.gra_z + (1-this.alpha) * acceleration.z;
      // console.log('gravity: '+this.gra_x +' '+this.gra_y+' '+this.gra_z );

      this.x = "" + (acceleration.x - this.gra_x).toFixed(4);
      this.y = "" + (acceleration.y - this.gra_y).toFixed(4);
      this.z = "" + (acceleration.z - this.gra_z).toFixed(4);
      this.timestamp = acceleration.timestamp;
      this.log_to_write = this.timestamp + ',' +this.x+','+this.y+','+this.z+'\n'
      this.outputData += this.log_to_write
      // Write the data to the file every 5 seconds
      if((this.timestamp - this.startingTime) >= 5000)
      {
        // console.log('Start Writing. Time: '+Date.now());
        this.outputData="";
        this.writeToFile();
        // console.log('Clear FIFO. Time: '+Date.now());

        this.startingTime = Date.now();
      }
    }
    );
  }


  writeToFile() {
    return new Promise((resolve, reject) => {
      this.file.writeFile(this.file_path, this.filename, this.outputData, {replace: false, append: true})
      .then(() => {
          // console.log('Writing done! Time: '+ Date.now());
          resolve('Write successfully!')
      })
      .catch((err) => {
        reject(err);
        // console.log(err)
      });
    });
  }




  stopListening() {
    //window.alert("Stopped Listening");
    this.id.unsubscribe();
    console.log("-----------STOP LISTENING-----------");
  }

  resetCurrentData() {
    this.id.unsubscribe();
    this.writeToFile();
    this.outputData=""
    this.startingTime = Date.now();
    this.x = "0";
    this.y = "0";
    this.z = "0";
    this.outputPath = "";
    this.flag = false;
    this.outputData ='';

}
}

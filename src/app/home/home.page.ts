import { Component, DebugElement, SystemJsNgModuleLoader } from '@angular/core';
import { DeviceMotion, DeviceMotionAccelerationData, DeviceMotionAccelerometerOptions } from '@ionic-native/device-motion/ngx';
import { IonTextarea } from '@ionic/angular';
import { Time } from '@angular/common';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage {

  x: string;
  y: string;
  z: string;
  output: string;
  id: any;
  textbox: IonTextarea;

  constructor(public deviceMotion: DeviceMotion) {
    this.x = "-";
    this.y = "-";
    this.z = "-";
    this.output = "-";
  }

  startListening() {
    //window.alert("Started Listening");
    console.log("-----------BEGIN LISTENING-----------");

    var option: DeviceMotionAccelerometerOptions =
    {
      //This is the polling frequency. It is measured in ms.
      frequency: 50
    };



    this.id = this.deviceMotion.watchAcceleration(option).subscribe((acceleration: DeviceMotionAccelerationData) => {
      this.x = "" + acceleration.x.toFixed(4);
      this.y = "" + acceleration.y.toFixed(4);
      this.z = "" + acceleration.z.toFixed(4);
      this.output = " X: " + acceleration.x.toFixed(4) + " Y: " + acceleration.y.toFixed(4) + " Z: " + acceleration.z.toFixed(4);
      console.log("Time Stamp: " + acceleration.timestamp + "" + this.output);
    }
    );
  }

  stopListening() {
    //window.alert("Stopped Listening");
    this.id.unsubscribe();
    console.log("-----------STOP LISTENING-----------");

  }

  resetCurrentData() {
    //window.alert("Data Reset");
    this.id.unsubscribe();
    this.x = "0";
    this.y = "0";
    this.z = "0";
    this.output = "-";
  }

}
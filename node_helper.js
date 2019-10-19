"use strict";

/*
* Yggdrasil
* Module: MMM-PIR-Sensor
*
* By Kyle Denton
* MIT Licensed.
*/

const NodeHelper = require("node_helper");
const five = require("johnny-five");
const exec = require("child_process").exec;
const Timer = require("tiny-timer");
const moment = require("moment");

module.exports = NodeHelper.create({
  start: function() {
    this.boardInit();
  },

  // Set up the board
  boardInit: function() {
    const board = new five.Board();
    let self = this;

    board.on("ready", function() {
      self.motionInit();
    });
  },

  // Set the pins and handle events
  motionInit: function() {
    const motion = new five.Motion(this.config.pirPin);
    const led = new five.Led(this.config.ledPin);
    const timer = this.createTimer();
    const ledEnable = this.config.ledEnable;

    let self = this;

    // Calibrated
    // "calibrated" occurs once, at the beginning of a session
    motion.on("calibrated", function() {
      let calibrated = self.config.calibrated;

  	  // console.log("Motion Calibrated");
      if(ledEnable) { self.blinkLED(led); }
      self.initTimer(timer);
      self.sendNotification(calibrated.enabled, calibrated.type, calibrated.title, calibrated.message, calibrated.duration);
  	});

    // Motion Start
    // "motionstart" events are fired when the "calibrated"
    // proximal area is disrupted, generally by some form of movement
    motion.on("motionstart", function() {
      let motionStart = self.config.motionStart;

      // console.log("Motion Start");
      if(ledEnable) { self.stopLED(led); self.onLED(led); }
      self.stopTimer(timer);
      self.sendNotification(motionStart.enabled, motionStart.type, motionStart.title, motionStart.message, motionStart.duration);
    });

    // Motion End
    // "motionend" events are fired following a "motionstart" event
    // when no movement has occurred in X ms
    motion.on("motionend", function() {
      let motionEnd = self.config.motionEnd;

      // console.log("Motion End");
      if(ledEnable) { self.stopLED(led); self.offLED(led); }
      self.startTimer(timer);
      self.sendNotification(motionEnd.enabled, motionEnd.type, motionEnd.title, motionEnd.message, motionEnd.duration);
    });
  },

  // Turns on LED
  onLED: function(led) {
    led.on();
  },

  // Turns off LED
  offLED: function(led) {
    led.off();
  },

  // Blink LED
  blinkLED: function(led) {
    led.blink();
  },

  // Stop Blinking LED
  stopLED: function(led) {
    led.stop();
  },

  // Turn on Monitor
  onMonitor: function() {
    exec(this.config.onCommand);
  },

  // Turn off Monitor
  offMonitor: function() {
    exec(this.config.offCommand);
  },

  initTimer: function(timer, duration = this.config.timerDuration) {
    this.startTimer(timer, duration);

    // Status Change
    timer.on("statusChanged", (status) => {
      let time = timer.time;
      let activeTime = this.checkTime();

      // Turn on Monitor and Restart Timer
      if(time === 0 && status === "stopped" && activeTime) {
        this.onMonitor();
        timer.start(duration);
      }

      // Turn off monitor if not active time
      if(!activeTime) {
        this.offMonitor();
      }
    });

    // Timer Done
    timer.on('done', () => {
      this.offMonitor();
    });
  },

  // Create Timer
  createTimer: function() {
    return new Timer();
  },

  // Start Timer
  startTimer: function(timer, duration = this.config.timerDuration) {
    timer.start(duration);
  },

  // Stop Timer
  stopTimer: function(timer) {
    timer.stop();
  },

  // Check time to enable
  checkTime: function() {
    let activeTime = false;

    let currentTime = moment()  // .format("MM-DD-YYYY hh:mm a");

    let startTime = moment(this.config.enabledStartTime, "hh:mm");
    let startTimeHour = startTime.hours();
    let startTimeMinute = startTime.minutes();
    let newStartTime = moment().hours(startTimeHour).minutes(startTimeMinute) // .format("MM-DD-YYYY HH:mm a");

    let endTime = moment(this.config.enabledEndTime, "hh:mm a");
    let endTimeHour = endTime.hours();
    let endTimeMinute = endTime.minutes();
    let newEndTime = moment().hours(endTimeHour).minutes(endTimeMinute) // .format("MM-DD-YYYY HH:mm a");

    if(moment().isBetween(newStartTime , newEndTime, "minutes")) {
      activeTime = true;
    }
    return activeTime;
  },

  // Send Notification
  sendNotification: function(enabled = true, type, title, message, timer = 3000) {
    let self = this;

    if(enabled) {
      self.sendSocketNotification("SHOW_ALERT", {
        type: type,
        title: title,
        message: message,
        timer: timer
      });
    }
  },

  // Socket Notification Received
  socketNotificationReceived: function (notification, payload) {
    if(notification === 'CONFIG') {
      const self = this;
      self.config = payload;
    }
  }
});

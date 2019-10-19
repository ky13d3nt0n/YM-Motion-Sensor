/* global Module */

/* Magic Mirror
* Module: MMM-Motion-Sensor
*
* By Kyle Denton
* MIT Licensed.
*/

Module.register('MMM-Motion-Sensor', {
	requiresVersion: '2.1.0',
	defaults: {
		pirPin: 4,
		ledPin: 13,
		ledEnable: true,
		offCommand: "xset -display :0.0 dpms force off",
		onCommand: "xset -display :0.0 dpms force on",
		timerDuration: 300000,
		enabledStartTime: "9:30",
		enabledEndTime: "23:59",
		calibrated: {
			enabled: true,
			type: "alert",								// "alert", "notification"
			title: "Motion Calibrated",
			message: "Timer Set to 5 minutes",
			duration: 3000
		},
		motionStart: {
			enabled: true,
			type: "notification",				// "alert", "notification"
			title: "Motion",
			message: "Start",
			duration: 1000
		},
		motionEnd: {
			enabled: true,
			type: "notification",				// "alert", "notification"
			title: "Motion",
			message: "End",
			duration: 1000
		}
	},

	start: function () {
		this.sendSocketNotification('CONFIG', this.config);
		Log.info('Starting module: ' + this.name);
	},

	// Send an alert anytime there's a motion event.
	socketNotificationReceived: function(notification, payload) {
		this.sendNotification("SHOW_ALERT", payload);
	}
});

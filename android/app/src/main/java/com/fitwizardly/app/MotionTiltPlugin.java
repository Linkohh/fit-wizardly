package com.fitwizardly.app;

import android.content.Context;
import android.hardware.Sensor;
import android.hardware.SensorEvent;
import android.hardware.SensorEventListener;
import android.hardware.SensorManager;

import androidx.annotation.NonNull;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "MotionTilt")
public class MotionTiltPlugin extends Plugin implements SensorEventListener {

    private static final int SENSOR_INTERVAL_MICROS = 16_000;
    private static final float RAD_TO_DEG = (float) (180d / Math.PI);

    private SensorManager sensorManager;
    private Sensor rotationSensor;
    private final float[] rotationMatrix = new float[9];
    private final float[] orientationAngles = new float[3];
    private boolean isListening = false;

    @Override
    public void load() {
        sensorManager = (SensorManager) getContext().getSystemService(Context.SENSOR_SERVICE);

        if (sensorManager == null) {
            rotationSensor = null;
            return;
        }

        rotationSensor = sensorManager.getDefaultSensor(Sensor.TYPE_GAME_ROTATION_VECTOR);
        if (rotationSensor == null) {
            rotationSensor = sensorManager.getDefaultSensor(Sensor.TYPE_ROTATION_VECTOR);
        }
    }

    @PluginMethod
    public void getStatus(PluginCall call) {
        call.resolve(makeStatusPayload());
    }

    @PluginMethod
    public void requestPermission(PluginCall call) {
        JSObject payload = new JSObject();
        payload.put("permission", rotationSensor != null ? "granted" : "denied");
        call.resolve(payload);
    }

    @PluginMethod
    public void start(PluginCall call) {
        if (sensorManager == null || rotationSensor == null) {
            call.reject("Device motion is unavailable on this device.");
            return;
        }

        if (!isListening) {
            sensorManager.registerListener(this, rotationSensor, SENSOR_INTERVAL_MICROS);
            isListening = true;
        }

        call.resolve();
    }

    @PluginMethod
    public void stop(PluginCall call) {
        stopListening();
        call.resolve();
    }

    @Override
    protected void handleOnPause() {
        super.handleOnPause();
        stopListening();
    }

    @Override
    protected void handleOnDestroy() {
        super.handleOnDestroy();
        stopListening();
    }

    @Override
    public void onSensorChanged(SensorEvent event) {
        if (event.sensor == null || event.sensor.getType() != rotationSensor.getType()) {
            return;
        }

        SensorManager.getRotationMatrixFromVector(rotationMatrix, event.values);
        SensorManager.getOrientation(rotationMatrix, orientationAngles);

        float pitch = orientationAngles[1] * RAD_TO_DEG;
        float roll = orientationAngles[2] * RAD_TO_DEG * -1f;

        JSObject payload = new JSObject();
        payload.put("pitch", pitch);
        payload.put("roll", roll);
        payload.put("timestamp", System.currentTimeMillis());

        notifyListeners("tilt", payload);
    }

    @Override
    public void onAccuracyChanged(Sensor sensor, int accuracy) {
        // No-op.
    }

    private void stopListening() {
        if (!isListening || sensorManager == null) {
            return;
        }

        sensorManager.unregisterListener(this);
        isListening = false;
    }

    @NonNull
    private JSObject makeStatusPayload() {
        JSObject payload = new JSObject();
        payload.put("available", rotationSensor != null);
        payload.put("permission", rotationSensor != null ? "granted" : "denied");
        payload.put("source", "native");
        return payload;
    }
}

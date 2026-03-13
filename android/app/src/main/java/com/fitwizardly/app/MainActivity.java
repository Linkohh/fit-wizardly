package com.fitwizardly.app;

import android.view.View;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    protected void onCreate(android.os.Bundle savedInstanceState) {
        registerPlugin(MotionTiltPlugin.class);
        super.onCreate(savedInstanceState);
    }

    @Override
    protected void onStart() {
        super.onStart();
        hideWebViewScrollIndicators();
    }

    @Override
    protected void onResume() {
        super.onResume();
        hideWebViewScrollIndicators();
    }

    private void hideWebViewScrollIndicators() {
        if (bridge == null || bridge.getWebView() == null) {
            return;
        }

        bridge.getWebView().setVerticalScrollBarEnabled(false);
        bridge.getWebView().setHorizontalScrollBarEnabled(false);
        bridge.getWebView().setOverScrollMode(View.OVER_SCROLL_NEVER);
    }
}

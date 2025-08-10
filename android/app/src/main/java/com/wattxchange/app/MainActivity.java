package com.wattxchange.app;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onStart() {
        super.onStart();
        
        // Configure the bridge
        this.init(savedInstanceState, new ArrayList<Class<? extends Plugin>>() {{
            // Additional plugins can be added here
        }});
    }
}
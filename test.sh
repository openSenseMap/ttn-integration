#!/bin/bash

# Your OpenSenseMap device ID (from the integration)
DEVICE_ID="d8weunzjmmviley2inrwi4zi"

TEMP_SENSOR_ID="57c16e754bc67bfff71a55af"
HUM_SENSOR_ID="553ed435f3b5c47b6d46a5d1"

# Now simulate a TTN webhook
curl -X POST "http://localhost:3002/webhook/ttn/${DEVICE_ID}" \
  -H "Content-Type: application/json" \
  -d '{
    "end_device_ids": {
      "device_id": "test-device-001",
      "application_ids": {
        "application_id": "beta-osem-test-ttn"
      }
    },
    "uplink_message": {
      "f_port": 1,
      "frm_payload": "AQEBAg==",
      "decoded_payload": {
        "57c16e754bc67bfff71a55af": 22.5,
        "553ed435f3b5c47b6d46a5d1": 65.3
      },
      "rx_metadata": [],
      "settings": {},
      "received_at": "'$(date -u +%Y-%m-%dT%H:%M:%SZ)'"
    }
  }'
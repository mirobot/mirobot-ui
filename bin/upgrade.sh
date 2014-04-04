#!/bin/bash
curl --request POST http://admin:admin@192.168.0.202/data_success.html -F "CMD=WEB_UPLOAD" -F "files=@out/lpb_web.bin"
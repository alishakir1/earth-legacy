import {defineConfig} from '@playwright/test';
export default defineConfig({
  testDir:'./tests', testMatch:'**/*.spec.ts', timeout:30000, workers:2,
  reporter:[['list'],['json',{outputFile:'artifacts/native-bridge-tests.json'}]],
  use:{headless:true,viewport:{width:390,height:844},hasTouch:true},
  projects:[
    {name:'chromium',use:{browserName:'chromium',launchOptions:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE?{executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE}:{}}},
    {name:'webkit',use:{browserName:'webkit'}}
  ]
});

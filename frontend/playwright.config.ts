import { defineConfig } from '@playwright/test';
export default defineConfig({testDir:'tests',workers:1,timeout:30000,use:{baseURL:'http://127.0.0.1:8000',viewport:{width:1440,height:1100},launchOptions:{args:['--autoplay-policy=no-user-gesture-required']}},reporter:[['list'],['html',{outputFolder:'../reports/playwright',open:'never'}]]});

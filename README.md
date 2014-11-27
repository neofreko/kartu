Kartu
====
Inspired by GMail inbox's action shortcut. I wrote this so I can receive a Google Now-like actionable card for my e-commerce transaction, eg: payment instruction and package tracking.

Then came along Google Inbox.

This app will access your whatever email inbox, and then scan it (via ContextIO) using the engines (Amazon, Kuroneko, Asmart). You can add more engines to make it aware of other actionable email.

The frontend is built on Angular, and there's still undecided experience on how to best present the actionable information.

How to run
===
You'll need ContextIO and Parse API. Adjust the keys in common.js and webapp/app.js
```
node webapp/app.js
```

Open localhost:3000
Go to Inbox menu, and connect your email account

Screenshot
===
![utrak 2014-11-28 07-57-00](https://cloud.githubusercontent.com/assets/8678/5222276/2270954c-76d4-11e4-8dd7-c89efd2940dd.png)

![utrak 2014-11-28 07-55-38](https://cloud.githubusercontent.com/assets/8678/5222272/f1247c6a-76d3-11e4-952c-cbdbfb017fa6.png)


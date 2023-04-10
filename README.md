callcenter-simulator
======

A sample callcenter simulator using OpenAI technologies such as ChatGPT, Whisper and other APIs to automate and improve callcenter operation. This project is intended to be a sandbox application to test feasibility and other ideas.

---

OpenAIの技術、ChatGPT、WhisperなどのAPIを使用して、コールセンターのオペレーションを自動化および改善するためのサンプルコールセンターシミュレーターを作成しました。このプロジェクトは、実現可能性やその他のアイデアをテストするためのサンドボックスアプリケーションとして構想されています。

# Motivation

The goal of this project is to test the idea of using AI in callcenter operation and if current existing AI products can already replace human agents.

---

このプロジェクトの目的は、AIをコールセンターのオペレーションに使用するアイデアをテストし、既存のAI製品がすでに人間のエージェントを置き換えることができるかどうかを確認することです。


> **Disclaimer:** I have no idea how callcenter operates although I read a few articles and saw diagrams from the web. This is purely a though experiment.


# Setup


Clone the repository and install the dependencies

```sh
git clone https://github.com/supershaneski/callcenter-simulator.git myproject

cd myproject

npm install
```

Copy `.env.example` and rename it to `.env` then edit the `OPENAI_APIKEY` and use your own `OpenAI API key`.

```javascript
OPENAI_APIKEY=YOUR_OWN_API_KEY
```

Then to run the app

```sh
npm run dev
```

Open your browser to `http://localhost:3005/` to load the application page.

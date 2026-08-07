# PinePaper MCP सर्वर

> Model Context Protocol के ज़रिए AI से एनिमेटेड वेक्टर ग्राफ़िक्स बनाएँ

[English](README.md) · [简体中文](README.zh-CN.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [Español](README.es.md) · [Português (BR)](README.pt-BR.md) · [Français](README.fr.md) · [Deutsch](README.de.md) · **हिन्दी**

<p align="center">
  <img src="assets/hero.svg" alt="PinePaper MCP — टूल कॉल से बने एनिमेटेड ग्राफ़िक्स" width="840">
</p>

*ऊपर का बैनर एक एनिमेटेड SVG है — PinePaper टूल कॉल से सीधे एक्सपोर्ट किया गया, न कोई वीडियो, न GIF। GitHub पर खोलें और इसे चलते देखें।*

## परिचय

PinePaper MCP सर्वर AI असिस्टेंट्स को Model Context Protocol के ज़रिए [PinePaper Studio](https://pinepaper.studio) में ग्राफ़िक्स बनाने और एनिमेट करने देता है। MCP टूल कॉलिंग वाले किसी भी AI (Claude, GPT, Gemini, लोकल मॉडल आदि) के साथ काम करता है।

सर्वर **129 टूल** देता है — ड्रॉइंग, एनिमेशन, डायग्राम, नक्शे, टाइपोग्राफ़ी, फिज़िक्स, इमेज एडिटिंग, डेटा विज़ुअलाइज़ेशन और एक्सपोर्ट:

- टेक्स्ट, आकृतियाँ, ज्यामिति और जटिल ग्राफ़िक्स बनाना
- कीफ़्रेम की जगह व्यवहार बताने वाले **रिलेशन** से एनिमेशन
- प्रोसीजरल बैकग्राउंड और समीकरण-आधारित पथ
- डायग्राम, नक्शे, चार्ट और लेटर कोलाज
- इमेज एडिटिंग: क्रॉप, क्रोमा-की (ग्रीन स्क्रीन हटाना), GPU फ़िल्टर, लैसो कटआउट, ऑब्जेक्ट डिटेक्शन
- एनिमेटेड SVG, वीडियो फ़्रेम, एम्बेड करने लायक विजेट और LLM ट्रेनिंग डेटा एक्सपोर्ट

## जल्दी शुरू करें

```bash
npm install -g @pinepaper.studio/mcp-server
```

**Claude Desktop** (`claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "pinepaper": {
      "command": "npx",
      "args": ["-y", "@pinepaper.studio/mcp-server"]
    }
  }
}
```

अपने AI से कहकर देखें:

> "लाल रंग का धड़कता हुआ HELLO टेक्स्ट बनाओ"

> "एक सूरज और एक पृथ्वी बनाओ, और पृथ्वी को सूरज की परिक्रमा कराओ"

> "नीले-बैंगनी रंग का सनबर्स्ट बैकग्राउंड जोड़ो"

<p align="center">
  <img src="assets/poster-sunburst.svg" width="220" alt="घूमता सनबर्स्ट पोस्टर">
  <img src="assets/easing-splashes.svg" width="300" alt="क्रम से उछलती स्प्लैश आकृतियाँ">
  <img src="assets/live-badge.svg" width="180" alt="झपकता LIVE बैज">
</p>

## 1.6.0 में नया क्या है

- **इमेज एडिटिंग टूल**: `pinepaper_crop_image` (एक चरण में क्रॉप, id और रिलेशन बरकरार) और `pinepaper_chroma_key` (स्वतः अनुमानित थ्रेशोल्ड वाला क्रोमा-की)
- **`pinepaper_media` में `set_clip`** — पहले से अपलोड क्लिप की ट्रिम फिर से सेट करें
- **शेडर ऑरा**: `pinepaper_apply_effect` में `heatmap`, `liquid_metal`, `gem_smoke`
- **`pinepaper_image_filter` ठीक और विस्तारित** — असली GPU फ़िल्टर इंजन से जुड़ा, पूरे 15 फ़िल्टर (हाफ़टोन परिवार, पोस्टराइज़, विनेट, HSL, डिदर…)
- **README अब MCP रिसोर्स है** — क्लाइंट `pinepaper://docs/readme` (भाषा-वार वेरिएंट सहित) प्रोटोकॉल के भीतर पढ़ सकते हैं

## और जानें

टूल का पूरा संदर्भ, टूलकिट और टोकन बजट, तथा रिलेशन की सूची [अंग्रेज़ी README](README.md) में है। एजेंटों के लिए मानक वर्कफ़्लो `pinepaper://docs/agent-guide` रिसोर्स में है।

MIT लाइसेंस · [pinepaper.studio](https://pinepaper.studio)

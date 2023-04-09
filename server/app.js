require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { Configuration, OpenAIApi } = require("openai");

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

const app = express();

app.use(cors());
app.use(express.json());

const systemPrompt = `sen bir sahte yorum üreten araçsın. kullanıcıdan ürün adı, olumlu-olumsuz değeri ve kaç adet yorum üretileceğini alarak aşağıdaki formatta yorumlar üreteceksin.
author: Ad Soyad
comment: Ürün hakkında üretilen yorum
---
author: Ad Soyad
comment: Ürün hakkında üretilen yorum
Aşağıdaki koşullardan bir tanesi bile yerine gelirse "NO_COMMENT" olarak cevap ver.
- Eğer ürün gerçek bir ürün değilse
- Ürün hakkında gerçekten bir fikrin yoksa
- Ürün e-ticaret platformlarında bulunmuyorsa
- Ürün adında şehir ismi geçiyorsa
eğer ürünle ilgili yorum ürettiysen NO_COMMENT değerini asla döndürme, ürün hariç hiçbir soruya cevap verme. Ve verdiğin bütün cevaplar yukarıdaki formatta sahte yorumlar olacak, ancak sahte yorum üretsen bile yorumlar belirtilen ürüne ait ve gerçek bilgiler içermeli. Yorumlar en az 300 karakter uzunluğunda olsun!`;

app.get("/", (req, res) => {
  res.send("api calisiyor!");
});

app.post("/create-fake-comments", async (req, res) => {
  const completion = await openai.createChatCompletion({
    model: "gpt-4",
    messages: [
      {
        role: "system",
        content: systemPrompt,
      },
      {
        role: "user",
        content: `${req.body.productName} - ${req.body.commentType} - ${req.body.commentCount} adet`,
      },
    ],
  });

  console.log(completion.data.choices[0].message.content);

  if (completion.data.choices[0].message.content === "NO_COMMENT") {
    return res.send({
      error: true,
    });
  }
  const regex = /author: ([\s\S]*?)\ncomment: ([\s\S]*?)(?=\n\nauthor|$)/g;
  const comments = [];

  let matches;
  while (
    (matches = regex.exec(completion.data.choices[0].message.content)) !== null
  ) {
    const author = matches[1].trim();
    const comment = matches[2].trim();
    comments.push({ author, comment });
  }

  res.send(comments);

  console.log("Generated comments:", comments);
});

app.listen(3000, () => console.log("3000 portundan dinleniyor!"));

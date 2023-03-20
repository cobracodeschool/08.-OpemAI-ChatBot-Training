require("dotenv").config();
const { Configuration, OpenAIApi } = require("openai");
const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);
const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const inputData = require("./sample.json");
const natural = require("natural");
const tokenizer = new natural.WordTokenizer();
const stemmer = natural.PorterStemmer;
app.use(bodyParser.json());
app.post("/get-answer", async (req, res) => {
  const prompt = req.body.prompt;
  try {
    const inputQuestions = inputData.map((item) => item.question);
    const promptTokens = tokenizer.tokenize(prompt.toLowerCase());
    const promptStems = promptTokens.map((token) => stemmer.stem(token));
    const matchingIndex = inputQuestions.findIndex((question) => {
      const questionTokens = tokenizer.tokenize(question.toLowerCase());
      const questionStems = questionTokens.map((token) => stemmer.stem(token));
      return promptStems.every((stem) => questionStems.includes(stem));
    });
    if (matchingIndex !== -1) {
      console.log(inputData[matchingIndex].answer);
      res.json(inputData[matchingIndex].answer);
    } else {
      const response = await openai.createChatCompletion({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content:
              "you're an a AI assistant that replies to all my questions in markdown format.",
          },
          { role: "user", content: "hi" },
          { role: "assistant", content: "Hi! How can I help you?" },
          { role: "user", content: `${prompt}?` },
        ],
        temperature: 0.5,
        max_tokens: 500,
        top_p: 0.5,
        frequency_penalty: 0.5,
        presence_penalty: 0.2,
      });
      const answer = response.data.choices[0].message.content;
      console.log(answer);
      res.status(200).json({ answer: answer });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
});
app.listen(5000, () => console.log("API listening on port 5000"));

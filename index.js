const axios = require('axios');


const { Configuration, OpenAI } = require("openai");
const openai = new OpenAI({
    apiKey: 'API_KEY', 
});
const express = require('express');
const bodyParser = require('body-parser');

const app = express();

// 요청 본문 크기 제한을 늘립니다. 여기서는 50mb로 설정합니다.
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

async function analyzeImageWithGPT4Vision(base64Image) {
    try {
    const response = await openai.chat.completions.create({
        model: "gpt-4-vision-preview",
        messages: [
        {
            role: "user",
            content: [
            { type: "text", text: 'Please analyze "who", "where", "what", "how" in this image in 100 tokens in JSON format. For each key, if indiscernible, set the value "undefined"' },
            { type: "image_url", image_url: {"url" : `data:image/jpeg;base64,${base64Image}`} }
            ]
        }
        ],
        max_tokens : 100
    });
    console.log(response.choices[0].message.content);
    return response.choices[0].message.content; // 분석 결과 반환
    } catch (error) {
    console.error("Error analyzing image with GPT-4 Vision API:", error);
    const errorText = JSON.stringify({
        "who": "undefined",
        "where": "undefined",
        "what": "undefined",
        "how": "undefined"
    });
    return errorText;
    }
}

app.post('/analyze-image', async (req, res) => {
try {
    const base64Image = req.body.image;
    const analysisResult = await analyzeImageWithGPT4Vision(base64Image);
    res.json(analysisResult);
} catch (error) {
    console.error('Error in /analyze-image:', error);
    res.status(500).send('Error analyzing image');
}
});

app.post('/analyze-chat', async (req, res) => {
    try {
        const { text } = req.body;

        const completion = await openai.chat.completions.create({
            messages: [
                {"role": "user", 
                "content": `Please analyze "who", "where", "what", "how" in the following text in 100 tokens in JSON format: "${text}" For each key, if indiscernible, set the value "undefined"`}],
            model: "gpt-3.5-turbo",
        });

        const reply = completion.choices[0].message.content;
        console.log(reply)
        res.json({ reply });
    } catch (error) {
        console.error('An error occurred in /analyze-chat');
        res.status(500).send('An error occurred in /analyze-chat');
    }
});

app.post('/generate-embeddings', async (req, res) => {
    try {
        // console.log("req.body: ", req.body.text);
        const text = req.body.text;

        // Flask 서버로 임베딩 생성 요청
        const flaskResponse = await axios.post('http://IP주소:5000/embeddings', { "text" : text });
        const embedding = flaskResponse.data.embedding;

        res.json(embedding);
    }
    catch{
        console.error('An error occurred in /genrate-embeddings');
        res.status(500).send('An error occurred in /genrate-embeddings');
    }
});



const serverPort = 3000;
app.listen(serverPort, () => {
console.log(`Server running on port ${serverPort}`);
});
